"""
ChainMind — Agentic Supply Chain Dashboard
Streamlit app for the Capgemini AgentifAI Buildathon 2026
Run: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import os
import sys
import random
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from generate_data import generate_all, DATA_DIR, INDUSTRIES
from forecaster import forecast_sku, calculate_reorder_recommendation
from agents import run_agent_pipeline

# ─── Page Config ─────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="ChainMind — AI Supply Chain",
    page_icon="🔗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ───────────────────────────────────────────────────────────────

st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .metric-card {
        background: linear-gradient(135deg, #1e2130, #252a3d);
        border-radius: 12px;
        padding: 16px 20px;
        border-left: 4px solid;
        margin-bottom: 10px;
    }
    .metric-critical { border-color: #ff4b4b; }
    .metric-warning  { border-color: #ffa500; }
    .metric-ok       { border-color: #00c853; }
    .metric-info     { border-color: #2196f3; }
    .agent-box {
        background: #1e2130;
        border-radius: 10px;
        padding: 14px 18px;
        border: 1px solid #333;
        margin-bottom: 8px;
        font-size: 13px;
        line-height: 1.6;
    }
    .po-row {
        background: #1a1f2e;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 6px;
        border: 1px solid #2d3450;
    }
    .alert-critical  { border-left: 3px solid #ff4b4b; padding-left: 10px; margin: 4px 0; background: #1a0a0a; border-radius: 4px; padding: 8px 12px; }
    .alert-warning   { border-left: 3px solid #ffa500; padding-left: 10px; margin: 4px 0; background: #1a1200; border-radius: 4px; padding: 8px 12px; }
    .alert-disruption{ border-left: 3px solid #9c27b0; padding-left: 10px; margin: 4px 0; background: #130a1a; border-radius: 4px; padding: 8px 12px; }
    .alert-info      { border-left: 3px solid #2196f3; padding-left: 10px; margin: 4px 0; background: #0a1020; border-radius: 4px; padding: 8px 12px; }
    .big-number { font-size: 32px; font-weight: 700; }
    .label-text { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    div[data-testid="stMetricValue"] { font-size: 28px; }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] { border-radius: 8px; }
</style>
""", unsafe_allow_html=True)


# ─── Data Loading ─────────────────────────────────────────────────────────────

@st.cache_data(show_spinner=False)
def load_data():
    if not os.path.exists(f"{DATA_DIR}/inventory.csv"):
        with st.spinner("Generating synthetic datasets..."):
            generate_all()
    inv = pd.read_csv(f"{DATA_DIR}/inventory.csv")
    dem = pd.read_csv(f"{DATA_DIR}/demand_history.csv")
    sup = pd.read_csv(f"{DATA_DIR}/suppliers.csv")
    ord_ = pd.read_csv(f"{DATA_DIR}/purchase_orders.csv")
    return inv, dem, sup, ord_


# ─── Sidebar ──────────────────────────────────────────────────────────────────

with st.sidebar:
    st.image("https://via.placeholder.com/200x50/0d1117/00c9ff?text=⛓+ChainMind", width=200)
    st.markdown("### 🏭 ChainMind Control Panel")
    st.markdown("*Agentic AI Supply Chain Optimizer*")
    st.divider()

    industry = st.selectbox(
        "🏢 Select Industry",
        options=["Pharma", "FMCG", "Auto Parts", "Retail"],
        index=0,
    )

    st.divider()
    st.markdown("### 🤖 Agent Configuration")

    use_llm = st.toggle("Use Real LLM (OpenAI)", value=False)
    if use_llm:
        api_key = st.text_input("OpenAI API Key", type="password", placeholder="sk-...")
    else:
        api_key = None
        st.info("Running in **Simulation Mode**. Toggle above to use real GPT.")

    st.divider()
    st.markdown("### ⚡ Disruption Simulator")
    simulate_disruption = st.button("🌪️ Trigger Disruption", width="stretch")
    if simulate_disruption:
        st.session_state["disruption_active"] = True
        st.session_state["disruption_type"] = random.choice([
            "Flood in supplier region",
            "Port strike at JNPT Mumbai",
            "Raw material shortage",
            "Customs hold for 7 days",
        ])

    if st.session_state.get("disruption_active"):
        st.error(f"⚠️ DISRUPTION: {st.session_state.get('disruption_type', '')}")
        if st.button("✅ Resolve Disruption"):
            st.session_state["disruption_active"] = False

    st.divider()
    run_agents = st.button("🚀 Run Agent Pipeline", width="stretch", type="primary")

    st.divider()
    if st.button("🔄 Regenerate Data", width="stretch"):
        st.cache_data.clear()
        if os.path.exists(f"{DATA_DIR}/inventory.csv"):
            for f in ["inventory.csv", "demand_history.csv", "suppliers.csv", "purchase_orders.csv"]:
                fp = f"{DATA_DIR}/{f}"
                if os.path.exists(fp):
                    os.remove(fp)
        st.rerun()

    st.markdown("---")
    st.markdown(
        "<small style='color:#555'>Built for Capgemini AgentifAI Buildathon 2026<br>Team: ChainMind</small>",
        unsafe_allow_html=True
    )


