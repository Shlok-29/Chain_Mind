import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  CheckCircle2, 
  Zap, 
  Sliders, 
  Play
} from 'lucide-react';

interface DisruptionMapProps {
  industry: string;
  disruptionActive: boolean;
  disruptionType: string;
}

import { API_BASE } from '../config';

const DisruptionMap: React.FC<DisruptionMapProps> = ({ industry, disruptionActive, disruptionType }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('Port Strike');
  const [selectedRegion, setSelectedRegion] = useState('Southeast Asia Ports');
  const [durationDays, setDurationDays] = useState(14);
  const [allowRerouting, setAllowRerouting] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/data/suppliers?industry=${industry}`);
        setSuppliers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuppliers();
  }, [industry]);

  const reliabilityData = suppliers.map(s => ({
    name: s.supplier,
    reliability: Math.round(s.reliability_score * 100),
    disrupted: s.has_disruption
  })).sort((a, b) => a.reliability - b.reliability);

  return (
    <div className="simulations-page">
      {/* Title Header matching Screenshot 2 */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> SIMULATIONS ENVIRONMENT ACTIVE
        </div>
        <div className="flex-between">
          <div>
            <h1>Resilience Simulations</h1>
            <p className="page-subtitle">Model supply chain disruptions, evaluate mitigation strategies, and forecast operational impacts across the network in real-time.</p>
          </div>
          <div className="action-buttons-group">
            <button className="btn btn-primary">
              <Play size={14} /> RUN SIMULATION
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: What-If Builder & Alternate Suppliers (matching Screenshot 2) */}
      <div className="simulations-grid">
        {/* Left Column: What-If Builder */}
        <div className="left-builder-col">
          <div className="glass builder-card">
            <div className="builder-header">
              <div className="builder-title">
                <Sliders size={18} className="text-mint" />
                <h3>'What-If' Scenario Builder</h3>
              </div>
            </div>

            <div className="inputs-row">
              <div className="input-group">
                <label className="input-label">DISRUPTION EVENT</label>
                <select 
                  value={selectedEvent} 
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="scenario-select"
                >
                  <option value="JNPT Mumbai Port Strike">JNPT Mumbai Port Customs Backlog & Strike</option>
                  <option value="Chennai Monsoon Floods">Chennai / Kerala Monsoon Highway Flooding</option>
                  <option value="NH-44 Landslide Delay">NH-44 Landslide Freight Delay (Delhi-BLR)</option>
                  <option value="Diwali Peak Surge">Diwali Festive Peak Surge (+150% Volume)</option>
                  <option value="Interstate GST Hold">Interstate GST Border Clearance Hold</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">IMPACT REGION</label>
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="scenario-select"
                >
                  <option value="JNPT Mumbai Hub">JNPT Mumbai Port Hub</option>
                  <option value="Chennai Freight Corridor">Chennai / South India Corridor</option>
                  <option value="Delhi-NCR Freight Route">Delhi-NCR Freight Route (NH-44)</option>
                  <option value="Bangalore DC">Bangalore Logistics Hub</option>
                </select>
              </div>
            </div>

            <div className="slider-group">
              <div className="slider-label-row">
                <span className="input-label">EXPECTED DURATION</span>
                <span className="duration-val">{durationDays} DAYS</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={durationDays} 
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="duration-range-slider"
              />
              <div className="range-bounds"><span>1 Day</span><span>30 Days</span></div>
            </div>

            <div className="toggles-row">
              <button 
                className={`toggle-chip ${allowRerouting ? 'active' : ''}`}
                onClick={() => setAllowRerouting(!allowRerouting)}
              >
                <CheckCircle2 size={14} /> Allow Rerouting
              </button>
              <button className="toggle-chip active">
                <CheckCircle2 size={14} /> Expedite Freight
              </button>
              <button className="toggle-chip active">
                <CheckCircle2 size={14} /> Use Safety Stock
              </button>
            </div>

            {/* Score & Variance Indicators */}
            <div className="builder-metrics-row">
              <div className="glass sub-metric-box">
                <span className="sub-label">PROJECTED COST VARIANCE</span>
                <div className="sub-val text-critical">+$4.2M <span className="sub-unit">~12%</span></div>
              </div>

              <div className="glass score-ring-box">
                <div className="score-ring">
                  <span className="score-val">77</span>
                  <span className="score-lbl">SCORE</span>
                </div>
                <span className="network-resilience-title">Network Resilience</span>
              </div>
            </div>
          </div>

          {/* Live Disruption Alert Banner */}
          {disruptionActive && (
            <div className="glass live-disruption-banner">
              <div className="banner-icon"><Zap className="pulse" /></div>
              <div className="banner-text">
                <h4>LIVE DISRUPTION ACTIVE: {disruptionType}</h4>
                <p>Agent Swarm routing protocol active. Alternate suppliers selected with backup POs queued.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Alternate Suppliers Cards (matching Screenshot 2) */}
        <div className="right-suppliers-col">
          <div className="glass suppliers-panel">
            <div className="panel-head">
              <h3>Alternate Suppliers</h3>
              <span className="panel-sub">VIABLE FALLBACK NODES</span>
            </div>

            <div className="fallback-nodes-list">
              {suppliers.slice(0, 3).map((sup, idx) => (
                <div key={idx} className={`glass fallback-card ${!sup.has_disruption ? 'recommended' : ''}`}>
                  <div className="fallback-head">
                    <span className="country-badge">IN</span>
                    <div>
                      <h4>{sup.supplier}</h4>
                      <span className="tier-tag">TIER 1 • {sup.industry}</span>
                    </div>
                    {!sup.has_disruption && <CheckCircle2 size={16} className="text-mint check-right" />}
                  </div>

                  <div className="fallback-stats">
                    <div className="stat-col">
                      <span className="stat-lbl">LEAD TIME</span>
                      <span className="stat-val">{sup.avg_lead_days || 7} Days <span className="stat-delta text-mint">(+2)</span></span>
                    </div>
                    <div className="stat-col">
                      <span className="stat-lbl">UNIT COST</span>
                      <span className="stat-val">₹{sup.unit_cost || 45}</span>
                    </div>
                  </div>

                  <div className="match-capacity-bar">
                    <div className="match-fill" style={{ width: `${Math.round(sup.reliability_score * 100)}%` }}></div>
                  </div>
                  <span className="capacity-lbl">CAPACITY: {Math.round(sup.reliability_score * 100)}% MATCH</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Reliability Chart */}
      <div className="glass chart-container full-width">
        <h3>Supplier Reliability Intelligence</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={reliabilityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
            <YAxis dataKey="name" type="category" stroke="#64748b" width={150} fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="reliability">
              {reliabilityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.disrupted ? 'var(--critical)' : 'var(--accent-mint)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .simulations-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .simulations-grid {
          display: grid;
          grid-template-columns: 2.7fr 1.3fr;
          gap: 20px;
        }

        .left-builder-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .builder-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .builder-header { display: flex; align-items: center; justify-content: space-between; }
        .builder-title { display: flex; align-items: center; gap: 8px; }

        .inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); letter-spacing: 0.5px; }

        .scenario-select {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-label-row { display: flex; justify-content: space-between; }
        .duration-val { font-size: 0.85rem; font-weight: 800; color: var(--accent-mint); font-family: 'JetBrains Mono', monospace; }

        .duration-range-slider {
          accent-color: var(--accent-mint);
          cursor: pointer;
        }

        .range-bounds { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); }

        .toggles-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toggle-chip {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toggle-chip.active {
          background: rgba(0,229,163,0.1);
          border-color: rgba(0,229,163,0.3);
          color: var(--accent-mint);
        }

        .builder-metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 8px;
        }

        .sub-metric-box {
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .sub-label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); }
        .sub-val { font-size: 1.5rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
        .sub-unit { font-size: 0.85rem; color: var(--text-muted); }
        .text-critical { color: var(--critical); }

        .score-ring-box {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-ring {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: 4px solid var(--accent-mint);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(0,229,163,0.3);
        }

        .score-val { font-size: 1.1rem; font-weight: 800; color: var(--accent-mint); font-family: 'JetBrains Mono', monospace; }
        .score-lbl { font-size: 0.5rem; color: var(--text-secondary); font-weight: 700; }
        .network-resilience-title { font-size: 0.9rem; font-weight: 700; }

        .live-disruption-banner {
          padding: 16px 20px;
          background: rgba(255,75,96,0.08);
          border-left: 4px solid var(--critical);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .banner-icon { color: var(--critical); }
        .banner-text h4 { font-size: 0.85rem; color: var(--critical); margin-bottom: 2px; }
        .banner-text p { font-size: 0.8rem; color: var(--text-secondary); }

        .suppliers-panel {
          padding: 20px;
        }

        .panel-head h3 { font-size: 0.95rem; }
        .panel-sub { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px; }

        .fallback-nodes-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 16px;
        }

        .fallback-card {
          padding: 14px;
          position: relative;
        }

        .fallback-card.recommended {
          border-color: rgba(0,229,163,0.3);
        }

        .fallback-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .country-badge { background: rgba(59,130,246,0.2); color: var(--accent-blue); padding: 4px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; }
        .fallback-head h4 { font-size: 0.85rem; margin-bottom: 2px; }
        .tier-tag { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; }
        .check-right { margin-left: auto; }

        .fallback-stats { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .stat-col { display: flex; flex-direction: column; }
        .stat-lbl { font-size: 0.6rem; color: var(--text-muted); font-weight: 700; }
        .stat-val { font-size: 0.8rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        .stat-delta { font-size: 0.7rem; }

        .match-capacity-bar { height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
        .match-fill { height: 100%; background: var(--accent-mint); }
        .capacity-lbl { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px; }

        .chart-container { padding: 20px; }

        @media (max-width: 1100px) {
          .simulations-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default DisruptionMap;
