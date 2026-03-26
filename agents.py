"""
ChainMind — Multi-Agent System
Uses CrewAI to orchestrate 4 specialized supply chain agents.
Set OPENAI_API_KEY in .env to use real LLM, or runs in simulation mode.
"""

import os
import json
import random
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd

# Try to load CrewAI — falls back to simulation if not installed
try:
    from crewai import Agent, Task, Crew, Process
    from langchain_openai import ChatOpenAI
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False

from dotenv import load_dotenv
load_dotenv()


# ─── Simulation Mode (no API key needed for demo) ───────────────────────────

SIMULATION_RESPONSES = {
    "monitor": [
        "Inventory scan complete. Detected {critical} CRITICAL items and {low} LOW stock items across {warehouses} warehouses. Immediate attention required for {product} at {warehouse} — only {days} days of stock remaining before stockout.",
        "Supply chain health check done. {critical} products are in critical zone. {product} ({sku}) at {warehouse} has dropped below safety threshold with {stock} units remaining against reorder point of {reorder}.",
    ],
    "forecast": [
        "Demand forecast generated for next 30 days. {product} shows a {trend} trend with avg daily demand of {demand} units. Projected stockout in {days} days if no replenishment action taken. Recommend ordering {qty} units immediately.",
        "Forecasting model indicates {product} demand is {trend}. Expected total demand over next 30 days: {total} units. Current inventory covers only {coverage}% of forecasted demand.",
    ],
    "procure": [
        "Purchase Order auto-generated: PO-{po_num} for {qty} units of {product} from {supplier}. Estimated value: ₹{value:,.0f}. Expected delivery in {lead} days. This PO requires manager approval before dispatch.",
        "Procurement action triggered for {product}. Preferred supplier {supplier} has reliability score of {score}%. Generated PO-{po_num} for {qty} units at ₹{cost} per unit. Total PO value: ₹{value:,.0f}.",
    ],
    "alert": [
        "ALERT DISPATCHED: Critical stock warning for {product} at {warehouse}. Manager notified via email and Slack. ETA for stockout: {date}. Automated PO pending approval.",
        "Supply chain alert sent to operations team. {product} stockout risk in {days} days. Disruption detected at supplier {supplier}: {reason}. Alternate supplier activated.",
    ],
}


def _simulate_response(agent_type: str, context: dict) -> str:
    template = random.choice(SIMULATION_RESPONSES[agent_type])
    try:
        return template.format(**context)
    except KeyError:
        return template


# ─── Agent Definitions ──────────────────────────────────────────────────────