# ─── Load Data ────────────────────────────────────────────────────────────────

with st.spinner("Loading supply chain data..."):
    inv_df, dem_df, sup_df, ord_df = load_data()

inv = inv_df[inv_df["industry"] == industry].copy()
dem = dem_df[dem_df["industry"] == industry].copy()
sup = sup_df[sup_df["industry"] == industry].copy()
ord_ = ord_df[ord_df["industry"] == industry].copy()


# ─── Run Agent Pipeline ───────────────────────────────────────────────────────

if run_agents or "agent_results" not in st.session_state or st.session_state.get("last_industry") != industry:
    with st.spinner("🤖 Agents are analyzing your supply chain..."):
        results = run_agent_pipeline(inv_df, dem_df, sup_df, industry, use_llm=use_llm, api_key=api_key)
        st.session_state["agent_results"] = results
        st.session_state["last_industry"] = industry

results = st.session_state.get("agent_results", {})


# ─── Header ──────────────────────────────────────────────────────────────────

st.markdown(f"# ⛓ ChainMind — {industry} Supply Chain")
st.markdown(f"*Last updated: {results.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))}*")

# ─── KPI Row ──────────────────────────────────────────────────────────────────

critical_count = len(inv[inv["status"] == "CRITICAL"])
low_count = len(inv[inv["status"].isin(["LOW", "REORDER"])])
ok_count = len(inv[inv["status"] == "OK"])
total_inventory_value = (inv["current_stock"] * inv["unit_cost"]).sum()
pending_pos = len(results.get("generated_pos", []))
disruptions = len(sup[sup["has_disruption"] == True])

k1, k2, k3, k4, k5, k6 = st.columns(6)
k1.metric("🔴 Critical Items",   critical_count,  delta=f"-{critical_count} need PO",  delta_color="inverse")
k2.metric("🟡 Low Stock Items",  low_count)
k3.metric("🟢 OK Items",         ok_count)
k4.metric("📦 Inventory Value",  f"₹{total_inventory_value/1e5:.1f}L")
k5.metric("📋 Auto-Generated POs", pending_pos)
k6.metric("⚠️ Supplier Disruptions", disruptions, delta_color="inverse")

st.divider()

# ─── Tabs ─────────────────────────────────────────────────────────────────────

tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Inventory Dashboard",
    "🔮 Demand Forecast",
    "🤖 Agent Console",
    "📋 Purchase Orders",
    "🌪️ Disruption Map",
])


