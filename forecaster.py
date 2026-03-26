"""
ChainMind — Demand Forecasting Engine
Uses linear regression with seasonal decomposition for demand forecasting.
Falls back gracefully if Prophet is unavailable.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import warnings
warnings.filterwarnings("ignore")


def _add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    df["day_idx"] = (df["date"] - df["date"].min()).dt.days
    df["weekday"] = df["date"].dt.weekday
    df["month"] = df["date"].dt.month
    df["week_sin"] = np.sin(2 * np.pi * df["weekday"] / 7)
    df["week_cos"] = np.cos(2 * np.pi * df["weekday"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    return df


def forecast_sku(history_df: pd.DataFrame, sku: str, forecast_days: int = 30) -> dict:
    """
    Forecast demand for a single SKU for the next N days.
    Returns dict with forecast, trend, and recommendation.
    """
    df = history_df[history_df["sku"] == sku].copy()
    if len(df) < 14:
        return {"error": "Insufficient data", "sku": sku}

    df = _add_features(df)
    feature_cols = ["day_idx", "week_sin", "week_cos", "month_sin", "month_cos"]
    X = df[feature_cols].values
    y = df["demand"].values

    poly = PolynomialFeatures(degree=2, include_bias=False)
    X_poly = poly.fit_transform(X)

    model = LinearRegression()
    model.fit(X_poly, y)

    # Generate future dates
    last_date = pd.to_datetime(df["date"].max())
    future_dates = [last_date + timedelta(days=i+1) for i in range(forecast_days)]
    future_df = pd.DataFrame({"date": future_dates})
    future_df["day_idx"] = (future_df["date"] - pd.to_datetime(df["date"].min())).dt.days
    future_df["weekday"] = future_df["date"].dt.weekday
    future_df["month"] = future_df["date"].dt.month
    future_df["week_sin"] = np.sin(2 * np.pi * future_df["weekday"] / 7)
    future_df["week_cos"] = np.cos(2 * np.pi * future_df["weekday"] / 7)
    future_df["month_sin"] = np.sin(2 * np.pi * future_df["month"] / 12)
    future_df["month_cos"] = np.cos(2 * np.pi * future_df["month"] / 12)

    X_future = poly.transform(future_df[feature_cols].values)
    predictions = model.predict(X_future)
    predictions = np.maximum(predictions, 0)

    # Calculate metrics
    avg_daily_demand = float(np.mean(predictions))
    total_forecast = float(np.sum(predictions))
    trend_pct = float(
        (predictions[-7:].mean() - predictions[:7].mean()) / (predictions[:7].mean() + 1e-6) * 100
    )
    recent_avg = float(df["demand"].tail(7).mean())

    return {
        "sku": sku,
        "product_name": df["product_name"].iloc[0],
        "forecast_days": forecast_days,
        "avg_daily_demand": round(avg_daily_demand, 1),
        "total_forecast": round(total_forecast, 0),
        "trend_pct": round(trend_pct, 1),
        "trend_label": "↑ Rising" if trend_pct > 5 else ("↓ Falling" if trend_pct < -5 else "→ Stable"),
        "recent_7day_avg": round(recent_avg, 1),
        "forecast_dates": [d.strftime("%Y-%m-%d") for d in future_dates],
        "forecast_values": [round(float(v), 1) for v in predictions],
        "history_dates": df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "history_values": df["demand"].tolist(),
    }


def forecast_all_skus(history_df: pd.DataFrame, forecast_days: int = 30) -> dict:
    """Forecast all SKUs. Returns dict keyed by SKU."""
    results = {}
    for sku in history_df["sku"].unique():
        results[sku] = forecast_sku(history_df, sku, forecast_days)
    return results


def calculate_reorder_recommendation(
    inventory_row: pd.Series,
    forecast: dict,
) -> dict:
    """
    Given current inventory and forecast, recommend order quantity and urgency.
    """
    current_stock = inventory_row["current_stock"]
    lead_days = inventory_row["lead_days"]
    max_stock = inventory_row["max_stock"]
    reorder_point = inventory_row["reorder_point"]
    unit_cost = inventory_row["unit_cost"]

    avg_daily = forecast.get("avg_daily_demand", inventory_row["daily_usage"])
    lead_demand = avg_daily * lead_days
    safety_stock = avg_daily * (lead_days * 0.5)
    days_remaining = current_stock / (avg_daily + 1e-6)
    stockout_date = datetime.today() + timedelta(days=days_remaining)

    order_needed = current_stock <= (reorder_point + lead_demand)
    order_qty = max(0, int(max_stock * 0.8 - current_stock))

    if days_remaining <= lead_days:
        urgency = "CRITICAL"
    elif days_remaining <= lead_days * 1.5:
        urgency = "HIGH"
    elif current_stock <= reorder_point:
        urgency = "MEDIUM"
    else:
        urgency = "LOW"

    return {
        "sku": inventory_row["sku"],
        "product_name": inventory_row["product_name"],
        "warehouse": inventory_row["warehouse"],
        "current_stock": current_stock,
        "days_remaining": round(days_remaining, 1),
        "stockout_date": stockout_date.strftime("%Y-%m-%d"),
        "lead_demand": round(lead_demand, 0),
        "safety_stock": round(safety_stock, 0),
        "order_needed": order_needed,
        "order_qty": order_qty,
        "order_value": round(order_qty * unit_cost, 2),
        "urgency": urgency,
        "avg_daily_demand": round(avg_daily, 1),
        "trend": forecast.get("trend_label", "→ Stable"),
    }
