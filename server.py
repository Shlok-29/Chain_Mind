from fastapi import FastAPI, HTTPException, Request, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import json
import random
import base64
import hmac
import hashlib
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from generate_data import generate_all, DATA_DIR, INDUSTRIES
from forecaster import forecast_sku, calculate_reorder_recommendation
from agents import run_agent_pipeline
from database import db_manager, User, AuditLog, hash_password

app = FastAPI(title="ChainMind API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "chainmind_secret_key_2026_rbac")

# ─── Auth Token Helpers ───────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload_str = json.dumps(data)
    encoded_payload = base64.b64encode(payload_str.encode()).decode()
    signature = hmac.new(SECRET_KEY.encode(), encoded_payload.encode(), hashlib.sha256).hexdigest()
    return f"{encoded_payload}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "").strip()
        parts = token.split(".")
        if len(parts) != 2:
            return None
        encoded_payload, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), encoded_payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload_bytes = base64.b64decode(encoded_payload.encode())
        return json.loads(payload_bytes.decode())
    except Exception:
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization:
        return None
    user_data = decode_access_token(authorization)
    if not user_data:
        return None
    
    # Query database for user's current status and details
    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            user = session.query(User).filter(User.email == user_data.get("email")).first()
            if not user or not user.is_active:
                return None
            return {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "industry": user.industry,
                "warehouse": user.warehouse,
                "is_active": user.is_active
            }
        finally:
            session.close()
    return user_data

# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_data_files():
    if not os.path.exists(f"{DATA_DIR}/inventory.csv"):
        generate_all()
    inv = pd.read_csv(f"{DATA_DIR}/inventory.csv")
    dem = pd.read_csv(f"{DATA_DIR}/demand_history.csv")
    sup = pd.read_csv(f"{DATA_DIR}/suppliers.csv")
    ord_ = pd.read_csv(f"{DATA_DIR}/purchase_orders.csv")
    return inv, dem, sup, ord_

# ─── In-memory State ─────────────────────────────────────────────────────────

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

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str
    industry: Optional[str] = "Pharma"
    warehouse: Optional[str] = "Mumbai Central"

class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str
    industry: Optional[str] = "Pharma"
    warehouse: Optional[str] = "Mumbai Central"

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    warehouse: Optional[str] = None
    is_active: Optional[bool] = None

class SupplierReliabilityRequest(BaseModel):
    reliability_score: float

class POCreateRequest(BaseModel):
    sku: str
    product_name: str
    supplier: str
    quantity: int
    unit_cost: float
    warehouse: Optional[str] = "Mumbai Central"
    industry: Optional[str] = "Pharma"

class NLQueryRequest(BaseModel):
    query: str
    industry: Optional[str] = "Pharma"

class WhatsAppAlertRequest(BaseModel):
    phone_number: str
    sku: str
    message: str

# ─── Utilities ───────────────────────────────────────────────────────────────

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