# ════════════════════════════════════════════════════════
# TAB 1 — INVENTORY DASHBOARD
# ════════════════════════════════════════════════════════
with tab1:
    c1, c2 = st.columns([2, 1])

    with c1:
        st.subheader("Inventory Status by Product")
        fig_inv = px.bar(
            inv.groupby(["product_name", "status"])["current_stock"].sum().reset_index(),
            x="product_name",
            y="current_stock",
            color="status",
            color_discrete_map={
                "CRITICAL": "#ff4b4b",
                "LOW":      "#ffa500",
                "REORDER":  "#ffdd57",
                "OK":       "#00c853",
            },
            labels={"product_name": "Product", "current_stock": "Stock Units"},
            template="plotly_dark",
        )
        fig_inv.update_layout(
            xaxis_tickangle=-30,
            legend_title="Status",
            plot_bgcolor="#0e1117",
            paper_bgcolor="#0e1117",
            height=350,
        )
        st.plotly_chart(fig_inv, width="stretch")

    with c2:
        st.subheader("Status Distribution")
        status_counts = inv["status"].value_counts().reset_index()
        status_counts.columns = ["status", "count"]
        fig_pie = px.pie(
            status_counts,
            names="status",
            values="count",
            color="status",
            color_discrete_map={
                "CRITICAL": "#ff4b4b",
                "LOW":      "#ffa500",
                "REORDER":  "#ffdd57",
                "OK":       "#00c853",
            },
            template="plotly_dark",
            hole=0.45,
        )
        fig_pie.update_layout(
            paper_bgcolor="#0e1117",
            plot_bgcolor="#0e1117",
            height=350,
            showlegend=True,
        )
        st.plotly_chart(fig_pie, width="stretch")

    st.subheader("📦 Inventory Health Table")
    display_cols = ["product_name", "warehouse", "current_stock", "reorder_point", "days_of_stock", "status", "unit_cost"]
    styled = inv[display_cols].sort_values("days_of_stock").rename(columns={
        "product_name": "Product",
        "warehouse": "Warehouse",
        "current_stock": "Stock",
        "reorder_point": "Reorder At",
        "days_of_stock": "Days Left",
        "status": "Status",
        "unit_cost": "Unit Cost (₹)"
    })

    def color_status(val):
        colors = {"CRITICAL": "background-color: #3d0000; color: #ff6b6b",
                  "LOW":      "background-color: #2d1900; color: #ffaa00",
                  "REORDER":  "background-color: #2a2200; color: #ffdd57",
                  "OK":       "background-color: #001a0a; color: #00c853"}
        return colors.get(val, "")

    st.dataframe(
        styled.style.map(color_status, subset=["Status"]),
        width="stretch",
        height=350,
    )

    st.subheader("🏭 Warehouse Inventory Heatmap")
    pivot = inv.pivot_table(values="current_stock", index="warehouse", columns="product_name", aggfunc="sum", fill_value=0)
    fig_heat = px.imshow(
        pivot,
        color_continuous_scale="RdYlGn",
        template="plotly_dark",
        labels={"color": "Stock"},
        aspect="auto",
    )
    fig_heat.update_layout(paper_bgcolor="#0e1117", plot_bgcolor="#0e1117", height=280)
    st.plotly_chart(fig_heat, width="stretch")


# ════════════════════════════════════════════════════════
# TAB 2 — DEMAND FORECAST
# ════════════════════════════════════════════════════════
with tab2:
    st.subheader("🔮 30-Day Demand Forecast")

    sku_options = dem["sku"].unique().tolist()
    sku_labels = {row["sku"]: row["product_name"] for _, row in inv.drop_duplicates("sku").iterrows()}
    selected_sku = st.selectbox(
        "Select Product to Forecast",
        options=sku_options,
        format_func=lambda x: f"{x} — {sku_labels.get(x, x)}",
    )

    with st.spinner("Generating forecast..."):
        fc = forecast_sku(dem, selected_sku, forecast_days=30)

    if "error" not in fc:
        inv_row = inv[inv["sku"] == selected_sku].iloc[0] if len(inv[inv["sku"] == selected_sku]) > 0 else None
        if inv_row is not None:
            rec = calculate_reorder_recommendation(inv_row, fc)

            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Avg Daily Demand", f"{fc['avg_daily_demand']} units")
            m2.metric("30-Day Total Forecast", f"{int(fc['total_forecast'])} units")
            m3.metric("Trend", fc["trend_label"])
            m4.metric("Days of Stock Left", f"{rec['days_remaining']} days",
                      delta="REORDER NOW" if rec["urgency"] in ["CRITICAL","HIGH"] else "OK",
                      delta_color="inverse" if rec["urgency"] in ["CRITICAL","HIGH"] else "normal")

        # Forecast chart
        fig_fc = go.Figure()
        fig_fc.add_trace(go.Scatter(
            x=fc["history_dates"], y=fc["history_values"],
            name="Historical Demand", line=dict(color="#2196f3", width=1.5),
            mode="lines",
        ))
        fig_fc.add_trace(go.Scatter(
            x=fc["forecast_dates"], y=fc["forecast_values"],
            name="Forecast", line=dict(color="#ff9800", width=2, dash="dot"),
            mode="lines",
            fill="tozeroy", fillcolor="rgba(255,152,0,0.06)",
        ))
        if inv_row is not None:
            fig_fc.add_hline(
                y=inv_row["reorder_point"] * 0.06,
                line_color="#ff4b4b", line_dash="dash",
                annotation_text="Reorder Threshold",
                annotation_position="bottom right",
            )
        fig_fc.update_layout(
            template="plotly_dark",
            paper_bgcolor="#0e1117",
            plot_bgcolor="#0e1117",
            height=380,
            xaxis_title="Date",
            yaxis_title="Units",
            legend=dict(orientation="h", yanchor="bottom", y=1.02),
        )
        st.plotly_chart(fig_fc, width="stretch")

        if inv_row is not None and rec["order_needed"]:
            st.warning(
                f"⚠️ **Reorder Recommended** — {fc['product_name']} needs **{rec['order_qty']} units** "
                f"(est. ₹{rec['order_value']:,.0f}). Urgency: **{rec['urgency']}**. "
                f"Expected stockout: **{rec['stockout_date']}**"
            )