def create_agents(llm=None):
    if not CREWAI_AVAILABLE or llm is None:
        return None

    monitor_agent = Agent(
        role="Supply Chain Monitor",
        goal="Continuously monitor inventory levels across all warehouses and identify items that are critically low or approaching reorder point.",
        backstory=(
            "You are a seasoned supply chain analyst with 10 years of experience "
            "at leading manufacturing firms. You have a sharp eye for spotting inventory "
            "risks before they become crises. You communicate clearly and flag issues "
            "with precise data."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )

    forecast_agent = Agent(
        role="Demand Forecasting Specialist",
        goal="Analyze historical demand patterns and generate accurate 30-day demand forecasts to predict future inventory needs.",
        backstory=(
            "You are a data scientist specializing in time-series forecasting for supply chains. "
            "You combine statistical models with business context to produce reliable forecasts "
            "that drive smarter procurement decisions."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )

    procurement_agent = Agent(
        role="Procurement Automation Agent",
        goal="Generate optimized purchase orders for items that need replenishment, selecting the best supplier based on reliability, cost, and lead time.",
        backstory=(
            "You are a procurement specialist who has automated purchasing for global enterprises. "
            "You know how to balance cost, speed, and supplier reliability. You generate precise, "
            "actionable purchase orders that minimize stockouts without over-ordering."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )

    alert_agent = Agent(
        role="Alert & Reporting Agent",
        goal="Synthesize findings from all agents into clear executive alerts and daily supply chain health reports.",
        backstory=(
            "You are a supply chain communications expert who translates complex data into "
            "clear, actionable messages for operations managers and C-suite executives. "
            "Your alerts are concise, data-backed, and always include a recommended action."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )

    return {
        "monitor": monitor_agent,
        "forecast": forecast_agent,
        "procurement": procurement_agent,
        "alert": alert_agent,
    }


def run_agent_pipeline(
    inventory_df: pd.DataFrame,
    demand_df: pd.DataFrame,
    suppliers_df: pd.DataFrame,
    industry: str,
    use_llm: bool = False,
    api_key: Optional[str] = None,
) -> dict:
    """
    Run the full multi-agent pipeline.
    Returns structured results for dashboard display.
    """

    # Filter to selected industry
    inv = inventory_df[inventory_df["industry"] == industry].copy()
    dem = demand_df[demand_df["industry"] == industry].copy()
    sup = suppliers_df[suppliers_df["industry"] == industry].copy()

    critical_items = inv[inv["status"] == "CRITICAL"]
    low_items = inv[inv["status"].isin(["LOW", "REORDER"])]

    results = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "industry": industry,
        "monitor_output": "",
        "forecast_output": "",
        "procurement_output": "",
        "alert_output": "",
        "generated_pos": [],
        "alerts": [],
    }

    # ── Build context for simulation ──
    sample_critical = critical_items.iloc[0] if len(critical_items) > 0 else inv.iloc[0]
    sample_supplier = sup[sup["sku"] == sample_critical["sku"]].iloc[0] if len(sup[sup["sku"] == sample_critical["sku"]]) > 0 else sup.iloc[0]
    disrupted_suppliers = sup[sup["has_disruption"] == True]

    ctx_monitor = {
        "critical": len(critical_items),
        "low": len(low_items),
        "warehouses": inv["warehouse"].nunique(),
        "product": sample_critical["product_name"],
        "warehouse": sample_critical["warehouse"],
        "days": round(sample_critical["days_of_stock"], 1),
        "sku": sample_critical["sku"],
        "stock": sample_critical["current_stock"],
        "reorder": sample_critical["reorder_point"],
    }

    avg_demand = dem[dem["sku"] == sample_critical["sku"]]["demand"].mean() if len(dem[dem["sku"] == sample_critical["sku"]]) > 0 else sample_critical["daily_usage"]
    total_demand_30 = avg_demand * 30
    coverage_pct = round((sample_critical["current_stock"] / (total_demand_30 + 1e-6)) * 100, 1)

    ctx_forecast = {
        "product": sample_critical["product_name"],
        "trend": "rising" if random.random() > 0.4 else "stable",
        "demand": round(avg_demand, 1),
        "days": round(sample_critical["days_of_stock"], 1),
        "qty": int(sample_critical["max_stock"] * 0.8 - sample_critical["current_stock"]),
        "total": round(total_demand_30, 0),
        "coverage": coverage_pct,
    }

    order_qty = max(100, int(sample_critical["max_stock"] * 0.8 - sample_critical["current_stock"]))
    order_value = order_qty * sample_critical["unit_cost"]

    ctx_procure = {
        "product": sample_critical["product_name"],
        "qty": order_qty,
        "supplier": sample_supplier["supplier"],
        "score": round(sample_supplier["reliability_score"] * 100, 0),
        "po_num": random.randint(10000, 99999),
        "value": order_value,
        "lead": sample_critical["lead_days"],
        "cost": sample_critical["unit_cost"],
    }

    stockout_date = (datetime.today() + timedelta(days=sample_critical["days_of_stock"])).strftime("%Y-%m-%d")
    disruption_reason = disrupted_suppliers.iloc[0]["disruption_reason"] if len(disrupted_suppliers) > 0 else "minor delay"
    disruption_supplier = disrupted_suppliers.iloc[0]["supplier"] if len(disrupted_suppliers) > 0 else sample_supplier["supplier"]

    ctx_alert = {
        "product": sample_critical["product_name"],
        "warehouse": sample_critical["warehouse"],
        "days": round(sample_critical["days_of_stock"], 1),
        "date": stockout_date,
        "supplier": disruption_supplier,
        "reason": disruption_reason,
    }

    # ── LLM mode (real CrewAI) ──
    if use_llm and CREWAI_AVAILABLE and api_key:
        os.environ["OPENAI_API_KEY"] = api_key
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)
        agents = create_agents(llm)

        inv_summary = inv.to_string(index=False, max_rows=20)
        dem_summary = dem.groupby("sku")["demand"].agg(["mean", "sum"]).reset_index().to_string(index=False)
        sup_summary = sup[["sku", "supplier", "reliability_score", "has_disruption", "disruption_reason"]].to_string(index=False)

        t1 = Task(
            description=f"Analyze this inventory data and identify all critical and low-stock items:\n{inv_summary}",
            agent=agents["monitor"],
            expected_output="A summary of critical stock items with warehouse locations and days of stock remaining."
        )
        t2 = Task(
            description=f"Based on this demand history, forecast next 30 days and identify top 3 items needing urgent replenishment:\n{dem_summary}",
            agent=agents["forecast"],
            expected_output="30-day demand forecast with average daily demand and trend for top critical items."
        )
        t3 = Task(
            description=f"Generate purchase orders for critical items. Supplier data:\n{sup_summary}",
            agent=agents["procurement"],
            expected_output="List of purchase orders with quantities, suppliers, and estimated values."
        )
        t4 = Task(
            description="Synthesize all agent findings into a concise executive alert with recommended actions.",
            agent=agents["alert"],
            expected_output="Executive summary alert with top 3 risks and recommended actions."
        )

        crew = Crew(
            agents=list(agents.values()),
            tasks=[t1, t2, t3, t4],
            process=Process.sequential,
            verbose=True,
        )
        crew_result = crew.kickoff()
        results["monitor_output"] = str(t1.output) if hasattr(t1, "output") else str(crew_result)
        results["forecast_output"] = str(t2.output) if hasattr(t2, "output") else ""
        results["procurement_output"] = str(t3.output) if hasattr(t3, "output") else ""
        results["alert_output"] = str(t4.output) if hasattr(t4, "output") else ""

    else:
        # ── Simulation mode ──
        results["monitor_output"] = _simulate_response("monitor", ctx_monitor)
        results["forecast_output"] = _simulate_response("forecast", ctx_forecast)
        results["procurement_output"] = _simulate_response("procure", ctx_procure)
        results["alert_output"] = _simulate_response("alert", ctx_alert)

    # ── Auto-generate POs for all critical items ──
    for _, item in critical_items.iterrows():
        item_sup = sup[sup["sku"] == item["sku"]]
        preferred_sup = item_sup[item_sup["is_preferred"] == True]
        chosen_sup = preferred_sup.iloc[0] if len(preferred_sup) > 0 else (item_sup.iloc[0] if len(item_sup) > 0 else None)

        qty = max(50, int(item["max_stock"] * 0.75 - item["current_stock"]))
        results["generated_pos"].append({
            "po_number": f"PO-AUTO-{random.randint(10000,99999)}",
            "sku": item["sku"],
            "product_name": item["product_name"],
            "warehouse": item["warehouse"],
            "qty": qty,
            "supplier": chosen_sup["supplier"] if chosen_sup is not None else "TBD",
            "value": qty * item["unit_cost"],
            "urgency": item["status"],
            "lead_days": item["lead_days"],
            "expected_delivery": (datetime.today() + timedelta(days=item["lead_days"])).strftime("%Y-%m-%d"),
            "auto_approved": item["days_of_stock"] <= item["lead_days"],
        })

    # ── Build alerts list ──
    for _, item in pd.concat([critical_items, low_items]).iterrows():
        days = item["days_of_stock"]
        if days <= item["lead_days"]:
            severity = "CRITICAL"
            msg = f"{item['product_name']} at {item['warehouse']} will stockout in {days:.0f} days — before next delivery arrives!"
        elif item["status"] == "LOW":
            severity = "WARNING"
            msg = f"{item['product_name']} at {item['warehouse']} is running low ({item['current_stock']} units remaining)."
        else:
            severity = "INFO"
            msg = f"{item['product_name']} at {item['warehouse']} has reached reorder point. PO recommended."
        results["alerts"].append({"severity": severity, "message": msg, "sku": item["sku"], "warehouse": item["warehouse"]})

    # Add disruption alerts
    for _, row in disrupted_suppliers.iterrows():
        results["alerts"].append({
            "severity": "DISRUPTION",
            "message": f"Supplier disruption — {row['supplier']}: {row['disruption_reason']} (est. {row['disruption_days']} day delay)",
            "sku": row["sku"],
            "warehouse": "All",
        })

    return results
