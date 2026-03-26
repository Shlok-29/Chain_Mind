"""
ChainMind — Synthetic Dataset Generator
Generates realistic supply chain data for 4 industries:
Pharma, FMCG, Auto Parts, Retail
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

random.seed(42)
np.random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ─── Industry Configs ───────────────────────────────────────────────────────

INDUSTRIES = {
    "Pharma": {
        "products": [
            {"name": "Paracetamol 500mg", "sku": "PH001", "unit": "strips", "lead_days": 7,  "reorder_point": 500,  "max_stock": 3000, "unit_cost": 12},
            {"name": "Amoxicillin 250mg", "sku": "PH002", "unit": "strips", "lead_days": 10, "reorder_point": 300,  "max_stock": 2000, "unit_cost": 45},
            {"name": "Insulin Glargine",  "sku": "PH003", "unit": "vials",  "lead_days": 14, "reorder_point": 200,  "max_stock": 1000, "unit_cost": 380},
            {"name": "Azithromycin 500mg","sku": "PH004", "unit": "strips", "lead_days": 8,  "reorder_point": 400,  "max_stock": 2500, "unit_cost": 85},
            {"name": "Cetirizine 10mg",   "sku": "PH005", "unit": "strips", "lead_days": 5,  "reorder_point": 600,  "max_stock": 3500, "unit_cost": 18},
            {"name": "Metformin 500mg",   "sku": "PH006", "unit": "strips", "lead_days": 6,  "reorder_point": 450,  "max_stock": 2800, "unit_cost": 22},
        ],
        "suppliers": ["MediChem Pvt Ltd", "PharmaSynth India", "GlobalMed Suppliers", "Cipla Bulk"],
        "warehouses": ["Mumbai Central", "Delhi North", "Chennai South", "Hyderabad Hub"],
    },
    "FMCG": {
        "products": [
            {"name": "Surf Excel 1kg",    "sku": "FG001", "unit": "units", "lead_days": 4,  "reorder_point": 800,  "max_stock": 5000, "unit_cost": 95},
            {"name": "Maggi Noodles 70g", "sku": "FG002", "unit": "cartons","lead_days": 3, "reorder_point": 1000, "max_stock": 7000, "unit_cost": 14},
            {"name": "Colgate 200g",      "sku": "FG003", "unit": "units", "lead_days": 5,  "reorder_point": 700,  "max_stock": 4500, "unit_cost": 62},
            {"name": "Tata Salt 1kg",     "sku": "FG004", "unit": "units", "lead_days": 3,  "reorder_point": 1200, "max_stock": 8000, "unit_cost": 20},
            {"name": "Amul Butter 500g",  "sku": "FG005", "unit": "units", "lead_days": 2,  "reorder_point": 500,  "max_stock": 3000, "unit_cost": 285},
            {"name": "Lifebuoy Soap 100g","sku": "FG006", "unit": "units", "lead_days": 4,  "reorder_point": 900,  "max_stock": 6000, "unit_cost": 30},
        ],
        "suppliers": ["HUL Distribution", "ITC Supply Chain", "Nestle India", "Marico Logistics"],
        "warehouses": ["Pune DC", "Bangalore Hub", "Kolkata East", "Ahmedabad West"],
    },
    "Auto Parts": {
        "products": [
            {"name": "Brake Pads Set",    "sku": "AP001", "unit": "sets",  "lead_days": 12, "reorder_point": 150,  "max_stock": 800,  "unit_cost": 1200},
            {"name": "Oil Filter",        "sku": "AP002", "unit": "units", "lead_days": 7,  "reorder_point": 300,  "max_stock": 1500, "unit_cost": 320},
            {"name": "Spark Plug NGK",    "sku": "AP003", "unit": "units", "lead_days": 9,  "reorder_point": 400,  "max_stock": 2000, "unit_cost": 180},
            {"name": "Timing Belt",       "sku": "AP004", "unit": "units", "lead_days": 15, "reorder_point": 100,  "max_stock": 500,  "unit_cost": 2500},
            {"name": "Air Filter",        "sku": "AP005", "unit": "units", "lead_days": 8,  "reorder_point": 250,  "max_stock": 1200, "unit_cost": 450},
            {"name": "Clutch Plate",      "sku": "AP006", "unit": "units", "lead_days": 18, "reorder_point": 80,   "max_stock": 400,  "unit_cost": 3200},
        ],
        "suppliers": ["Bosch India", "Minda Industries", "Sundram Fasteners", "Motherson Group"],
        "warehouses": ["Manesar Plant", "Pune Auto Hub", "Chennai Port", "Sanand Gujarat"],
    },
    "Retail": {
        "products": [
            {"name": "Nike Air Max",      "sku": "RT001", "unit": "pairs", "lead_days": 21, "reorder_point": 50,   "max_stock": 300,  "unit_cost": 3500},
            {"name": "Levi's 511 Jeans",  "sku": "RT002", "unit": "units", "lead_days": 18, "reorder_point": 40,   "max_stock": 250,  "unit_cost": 2200},
            {"name": "Samsung 65\" TV",   "sku": "RT003", "unit": "units", "lead_days": 25, "reorder_point": 15,   "max_stock": 80,   "unit_cost": 55000},
            {"name": "Apple AirPods Pro", "sku": "RT004", "unit": "units", "lead_days": 20, "reorder_point": 30,   "max_stock": 150,  "unit_cost": 18000},
            {"name": "Prestige Cooker 5L","sku": "RT005", "unit": "units", "lead_days": 10, "reorder_point": 60,   "max_stock": 350,  "unit_cost": 1800},
            {"name": "Woodland Boots",    "sku": "RT006", "unit": "pairs", "lead_days": 15, "reorder_point": 45,   "max_stock": 200,  "unit_cost": 2800},
        ],
        "suppliers": ["Reliance Retail DC", "Flipkart B2B", "Metro Cash & Carry", "Amazon B2B India"],
        "warehouses": ["Noida FC", "Mumbai Logistics Park", "Hyderabad DC", "Bengaluru Hub"],
    },
}

DISRUPTION_TYPES = [
    "Supplier delay due to heavy rainfall",
    "Port congestion at JNPT Mumbai",
    "Raw material shortage",
    "Truck driver strike",
    "Quality hold by QA team",
    "Customs clearance delay",
    "Factory shutdown for maintenance",
    "Flood disruption in supplier region",
]


def generate_inventory(industry_name: str, config: dict) -> pd.DataFrame:
    rows = []
    today = datetime.today()
    for product in config["products"]:
        for warehouse in config["warehouses"]:
            current_stock = random.randint(
                int(product["reorder_point"] * 0.4),
                int(product["max_stock"] * 0.85)
            )
            # Randomly make some items critically low for demo
            if random.random() < 0.25:
                current_stock = random.randint(0, int(product["reorder_point"] * 0.6))

            daily_usage = random.uniform(
                product["reorder_point"] * 0.03,
                product["reorder_point"] * 0.08
            )
            days_of_stock = current_stock / daily_usage if daily_usage > 0 else 999

            rows.append({
                "industry": industry_name,
                "sku": product["sku"],
                "product_name": product["name"],
                "warehouse": warehouse,
                "current_stock": int(current_stock),
                "reorder_point": product["reorder_point"],
                "max_stock": product["max_stock"],
                "unit": product["unit"],
                "unit_cost": product["unit_cost"],
                "lead_days": product["lead_days"],
                "daily_usage": round(daily_usage, 1),
                "days_of_stock": round(days_of_stock, 1),
                "last_updated": today.strftime("%Y-%m-%d %H:%M"),
                "status": _get_status(current_stock, product["reorder_point"]),
            })
    return pd.DataFrame(rows)


def _get_status(stock: int, reorder: int) -> str:
    ratio = stock / reorder
    if ratio <= 0.3:
        return "CRITICAL"
    elif ratio <= 0.7:
        return "LOW"
    elif ratio <= 1.2:
        return "REORDER"
    else:
        return "OK"


def generate_demand_history(industry_name: str, config: dict) -> pd.DataFrame:
    rows = []
    today = datetime.today()
    for product in config["products"]:
        base_demand = product["reorder_point"] * 0.06
        for days_ago in range(90, 0, -1):
            date = today - timedelta(days=days_ago)
            # Add weekly seasonality
            seasonal = 1 + 0.15 * np.sin(2 * np.pi * date.weekday() / 7)
            # Add monthly trend
            trend = 1 + 0.002 * (90 - days_ago)
            # Add noise
            noise = np.random.normal(1, 0.12)
            demand = max(0, int(base_demand * seasonal * trend * noise))
            rows.append({
                "industry": industry_name,
                "sku": product["sku"],
                "product_name": product["name"],
                "date": date.strftime("%Y-%m-%d"),
                "demand": demand,
                "unit": product["unit"],
            })
    return pd.DataFrame(rows)


def generate_suppliers(industry_name: str, config: dict) -> pd.DataFrame:
    rows = []
    for product in config["products"]:
        for i, supplier in enumerate(config["suppliers"]):
            has_disruption = random.random() < 0.2
            rows.append({
                "industry": industry_name,
                "sku": product["sku"],
                "product_name": product["name"],
                "supplier": supplier,
                "reliability_score": round(random.uniform(0.72, 0.99), 2),
                "avg_lead_days": product["lead_days"] + random.randint(-2, 5),
                "unit_cost": round(product["unit_cost"] * random.uniform(0.9, 1.15), 2),
                "min_order_qty": random.choice([50, 100, 200, 500]),
                "is_preferred": i == 0,
                "has_disruption": has_disruption,
                "disruption_reason": random.choice(DISRUPTION_TYPES) if has_disruption else "",
                "disruption_days": random.randint(3, 14) if has_disruption else 0,
            })
    return pd.DataFrame(rows)


def generate_purchase_orders(industry_name: str, config: dict) -> pd.DataFrame:
    rows = []
    today = datetime.today()
    statuses = ["Delivered", "Delivered", "Delivered", "In Transit", "Processing", "Pending"]
    for product in config["products"]:
        for i in range(random.randint(2, 5)):
            order_date = today - timedelta(days=random.randint(1, 45))
            qty = random.randint(
                product["reorder_point"],
                int(product["max_stock"] * 0.6)
            )
            status = random.choice(statuses)
            rows.append({
                "industry": industry_name,
                "po_number": f"PO-{industry_name[:2].upper()}-{random.randint(10000,99999)}",
                "sku": product["sku"],
                "product_name": product["name"],
                "supplier": random.choice(config["suppliers"]),
                "quantity": qty,
                "unit_cost": product["unit_cost"],
                "total_value": qty * product["unit_cost"],
                "order_date": order_date.strftime("%Y-%m-%d"),
                "expected_delivery": (order_date + timedelta(days=product["lead_days"])).strftime("%Y-%m-%d"),
                "status": status,
                "warehouse": random.choice(config["warehouses"]),
                "auto_generated": random.random() < 0.4,
            })
    return pd.DataFrame(rows)


def generate_all():
    all_inventory, all_demand, all_suppliers, all_orders = [], [], [], []

    for industry_name, config in INDUSTRIES.items():
        print(f"  Generating {industry_name} data...")
        inv = generate_inventory(industry_name, config)
        dem = generate_demand_history(industry_name, config)
        sup = generate_suppliers(industry_name, config)
        ord_ = generate_purchase_orders(industry_name, config)

        all_inventory.append(inv)
        all_demand.append(dem)
        all_suppliers.append(sup)
        all_orders.append(ord_)

    pd.concat(all_inventory).to_csv(f"{DATA_DIR}/inventory.csv", index=False)
    pd.concat(all_demand).to_csv(f"{DATA_DIR}/demand_history.csv", index=False)
    pd.concat(all_suppliers).to_csv(f"{DATA_DIR}/suppliers.csv", index=False)
    pd.concat(all_orders).to_csv(f"{DATA_DIR}/purchase_orders.csv", index=False)

    print(f"\n  All datasets saved to {DATA_DIR}/")
    print(f"  inventory.csv       — {len(pd.concat(all_inventory))} rows")
    print(f"  demand_history.csv  — {len(pd.concat(all_demand))} rows")
    print(f"  suppliers.csv       — {len(pd.concat(all_suppliers))} rows")
    print(f"  purchase_orders.csv — {len(pd.concat(all_orders))} rows")


if __name__ == "__main__":
    print("ChainMind — Generating synthetic datasets...")
    generate_all()
    print("\nDone!")
