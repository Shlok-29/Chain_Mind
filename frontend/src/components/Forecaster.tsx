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
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';

interface ForecasterProps {
  industry: string;
}

const API_BASE = 'http://localhost:8000';

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

  const chartData = forecastData ? [
    ...forecastData.forecast.history_dates.map((date: string, i: number) => ({
      date,
      value: forecastData.forecast.history_values[i],
      type: 'Historical'
    })),
    ...forecastData.forecast.forecast_dates.map((date: string, i: number) => ({
      date,
      value: forecastData.forecast.forecast_values[i],
      type: 'Forecast'
    }))
  ] : [];

  const rec = forecastData?.recommendation;
  const fc = forecastData?.forecast;

  return (
    <div className="forecaster">
      <div className="glass control-card">
        <label className="label">Select Product to Forecast</label>
        <select 
          value={selectedSku} 
          onChange={(e) => setSelectedSku(e.target.value)}
          className="sku-select"
        >
          {skus.map(s => (
            <option key={s.sku} value={s.sku}>{s.sku} — {s.product_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spin" />
          <span>Generating intelligent forecast...</span>
        </div>
      ) : forecastData && (
        <div className="forecast-content">
          <div className="dashboard-grid">
            <div className="glass metric-card">
              <div className="label">Avg Daily Demand</div>
              <div className="value">{fc.avg_daily_demand}</div>
            </div>
            <div className="glass metric-card">
              <div className="label">30-Day Forecast</div>
              <div className="value">{Math.round(fc.total_forecast)}</div>
            </div>
            <div className="glass metric-card">
              <div className="label">Trend</div>
              <div className="value" style={{color: fc.trend_label === 'UP' ? 'var(--success)' : 'var(--critical)'}}>
                {fc.trend_label === 'UP' ? <TrendingUp /> : <TrendingDown />}
                {fc.trend_label}
              </div>
            </div>
            <div className="glass metric-card">
              <div className="label">Days Remaining</div>
              <div className="value" style={{color: rec?.urgency === 'CRITICAL' ? 'var(--critical)' : 'inherit'}}>
                {rec?.days_remaining} Days
              </div>
            </div>
          </div>

          <div className="glass chart-container full-width">
            <div className="chart-header">
              <h3>30-Day Demand Forecast — {fc.product_name}</h3>
              <div className="legend-custom">
                <span className="dot historical"></span> Historical
                <span className="dot forecast"></span> Forecast
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--accent-primary)" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
                {rec?.reorder_point && (
                  <ReferenceLine y={rec.reorder_point} label="Reorder Point" stroke="var(--critical)" strokeDasharray="3 3" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {rec?.order_needed && (
            <div className="glass recommendation-alert">
              <AlertTriangle className="icon" />
              <div className="alert-text">
                <h4>Reorder Recommended</h4>
                <p>
                  {fc.product_name} needs <b>{rec.order_qty} units</b> (est. ₹{rec.order_value.toLocaleString()}). 
                  Urgency: <b>{rec.urgency}</b>. Expected stockout: <b>{rec.stockout_date}</b>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .forecaster {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .control-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sku-select {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
        }

        .sku-select:focus {
          border-color: var(--accent-primary);
        }

        .forecast-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .legend-custom {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .legend-custom .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 4px;
        }

        .dot.historical { background: var(--accent-primary); }
        .dot.forecast { background: var(--warning); }

        .recommendation-alert {
          padding: 20px;
          display: flex;
          gap: 20px;
          align-items: center;
          border-left: 4px solid var(--warning);
          background: rgba(255, 165, 0, 0.05);
        }

        .recommendation-alert h4 {
          color: var(--warning);
          margin-bottom: 4px;
        }

        .recommendation-alert .icon {
          color: var(--warning);
          width: 32px;
          height: 32px;
        }
      `}</style>
    </div>
  );
};

export default Forecaster;
