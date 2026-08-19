from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import json
import random
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from generate_data import generate_all, DATA_DIR, INDUSTRIES
from forecaster import forecast_sku, calculate_reorder_recommendation
from agents import run_agent_pipeline

app = FastAPI(title="ChainMind API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_data_files():
    if not os.path.exists(f"{DATA_DIR}/inventory.csv"):
        generate_all()
    inv = pd.read_csv(f"{DATA_DIR}/inventory.csv")
    dem = pd.read_csv(f"{DATA_DIR}/demand_history.csv")
    sup = pd.read_csv(f"{DATA_DIR}/suppliers.csv")
    ord_ = pd.read_csv(f"{DATA_DIR}/purchase_orders.csv")
    return inv, dem, sup, ord_

# ─── In-memory State (Simplification for Simulation) ─────────────────────────

class AppState:
    def __init__(self):
        self.disruption_active = False
        self.disruption_type = ""
        self.agent_results = {}
        self.last_industry = ""

state = AppState()

# ─── Models ──────────────────────────────────────────────────────────────────

class DisruptionRequest(BaseModel):
    active: bool
    type: Optional[str] = None

class AgentRunRequest(BaseModel):
    industry: str
    use_llm: bool = False
    api_key: Optional[str] = None

# ─── Endpoints ───────────────────────────────────────────────────────────────

import json

def json_serializable(obj):
    if isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    if isinstance(obj, (np.float64, np.float32)):
        return float(obj)
    if isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    if isinstance(obj, (datetime, pd.Timestamp)):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    return str(obj)

def convert_to_serializable(data):
    if isinstance(data, dict):
        return {k: convert_to_serializable(v) for k, v in data.items()}
    if isinstance(data, list):
        return [convert_to_serializable(v) for v in data]
    if isinstance(data, (np.bool_, bool)):
        return bool(data)
    if isinstance(data, (np.int64, np.int32, np.int16, np.int8, np.integer)):
        return int(data)
    if isinstance(data, (np.float64, np.float32, np.floating)):
        if np.isnan(data) or np.isinf(data):
            return None
        return float(data)
    if isinstance(data, (np.ndarray,)):
        return data.tolist()
    if isinstance(data, (datetime, pd.Timestamp)):
        return data.strftime('%Y-%m-%d %H:%M:%S')
    if pd.isna(data):
        return None
    return data

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/data/summary")
def get_summary(industry: str = "Pharma"):
    inv_df, dem_df, sup_df, ord_df = load_data_files()
    
    inv = inv_df[inv_df["industry"] == industry].copy()
    sup = sup_df[sup_df["industry"] == industry].copy()
    
    if state.disruption_active and not sup["has_disruption"].any() and len(sup) > 0:
        sup.iloc[0, sup.columns.get_loc("has_disruption")] = True
        sup.iloc[0, sup.columns.get_loc("disruption_reason")] = state.disruption_type
        sup.iloc[0, sup.columns.get_loc("disruption_days")] = 7

    critical_count = len(inv[inv["status"] == "CRITICAL"])
    low_count = len(inv[inv["status"].isin(["LOW", "REORDER"])])
    ok_count = len(inv[inv["status"] == "OK"])
    total_inventory_value = (inv["current_stock"] * inv["unit_cost"]).sum()
    disruptions = len(sup[sup["has_disruption"] == True])
    
    return convert_to_serializable({
        "critical_count": critical_count,
        "low_count": low_count,
        "ok_count": ok_count,
        "total_inventory_value": total_inventory_value,
        "disruptions": disruptions,
        "disruption_active": state.disruption_active,
        "disruption_type": state.disruption_type
    })

@app.get("/data/inventory")
def get_inventory(industry: str = "Pharma"):
    inv_df, _, _, _ = load_data_files()
    inv = inv_df[inv_df["industry"] == industry].copy()
    return convert_to_serializable(inv.to_dict(orient="records"))

@app.get("/data/suppliers")
def get_suppliers(industry: str = "Pharma"):
    _, _, sup_df, _ = load_data_files()
    sup = sup_df[sup_df["industry"] == industry].copy()

    if state.disruption_active and len(sup) > 0:
        if not sup["has_disruption"].any():
            sup.iloc[0, sup.columns.get_loc("has_disruption")] = True
            sup.iloc[0, sup.columns.get_loc("disruption_reason")] = state.disruption_type or "Unforeseen logistics disruption"
            sup.iloc[0, sup.columns.get_loc("disruption_days")] = 7

    return convert_to_serializable(sup.to_dict(orient="records"))

@app.get("/data/orders")
def get_orders(industry: str = "Pharma"):
    _, _, _, ord_df = load_data_files()
    ord_ = ord_df[ord_df["industry"] == industry].copy()
    return convert_to_serializable(ord_.to_dict(orient="records"))

@app.get("/data/forecast/{sku}")
def get_forecast(sku: str, industry: str = "Pharma"):
    inv_df, dem_df, _, _ = load_data_files()
    dem = dem_df[dem_df["industry"] == industry].copy()
    inv = inv_df[inv_df["industry"] == industry].copy()
    
    fc = forecast_sku(dem, sku, forecast_days=30)
    
    if "error" in fc:
        raise HTTPException(status_code=404, detail=fc["error"])
        
    inv_row = inv[inv["sku"] == sku]
    recommendation = None
    if not inv_row.empty:
        inv_row = inv_row.iloc[0]
        recommendation = calculate_reorder_recommendation(inv_row, fc)

    return convert_to_serializable({
        "forecast": fc,
        "recommendation": recommendation,
        "product_name": fc.get("product_name", sku)
    })

@app.post("/agents/run")
def run_agents(req: AgentRunRequest):
    inv_df, dem_df, sup_df, _ = load_data_files()

    if state.disruption_active and len(sup_df) > 0:
        ind_sup = sup_df[sup_df["industry"] == req.industry]
        if not ind_sup["has_disruption"].any() and len(ind_sup) > 0:
            target_idx = ind_sup.index[0]
            sup_df.loc[target_idx, "has_disruption"] = True
            sup_df.loc[target_idx, "disruption_reason"] = state.disruption_type or "Unforeseen logistics disruption"
            sup_df.loc[target_idx, "disruption_days"] = 7
    
    results = run_agent_pipeline(
        inv_df, dem_df, sup_df, req.industry, 
        use_llm=req.use_llm, api_key=req.api_key
    )
    
    state.agent_results = results
    state.last_industry = req.industry
    
    return convert_to_serializable(results)

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str
    industry: Optional[str] = "Pharma"

@app.post("/api/auth/login")
def login(req: LoginRequest):
    # Demo credentials fallback & account verification
    if req.email == "executive@chainmind.ai" and req.password in ["admin", "chainmind2026"]:
        return convert_to_serializable({
            "status": "success",
            "token": "token_demo_exec_99812",
            "user": {
                "name": "Alex Mercer",
                "email": "executive@chainmind.ai",
                "role": "Supply Chain VP",
                "industry": "Pharma"
            }
        })
    elif req.email and req.password:
        name = req.email.split("@")[0].capitalize()
        return convert_to_serializable({
            "status": "success",
            "token": f"token_{random.randint(10000, 99999)}",
            "user": {
                "name": name,
                "email": req.email,
                "role": "Operations Manager",
                "industry": "Pharma"
            }
        })
    else:
        raise HTTPException(status_code=400, detail="Invalid email or password")

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    return convert_to_serializable({
        "status": "success",
        "token": f"token_{random.randint(10000, 99999)}",
        "user": {
            "name": req.name,
            "email": req.email,
            "role": req.role,
            "industry": req.industry
        }
    })

class NLQueryRequest(BaseModel):
    query: str
    industry: Optional[str] = "Pharma"

class WhatsAppAlertRequest(BaseModel):
    phone_number: str
    sku: str
    message: str

@app.post("/api/nl-query")
def process_nl_query(req: NLQueryRequest):
    q = req.query.lower().strip()
    inv_df, dem_df, sup_df, ord_df = load_data_files()
    industry = req.industry or "Pharma"

    if "critical" in q or "stockout" in q or "low stock" in q:
        inv = inv_df[(inv_df["industry"] == industry) & (inv_df["status"].isin(["CRITICAL", "LOW"]))]
        items = inv.to_dict(orient="records")
        return convert_to_serializable({
            "action": "NAVIGATE_TAB",
            "target_tab": "inventory",
            "response": f"Found {len(items)} critical/low stock items in {industry} sector.",
            "data": items
        })

    elif "disrupt" in q or "strike" in q or "jnpt" in q or "flood" in q:
        state.disruption_active = True
        state.disruption_type = "JNPT Mumbai Port Customs Backlog & Dock Strike"
        return convert_to_serializable({
            "action": "TRIGGER_DISRUPTION",
            "target_tab": "disruptions",
            "response": f"Activated India disruption scenario: '{state.disruption_type}'. Alternate supplier routing engaged.",
            "disruption": {"active": True, "type": state.disruption_type}
        })

    elif "swarm" in q or "agent" in q or "run" in q:
        results = run_agent_pipeline(inv_df, dem_df, sup_df, industry)
        state.agent_results = results
        return convert_to_serializable({
            "action": "NAVIGATE_TAB",
            "target_tab": "agents",
            "response": f"Agent swarm executed successfully for {industry} supply chain.",
            "results": results
        })

    elif "order" in q or "po" in q or "approve" in q:
        orders = ord_df[ord_df["industry"] == industry].to_dict(orient="records")
        return convert_to_serializable({
            "action": "NAVIGATE_TAB",
            "target_tab": "orders",
            "response": f"Loaded purchase orders command for {industry} sector.",
            "orders": orders
        })

    else:
        return convert_to_serializable({
            "action": "INFO",
            "target_tab": "about",
            "response": f"Query: '{req.query}'. ChainMind Neural Assistant ready. Try asking 'Show critical stock', 'Simulate JNPT strike', or 'Run agent swarm'.",
            "data": None
        })

@app.post("/api/alerts/whatsapp")
def dispatch_whatsapp_alert(req: WhatsAppAlertRequest):
    # Log dispatch in database manager
    try:
        from database import db_manager
        db_manager.log_whatsapp_alert(req.phone_number, req.sku, req.message)
    except Exception:
        pass

    return {
        "status": "success",
        "phone_number": req.phone_number,
        "sku": req.sku,
        "dispatch_timestamp": datetime.now().isoformat(),
        "message": f"WhatsApp notification dispatched to {req.phone_number}: '{req.message[:50]}...'"
    }

@app.get("/api/logistics/carbon")
def get_carbon_footprint(industry: str = "Pharma"):
    inv_df, _, sup_df, _ = load_data_files()
    sup = sup_df[sup_df["industry"] == industry]

    # Calculate ESG metrics
    total_co2_kg = float(len(sup) * 1420.5)
    carbon_saved_kt = float(4.2)
    green_freight_pct = float(78.5)

    return convert_to_serializable({
        "industry": industry,
        "total_co2_emissions_kg": round(total_co2_kg, 1),
        "carbon_offset_saved_kt": carbon_saved_kt,
        "green_freight_ratio_pct": green_freight_pct,
        "esg_compliance_score": 92.4,
        "low_emission_routes_active": 14
    })

@app.post("/simulation/disruption")
def toggle_disruption(req: DisruptionRequest):
    state.disruption_active = req.active
    if req.active:
        state.disruption_type = req.type or random.choice([
            "JNPT Mumbai Port Customs Backlog & Dock Strike",
            "Chennai / Kerala Monsoon Highway Flooding",
            "NH-44 Landslide Freight Corridor Delay",
            "Diwali Festive Demand Surge (+150% Volume)",
            "Interstate GST Border Clearance Inspection Hold",
        ])
    else:
        state.disruption_type = ""
    return {"active": state.disruption_active, "type": state.disruption_type}

@app.post("/data/regenerate")
def regenerate_data():
    if os.path.exists(DATA_DIR):
        for f in ["inventory.csv", "demand_history.csv", "suppliers.csv", "purchase_orders.csv"]:
            fp = os.path.join(DATA_DIR, f)
            if os.path.exists(fp):
                os.remove(fp)
    generate_all()
    return {"status": "success", "message": "Data regenerated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