# ════════════════════════════════════════════════════════
# TAB 3 — AGENT CONSOLE
# ════════════════════════════════════════════════════════
with tab3:
    st.subheader("🤖 Multi-Agent Pipeline Console")

    col_agents, col_alerts = st.columns([3, 2])

    with col_agents:
        agent_icons = {
            "monitor_output":    ("👁️ Monitor Agent",    "#2196f3"),
            "forecast_output":   ("📈 Forecast Agent",   "#9c27b0"),
            "procurement_output":("🛒 Procurement Agent","#ff9800"),
            "alert_output":      ("🚨 Alert Agent",       "#f44336"),
        }
        for key, (title, color) in agent_icons.items():
            output = results.get(key, "Not yet run.")
            st.markdown(f"**{title}**")
            st.markdown(
                f"<div class='agent-box' style='border-left: 3px solid {color};'>{output}</div>",
                unsafe_allow_html=True
            )

    with col_alerts:
        st.markdown("**🔔 Live Alerts**")
        alerts = results.get("alerts", [])
        if not alerts:
            st.success("No alerts — supply chain healthy!")
        else:
            for alert in alerts[:12]:
                sev = alert["severity"]
                icon = {"CRITICAL": "🔴", "WARNING": "🟡", "DISRUPTION": "🟣", "INFO": "🔵"}.get(sev, "⚪")
                cls = {"CRITICAL": "alert-critical", "WARNING": "alert-warning",
                       "DISRUPTION": "alert-disruption", "INFO": "alert-info"}.get(sev, "alert-info")
                st.markdown(
                    f"<div class='{cls}'>{icon} <b>{sev}</b><br><small>{alert['message']}</small></div>",
                    unsafe_allow_html=True,
                )

    st.markdown("---")
    st.subheader("🏗️ Agent Architecture")

    arch_cols = st.columns(4)
    agents_info = [
        ("👁️", "Monitor Agent", "Scans inventory every cycle. Flags CRITICAL & LOW items.", "#2196f3"),
        ("📈", "Forecast Agent", "30-day demand forecasting using ML time-series models.", "#9c27b0"),
        ("🛒", "Procurement Agent", "Auto-generates POs. Selects best supplier by reliability & cost.", "#ff9800"),
        ("🚨", "Alert Agent", "Sends real-time alerts to ops managers. Generates exec reports.", "#f44336"),
    ]
    for col, (icon, name, desc, color) in zip(arch_cols, agents_info):
        col.markdown(
            f"<div style='background:#1e2130;border-radius:10px;padding:14px;border-top:3px solid {color};text-align:center'>"
            f"<div style='font-size:28px'>{icon}</div>"
            f"<div style='font-weight:600;margin:6px 0;font-size:13px'>{name}</div>"
            f"<div style='font-size:11px;color:#888'>{desc}</div>"
            f"</div>",
            unsafe_allow_html=True,
        )


# ════════════════════════════════════════════════════════
# TAB 4 — PURCHASE ORDERS
# ════════════════════════════════════════════════════════
with tab4:
    st.subheader("📋 Auto-Generated Purchase Orders")

    gen_pos = results.get("generated_pos", [])
    if gen_pos:
        st.success(f"✅ {len(gen_pos)} Purchase Orders auto-generated by Procurement Agent")
        total_po_value = sum(p["value"] for p in gen_pos)
        st.metric("Total PO Value", f"₹{total_po_value:,.0f}")

        for po in gen_pos:
            urgency_color = {"CRITICAL": "#ff4b4b", "LOW": "#ffa500", "REORDER": "#ffdd57"}.get(po["urgency"], "#00c853")
            auto_badge = "🤖 AUTO-APPROVED" if po["auto_approved"] else "⏳ AWAITING APPROVAL"
            st.markdown(
                f"<div class='po-row'>"
                f"<b style='color:{urgency_color}'>{po['po_number']}</b> &nbsp;|&nbsp; "
                f"{po['product_name']} ({po['sku']}) &nbsp;|&nbsp; "
                f"Qty: <b>{po['qty']}</b> &nbsp;|&nbsp; "
                f"Supplier: <b>{po['supplier']}</b> &nbsp;|&nbsp; "
                f"Value: <b>₹{po['value']:,.0f}</b> &nbsp;|&nbsp; "
                f"ETA: {po['expected_delivery']} &nbsp;|&nbsp; {auto_badge}"
                f"</div>",
                unsafe_allow_html=True,
            )
    else:
        st.info("No purchase orders generated yet. Run the agent pipeline.")

    st.subheader("📜 Historical Purchase Orders")
    ord_display = ord_[[
        "po_number", "product_name", "supplier", "quantity",
        "total_value", "order_date", "expected_delivery", "status", "auto_generated"
    ]].copy()
    ord_display["total_value"] = ord_display["total_value"].apply(lambda x: f"₹{x:,.0f}")

    def color_po_status(val):
        c = {"Delivered": "color: #00c853", "In Transit": "color: #2196f3",
             "Processing": "color: #ff9800", "Pending": "color: #9e9e9e"}
        return c.get(val, "")

    st.dataframe(
        ord_display.style.map(color_po_status, subset=["status"]),
        width="stretch",
        height=300,
    )


