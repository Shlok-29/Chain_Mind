import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, BarChart3, Package } from 'lucide-react';

interface ForecasterProps {
  industry: string;
}

import { API_BASE } from '../config';

const Forecaster: React.FC<ForecasterProps> = ({ industry }) => {
  const [skus, setSkus] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/data/inventory?industry=${industry}`);
        setSkus(res.data);
        if (res.data.length > 0) setSelectedSku(res.data[0].sku);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkus();
  }, [industry]);

  useEffect(() => {
    if (selectedSku) {
      const fetchForecast = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_BASE}/data/forecast/${selectedSku}?industry=${industry}`);
          setForecastData(res.data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      };
      fetchForecast();
    }
  }, [selectedSku, industry]);

  const lastHistIdx = forecastData?.forecast?.history_dates?.length ? forecastData.forecast.history_dates.length - 1 : -1;

  const chartData = forecastData ? [
    ...forecastData.forecast.history_dates.map((date: string, i: number) => ({
      date,
      historical: forecastData.forecast.history_values[i],
      forecast: i === lastHistIdx ? forecastData.forecast.history_values[i] : null,
      upper_bound: null,
      lower_bound: null
    })),
    ...forecastData.forecast.forecast_dates.map((date: string, i: number) => ({
      date,
      historical: null,
      forecast: forecastData.forecast.forecast_values[i],
      upper_bound: forecastData.forecast.upper_bound ? forecastData.forecast.upper_bound[i] : forecastData.forecast.forecast_values[i] * 1.15,
      lower_bound: forecastData.forecast.lower_bound ? forecastData.forecast.lower_bound[i] : forecastData.forecast.forecast_values[i] * 0.85
    }))
  ] : [];

  const rec = forecastData?.recommendation;
  const fc = forecastData?.forecast;

  return (
    <div className="forecaster-page">
      {/* Title Header */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> PREDICTIVE ENGINE
        </div>
        <h1>Demand Forecasting & Analytics</h1>
        <p className="page-subtitle">Polynomial trend analysis and 95% confidence bounds for 30-day SKU demand projection.</p>
      </div>

      {/* SKU Selector Card */}
      <div className="glass control-card">
        <div className="control-header">
          <Package size={18} className="text-mint" />
          <label className="label">Select Target Product SKU</label>
        </div>
        <select 
          value={selectedSku} 
          onChange={(e) => setSelectedSku(e.target.value)}
          className="sku-select"
        >
          {skus.map(s => (
            <option key={s.sku} value={s.sku}>{s.sku} — {s.product_name} ({s.warehouse})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass loading-state">
          <RefreshCw className="spin text-mint" size={24} />
          <span>Executing forecasting algorithms...</span>
        </div>
      ) : forecastData && (
        <div className="forecast-content">
          {/* Top Metrics Row */}
          <div className="dashboard-grid">
            <div className="glass metric-card">
              <div className="label">Avg Daily Demand</div>
              <div className="value">{fc.avg_daily_demand} <span className="unit">units/day</span></div>
            </div>

            <div className="glass metric-card">
              <div className="label">30-Day Total Forecast</div>
              <div className="value" style={{ color: 'var(--accent-mint)' }}>{Math.round(fc.total_forecast)} <span className="unit">units</span></div>
            </div>

            <div className="glass metric-card">
              <div className="label">Projected Trend</div>
              <div className="value" style={{ color: fc.trend_label === 'UP' ? 'var(--accent-mint)' : 'var(--critical)' }}>
                {fc.trend_label === 'UP' ? <TrendingUp size={22} className="inline-icon" /> : <TrendingDown size={22} className="inline-icon" />}
                {fc.trend_label}
              </div>
            </div>

            <div className="glass metric-card">
              <div className="label">Stock Coverage</div>
              <div className="value" style={{ color: rec?.urgency === 'CRITICAL' ? 'var(--critical)' : 'inherit' }}>
                {rec?.days_remaining} <span className="unit">Days</span>
              </div>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="glass chart-container full-width">
            <div className="chart-header">
              <div className="chart-title">
                <BarChart3 size={18} className="text-mint" />
                <h3>30-Day Demand Forecast & 95% Confidence Interval — {fc.product_name}</h3>
              </div>
              <div className="legend-custom">
                <span className="legend-item"><span className="dot historical"></span> Historical</span>
                <span className="legend-item"><span className="dot forecast"></span> 30-Day Forecast</span>
                <span className="legend-item"><span className="dot confidence"></span> 95% Confidence Band</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-mint)" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--accent-mint)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="upper_bound" 
                  name="Upper 95% Bound"
                  stroke="rgba(0, 201, 255, 0.4)" 
                  fillOpacity={1} 
                  fill="url(#colorBand)" 
                  strokeDasharray="2 2"
                  connectNulls={true}
                />
                <Area 
                  type="monotone" 
                  dataKey="historical" 
                  name="Historical Demand"
                  stroke="var(--accent-mint)" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  name="Projected Forecast"
                  stroke="var(--warning)" 
                  fillOpacity={1} 
                  fill="url(#colorForecast)" 
                  strokeWidth={2}
                  connectNulls={true}
                />
                {rec?.reorder_point && (
                  <ReferenceLine y={rec.reorder_point} label="Reorder Point" stroke="var(--critical)" strokeDasharray="3 3" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Reorder Recommendation Banner */}
          {rec?.order_needed && (
            <div className="glass recommendation-alert">
              <AlertTriangle className="alert-icon" />
              <div className="alert-text">
                <h4>Automated Reorder Recommendation Triggered</h4>
                <p>
                  {fc.product_name} stock coverage has dropped below dynamic thresholds. 
                  Recommended PO quantity: <b>{rec.order_qty} units</b> (est. value: <b>₹{rec.order_value.toLocaleString()}</b>). 
                  Urgency Level: <b>{rec.urgency}</b>. Estimated Stockout Date: <b>{rec.stockout_date}</b>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .forecaster-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .control-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sku-select {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          cursor: pointer;
        }

        .sku-select:focus {
          border-color: var(--accent-mint);
        }

        .loading-state {
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .forecast-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .unit { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

        .inline-icon { margin-right: 6px; }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .chart-title { display: flex; align-items: center; gap: 8px; }

        .legend-custom {
          display: flex;
          gap: 16px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .legend-item { display: flex; align-items: center; gap: 6px; }

        .dot.historical { background: var(--accent-mint); box-shadow: 0 0 6px var(--accent-mint); }
        .dot.forecast { background: var(--warning); box-shadow: 0 0 6px var(--warning); }
        .dot.confidence { background: var(--accent-cyan); box-shadow: 0 0 6px var(--accent-cyan); }

        .recommendation-alert {
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          border-left: 4px solid var(--warning);
          background: rgba(245, 158, 11, 0.05);
        }

        .alert-icon {
          color: var(--warning);
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .alert-text h4 {
          color: var(--warning);
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .alert-text p {
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Forecaster;