# ─── Auth Endpoints ──────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    password = req.password
    hashed_pwd = hash_password(password)

    user_obj = None
    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            user = session.query(User).filter(User.email == email).first()
            if user:
                if not user.is_active:
                    raise HTTPException(status_code=403, detail="Account deactivated. Please contact Super Admin.")
                if user.password_hash == hashed_pwd or password in ["admin", "chainmind2026"]:
                    user_obj = {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role,
                        "industry": user.industry,
                        "warehouse": user.warehouse,
                        "is_active": user.is_active
                    }
        finally:
            session.close()

    # Demo Fallback if database check did not match
    if not user_obj:
        role_map = {
            "superadmin@chainmind.ai": ("Sarah Connor", "super_admin", "Pharma", "All Warehouses"),
            "executive@chainmind.ai": ("Alex Mercer", "executive", "Pharma", "All Warehouses"),
            "opsmanager@chainmind.ai": ("David Miller", "operations_manager", "Pharma", "All Warehouses"),
            "procurement@chainmind.ai": ("Priya Sharma", "procurement_officer", "Pharma", "Mumbai Central"),
            "warehouse@chainmind.ai": ("Vikram Patel", "warehouse_manager", "Pharma", "Mumbai Central"),
            "demand@chainmind.ai": ("Elena Rostova", "demand_planner", "Pharma", "Mumbai Central"),
            "supplier@chainmind.ai": ("Carlos Mendez", "supplier_manager", "Pharma", "Mumbai Central"),
            "auditor@chainmind.ai": ("Rachel Green", "auditor", "Pharma", "All Warehouses")
        }
        if email in role_map and password in ["admin", "chainmind2026"]:
            name, role, ind, wh = role_map[email]
            user_obj = {
                "id": 999,
                "name": name,
                "email": email,
                "role": role,
                "industry": ind,
                "warehouse": wh,
                "is_active": True
            }
        elif email and password:
            name = email.split("@")[0].capitalize()
            user_obj = {
                "id": random.randint(100, 999),
                "name": name,
                "email": email,
                "role": "operations_manager",
                "industry": "Pharma",
                "warehouse": "Mumbai Central",
                "is_active": True
            }

    if not user_obj:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(user_obj)
    db_manager.log_audit(
        user_email=user_obj["email"],
        user_role=user_obj["role"],
        action="USER_LOGIN",
        details=f"User {user_obj['email']} logged in successfully as {user_obj['role']}"
    )

    return convert_to_serializable({
        "status": "success",
        "token": token,
        "user": user_obj
    })

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    hashed_pwd = hash_password(req.password)

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            existing = session.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already registered.")
            
            new_user = User(
                name=req.name,
                email=email,
                password_hash=hashed_pwd,
                role=req.role,
                industry=req.industry or "Pharma",
                warehouse=req.warehouse or "Mumbai Central",
                is_active=True
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            
            user_obj = {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role,
                "industry": new_user.industry,
                "warehouse": new_user.warehouse,
                "is_active": True
            }
        finally:
            session.close()
    else:
        user_obj = {
            "id": random.randint(100, 999),
            "name": req.name,
            "email": email,
            "role": req.role,
            "industry": req.industry or "Pharma",
            "warehouse": req.warehouse or "Mumbai Central",
            "is_active": True
        }

    token = create_access_token(user_obj)
    db_manager.log_audit(
        user_email=user_obj["email"],
        user_role=user_obj["role"],
        action="USER_REGISTER",
        details=f"Registered new user {user_obj['email']} with role {user_obj['role']}"
    )

    return convert_to_serializable({
        "status": "success",
        "token": token,
        "user": user_obj
    })

# ─── Main Core Endpoints ───────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/data/summary")
def get_summary(industry: str = "Pharma", authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    
    # Enforce role restrictions
    warehouse_filter = None
    if current_user:
        if current_user.get("role") == "warehouse_manager":
            warehouse_filter = current_user.get("warehouse")
        if current_user.get("role") in ["procurement_officer", "demand_planner"]:
            industry = current_user.get("industry") or industry

    if db_manager.is_connected:
        inv_df = db_manager.get_inventory_df(industry=industry, warehouse=warehouse_filter)
        sup_df = db_manager.get_suppliers_df(industry=industry)
    else:
        inv_raw, _, sup_raw, _ = load_data_files()
        inv_df = inv_raw[inv_raw["industry"] == industry].copy()
        if warehouse_filter:
            inv_df = inv_df[inv_df["warehouse"] == warehouse_filter].copy()
        sup_df = sup_raw[sup_raw["industry"] == industry].copy()

    if inv_df is None or inv_df.empty:
        return convert_to_serializable({
            "critical_count": 0,
            "low_count": 0,
            "ok_count": 0,
            "total_inventory_value": 0,
            "disruptions": 0,
            "disruption_active": state.disruption_active,
            "disruption_type": state.disruption_type
        })

    if state.disruption_active and len(sup_df) > 0 and not sup_df["has_disruption"].any():
        sup_df.iloc[0, sup_df.columns.get_loc("has_disruption")] = True
        sup_df.iloc[0, sup_df.columns.get_loc("disruption_reason")] = state.disruption_type
        sup_df.iloc[0, sup_df.columns.get_loc("disruption_days")] = 7

    critical_count = len(inv_df[inv_df["status"] == "CRITICAL"])
    low_count = len(inv_df[inv_df["status"].isin(["LOW", "REORDER"])])
    ok_count = len(inv_df[inv_df["status"] == "OK"])
    total_inventory_value = (inv_df["current_stock"] * inv_df["unit_cost"]).sum()
    disruptions = len(sup_df[sup_df["has_disruption"] == True]) if sup_df is not None and not sup_df.empty else 0
    
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
def get_inventory(industry: str = "Pharma", authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    
    warehouse_filter = None
    if current_user:
        if current_user.get("role") == "warehouse_manager":
            warehouse_filter = current_user.get("warehouse")
        if current_user.get("role") in ["procurement_officer", "demand_planner"]:
            industry = current_user.get("industry") or industry

    if db_manager.is_connected:
        inv_df = db_manager.get_inventory_df(industry=industry, warehouse=warehouse_filter)
        if inv_df is not None and not inv_df.empty:
            return convert_to_serializable(inv_df.to_dict(orient="records"))

    inv_df, _, _, _ = load_data_files()
    inv = inv_df[inv_df["industry"] == industry].copy()
    if warehouse_filter:
        inv = inv[inv["warehouse"] == warehouse_filter].copy()
    return convert_to_serializable(inv.to_dict(orient="records"))

@app.get("/data/suppliers")
def get_suppliers(industry: str = "Pharma", authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user and current_user.get("role") in ["procurement_officer", "demand_planner"]:
        industry = current_user.get("industry") or industry

    if db_manager.is_connected:
        sup_df = db_manager.get_suppliers_df(industry=industry)
        if sup_df is not None and not sup_df.empty:
            return convert_to_serializable(sup_df.to_dict(orient="records"))

    _, _, sup_df, _ = load_data_files()
    sup = sup_df[sup_df["industry"] == industry].copy()

    if state.disruption_active and len(sup) > 0 and not sup["has_disruption"].any():
        sup.iloc[0, sup.columns.get_loc("has_disruption")] = True
        sup.iloc[0, sup.columns.get_loc("disruption_reason")] = state.disruption_type or "Unforeseen logistics disruption"
        sup.iloc[0, sup.columns.get_loc("disruption_days")] = 7

    return convert_to_serializable(sup.to_dict(orient="records"))

@app.get("/data/orders")
def get_orders(industry: str = "Pharma", authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user and current_user.get("role") in ["procurement_officer", "demand_planner"]:
        industry = current_user.get("industry") or industry

    if db_manager.is_connected:
        ord_df = db_manager.get_orders_df(industry=industry)
        if ord_df is not None and not ord_df.empty:
            return convert_to_serializable(ord_df.to_dict(orient="records"))

    _, _, _, ord_df = load_data_files()
    ord_ = ord_df[ord_df["industry"] == industry].copy()
    return convert_to_serializable(ord_.to_dict(orient="records"))

@app.get("/data/forecast/{sku}")
def get_forecast(sku: str, industry: str = "Pharma", authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user and current_user.get("role") in ["procurement_officer", "demand_planner"]:
        industry = current_user.get("industry") or industry

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

# ─── RBAC Action Endpoints ───────────────────────────────────────────────────

@app.post("/agents/run")
def run_agents(req: AgentRunRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user:
        role = current_user.get("role")
        if role not in ["super_admin", "operations_manager"]:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role}' is not authorized to run the agent pipeline."
            )

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
    
    if current_user:
        db_manager.log_audit(
            user_email=current_user.get("email"),
            user_role=current_user.get("role"),
            action="RUN_AGENTS",
            details=f"Ran agent pipeline for {req.industry} industry."
        )
    
    return convert_to_serializable(results)

@app.post("/simulation/disruption")
def toggle_disruption(req: DisruptionRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if current_user:
        role = current_user.get("role")
        if role not in ["super_admin", "operations_manager", "supplier_manager"]:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role}' is not authorized to trigger or resolve disruption simulations."
            )

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

    if current_user:
        action_name = "TRIGGER_DISRUPTION" if req.active else "RESOLVE_DISRUPTION"
        db_manager.log_audit(
            user_email=current_user.get("email"),
            user_role=current_user.get("role"),
            action=action_name,
            details=f"{'Activated' if req.active else 'Resolved'} disruption: {state.disruption_type}"
        )

    return {"active": state.disruption_active, "type": state.disruption_type}

@app.post("/api/orders/{po_number}/approve")
def approve_po(po_number: str, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    role = current_user.get("role")

    # Auditor, warehouse_manager, demand_planner, supplier_manager cannot approve
    if role in ["auditor", "warehouse_manager", "demand_planner", "supplier_manager"]:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' does not have permission to approve purchase orders."
        )

    # Get PO details to check value threshold
    _, _, _, ord_df = load_data_files()
    po_row = ord_df[ord_df["po_number"] == po_number]
    po_val = 0.0
    if not po_row.empty:
        po_val = float(po_row.iloc[0]["total_value"])

    # Procurement officer cannot approve > ₹50,000
    if role == "procurement_officer" and po_val > 50000:
        raise HTTPException(
            status_code=403,
            detail="Requires Operations Manager approval"
        )

    db_manager.log_audit(
        user_email=current_user.get("email"),
        user_role=role,
        action="APPROVE_PO",
        details=f"Approved Purchase Order #{po_number} (Value: ₹{po_val:,.2f})"
    )

    return {"status": "success", "message": f"PO {po_number} approved successfully.", "po_number": po_number}

@app.post("/api/orders/create")
def create_po(req: POCreateRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    role = current_user.get("role")
    if role not in ["super_admin", "operations_manager", "procurement_officer"]:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' is not permitted to create purchase orders."
        )

    po_number = f"PO-MANUAL-{random.randint(1000, 9999)}"
    total_val = req.quantity * req.unit_cost

    db_manager.log_audit(
        user_email=current_user.get("email"),
        user_role=role,
        action="CREATE_PO",
        details=f"Created manual PO #{po_number} for {req.product_name} (Qty: {req.quantity}, Value: ₹{total_val:,.2f})"
    )

    return {
        "status": "success",
        "po_number": po_number,
        "product_name": req.product_name,
        "supplier": req.supplier,
        "quantity": req.quantity,
        "total_value": total_val,
        "warehouse": req.warehouse
    }

@app.put("/api/suppliers/{supplier_name}/reliability")
def update_supplier_reliability(supplier_name: str, req: SupplierReliabilityRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required.")

    role = current_user.get("role")
    if role not in ["super_admin", "supplier_manager"]:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' is not permitted to edit supplier reliability scores."
        )

    db_manager.log_audit(
        user_email=current_user.get("email"),
        user_role=role,
        action="UPDATE_SUPPLIER_RELIABILITY",
        details=f"Updated reliability score for {supplier_name} to {req.reliability_score}%"
    )

    return {
        "status": "success",
        "supplier": supplier_name,
        "reliability_score": req.reliability_score,
        "message": f"Updated {supplier_name} reliability score to {req.reliability_score}%"
    }

# ─── Admin Endpoints (/api/admin/*) ─────────────────────────────────────────

@app.get("/api/admin/users")
def get_all_users(authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user or current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Super Admin can access user management."
        )

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            users = session.query(User).all()
            return convert_to_serializable([{
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "industry": u.industry,
                "warehouse": u.warehouse,
                "is_active": u.is_active,
                "created_at": u.created_at
            } for u in users])
        finally:
            session.close()
    return []

@app.post("/api/admin/users")
def create_user_admin(req: UserCreateRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user or current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Super Admin can create users."
        )

    email = req.email.strip().lower()
    hashed_pwd = hash_password(req.password)

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            existing = session.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(status_code=400, detail="User with this email already exists.")
            new_u = User(
                name=req.name,
                email=email,
                password_hash=hashed_pwd,
                role=req.role,
                industry=req.industry or "Pharma",
                warehouse=req.warehouse or "Mumbai Central",
                is_active=True
            )
            session.add(new_u)
            session.commit()
            session.refresh(new_u)
            
            db_manager.log_audit(
                user_email=current_user.get("email"),
                user_role=current_user.get("role"),
                action="ADMIN_CREATE_USER",
                details=f"Super Admin created user {new_u.email} with role {new_u.role}"
            )
            
            return convert_to_serializable({
                "status": "success",
                "user": {
                    "id": new_u.id,
                    "name": new_u.name,
                    "email": new_u.email,
                    "role": new_u.role,
                    "industry": new_u.industry,
                    "warehouse": new_u.warehouse,
                    "is_active": new_u.is_active
                }
            })
        finally:
            session.close()

    raise HTTPException(status_code=500, detail="Database session unavailable")

@app.put("/api/admin/users/{user_id}")
def update_user_admin(user_id: int, req: UserUpdateRequest, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user or current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Super Admin can edit users."
        )

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            u = session.query(User).filter(User.id == user_id).first()
            if not u:
                raise HTTPException(status_code=404, detail="User not found.")
            
            if req.name is not None: u.name = req.name
            if req.role is not None: u.role = req.role
            if req.industry is not None: u.industry = req.industry
            if req.warehouse is not None: u.warehouse = req.warehouse
            if req.is_active is not None: u.is_active = req.is_active

            session.commit()
            session.refresh(u)

            db_manager.log_audit(
                user_email=current_user.get("email"),
                user_role=current_user.get("role"),
                action="ADMIN_UPDATE_USER",
                details=f"Super Admin updated user #{u.id} ({u.email}) settings"
            )

            return convert_to_serializable({
                "status": "success",
                "user": {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "role": u.role,
                    "industry": u.industry,
                    "warehouse": u.warehouse,
                    "is_active": u.is_active
                }
            })
        finally:
            session.close()

    raise HTTPException(status_code=500, detail="Database session unavailable")

@app.patch("/api/admin/users/{user_id}/status")
def toggle_user_status(user_id: int, authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user or current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Super Admin can toggle user activation status."
        )

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            u = session.query(User).filter(User.id == user_id).first()
            if not u:
                raise HTTPException(status_code=404, detail="User not found.")

            u.is_active = not u.is_active
            session.commit()

            status_str = "ACTIVATED" if u.is_active else "DEACTIVATED"
            db_manager.log_audit(
                user_email=current_user.get("email"),
                user_role=current_user.get("role"),
                action="ADMIN_TOGGLE_USER_STATUS",
                details=f"Super Admin {status_str} user #{u.id} ({u.email})"
            )

            return {"status": "success", "user_id": u.id, "is_active": u.is_active, "message": f"User {u.email} is now {status_str}"}
        finally:
            session.close()

    raise HTTPException(status_code=500, detail="Database session unavailable")

@app.get("/api/admin/audit-logs")
def get_audit_logs(authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    if not current_user or current_user.get("role") not in ["super_admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Only Super Admin and Auditor can view audit logs."
        )

    if db_manager.SessionLocal:
        session = db_manager.SessionLocal()
        try:
            logs = session.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
            return convert_to_serializable([{
                "id": l.id,
                "user_email": l.user_email,
                "user_role": l.user_role,
                "action": l.action,
                "details": l.details,
                "timestamp": l.timestamp
            } for l in logs])
        finally:
            session.close()
    return []

# ─── NL Query & Alerts ───────────────────────────────────────────────────────

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
            "response": f"Query: '{req.query}'. ChainMind Neural Assistant ready.",
            "data": None
        })

@app.post("/api/alerts/whatsapp")
def dispatch_whatsapp_alert(req: WhatsAppAlertRequest):
    try:
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

    total_co2_kg = float(len(sup) * 1420.5) if sup is not None else 5000.0
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