# ════════════════════════════════════════════════════════
# TAB 5 — DISRUPTION MAP
# ════════════════════════════════════════════════════════
with tab5:
    st.subheader("🌪️ Supplier Disruption Intelligence")

    disrupted = sup[sup["has_disruption"] == True].copy()
    healthy = sup[sup["has_disruption"] == False].copy()

    d1, d2 = st.columns(2)
    d1.metric("⚠️ Disrupted Suppliers", len(disrupted))
    d2.metric("✅ Healthy Suppliers", len(healthy))

    if len(disrupted) > 0:
        st.error("🚨 Active Supplier Disruptions")
        for _, row in disrupted.iterrows():
            st.markdown(
                f"<div class='alert-disruption'>"
                f"<b>🟣 {row['supplier']}</b> → {row['product_name']} ({row['sku']})<br>"
                f"<small>Reason: {row['disruption_reason']} | Est. Delay: {row['disruption_days']} days | "
                f"Reliability: {round(row['reliability_score']*100)}%</small>"
                f"</div>",
                unsafe_allow_html=True,
            )

    st.subheader("📊 Supplier Reliability Scores")
    supplier_summary = sup.groupby("supplier").agg(
        avg_reliability=("reliability_score", "mean"),
        products=("sku", "nunique"),
        has_disruption=("has_disruption", "any"),
    ).reset_index()
    supplier_summary["avg_reliability_pct"] = (supplier_summary["avg_reliability"] * 100).round(1)
    supplier_summary["color"] = supplier_summary["has_disruption"].map({True: "#ff4b4b", False: "#00c853"})

    fig_sup = px.bar(
        supplier_summary.sort_values("avg_reliability_pct"),
        x="avg_reliability_pct",
        y="supplier",
        orientation="h",
        color="has_disruption",
        color_discrete_map={True: "#ff4b4b", False: "#00c853"},
        labels={"avg_reliability_pct": "Reliability %", "supplier": "Supplier", "has_disruption": "Disrupted"},
        template="plotly_dark",
        height=350,
    )
    fig_sup.update_layout(paper_bgcolor="#0e1117", plot_bgcolor="#0e1117")
    st.plotly_chart(fig_sup, width="stretch")

    st.subheader("🔁 Alternate Supplier Recommendations")
    for _, row in disrupted.iterrows():
        alternates = sup[(sup["sku"] == row["sku"]) & (sup["has_disruption"] == False)].sort_values("reliability_score", ascending=False)
        if len(alternates) > 0:
            alt = alternates.iloc[0]
            st.success(
                f"✅ **{row['product_name']}** — Switch from *{row['supplier']}* to "
                f"**{alt['supplier']}** (Reliability: {round(alt['reliability_score']*100)}%, "
                f"Lead: {alt['avg_lead_days']}d, Cost: ₹{alt['unit_cost']}/unit)"
            )
        else:
            st.warning(f"⚠️ No alternate supplier found for {row['product_name']} ({row['sku']})")

    if st.session_state.get("disruption_active"):
        st.markdown("---")
        st.error(f"🌪️ **LIVE DISRUPTION ACTIVE**: {st.session_state.get('disruption_type')}")
        st.markdown("**Agent Response:**")
        st.markdown(
            "<div class='agent-box' style='border-left:3px solid #9c27b0'>"
            "🤖 Disruption detected. Activating alternate supplier routing protocol. "
            "Affected SKUs re-routed to backup suppliers. Emergency POs being generated. "
            "Operations manager notified via email and Slack. ETA impact assessment: 3-5 business days."
            "</div>",
            unsafe_allow_html=True,
        )

# ─── Footer ───────────────────────────────────────────────────────────────────
st.divider()
st.markdown(
    "<center><small style='color:#444'>ChainMind — Capgemini AgentifAI Buildathon 2026 | "
    "Built with CrewAI + Streamlit + Plotly</small></center>",
    unsafe_allow_html=True,
)
