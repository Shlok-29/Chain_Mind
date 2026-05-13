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
    if isinstance(data, (np.int64, np.int32, np.int16, np.int8)):
        return int(data)
    if isinstance(data, (np.float64, np.float32)):
        if np.isnan(data) or np.isinf(data):
            return None
        return float(data)
    if isinstance(data, (np.ndarray,)):
        return data.tolist()
    if isinstance(data, (datetime, pd.Timestamp)):
        return data.strftime('%Y-%m-%d %H:%M:%S')
    # Handle NaN in strings or other types if pandas returns them
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
    
    results = run_agent_pipeline(
        inv_df, dem_df, sup_df, req.industry, 
        use_llm=req.use_llm, api_key=req.api_key
    )
    
    state.agent_results = results
    state.last_industry = req.industry
    
    return convert_to_serializable(results)

@app.get("/agents/results")
def get_agent_results():
    return convert_to_serializable(state.agent_results)

@app.post("/simulation/disruption")
def toggle_disruption(req: DisruptionRequest):
    state.disruption_active = req.active
    if req.active:
        state.disruption_type = req.type or random.choice([
            "Flood in supplier region",
            "Port strike at JNPT Mumbai",
            "Raw material shortage",
            "Customs hold for 7 days",
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
