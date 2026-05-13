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
import { AlertOctagon, CheckCircle2, Zap } from 'lucide-react';

interface DisruptionMapProps {
  industry: string;
  disruptionActive: boolean;
  disruptionType: string;
}

const API_BASE = 'http://localhost:8000';

const DisruptionMap: React.FC<DisruptionMapProps> = ({ industry, disruptionActive, disruptionType }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);

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

  const disrupted = suppliers.filter(s => s.has_disruption);
  const healthy = suppliers.filter(s => !s.has_disruption);

  const reliabilityData = suppliers.map(s => ({
    name: s.supplier,
    reliability: Math.round(s.reliability_score * 100),
    disrupted: s.has_disruption
  })).sort((a, b) => a.reliability - b.reliability);

  return (
    <div className="disruption-map">
      <div className="dashboard-grid">
        <div className="glass metric-card">
          <div className="label">Disrupted Suppliers</div>
          <div className="value" style={{color: 'var(--critical)'}}>{disrupted.length}</div>
        </div>
        <div className="glass metric-card">
          <div className="label">Healthy Suppliers</div>
          <div className="value" style={{color: 'var(--success)'}}>{healthy.length}</div>
        </div>
      </div>

      {disruptionActive && (
        <div className="glass live-disruption-banner">
          <div className="banner-icon"><Zap className="pulse" /></div>
          <div className="banner-text">
            <h4>LIVE DISRUPTION IN PROGRESS</h4>
            <p>{disruptionType}</p>
          </div>
          <div className="banner-agent-note">
            <div className="agent-logo">🤖</div>
            <p>Agent Response: Alternate supplier routing protocol activated. Emergency POs in queue.</p>
          </div>
        </div>
      )}

      {disrupted.length > 0 && (
        <div className="disrupted-list">
          <h3><AlertOctagon size={18} /> Active Supplier Disruptions</h3>
          {disrupted.map((s, idx) => {
            const alternates = suppliers
              .filter(alt => alt.sku === s.sku && !alt.has_disruption)
              .sort((a, b) => b.reliability_score - a.reliability_score);
            
            const bestAlt = alternates.length > 0 ? alternates[0] : null;

            return (
              <div key={idx} className="glass disrupted-item">
                <div className="disrupted-header">
                  <span className="supplier-name">🟣 {s.supplier}</span>
                  <span className="product-impact">{s.product_name} ({s.sku})</span>
                </div>
                <p className="disruption-reason">
                  <b>Reason:</b> {s.disruption_reason} | <b>Lead Impact:</b> +{s.disruption_days} days
                </p>
                <div className="alternate-rec">
                  <CheckCircle2 size={14} className={`rec-icon ${!bestAlt ? 'none' : ''}`} />
                  <span>
                    {bestAlt ? (
                      <>Agent Recommendation: Switch to <b>{bestAlt.supplier}</b> (Reliability: {Math.round(bestAlt.reliability_score * 100)}%)</>
                    ) : (
                      <>No immediate alternate supplier available for this SKU.</>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass chart-container full-width">
        <h3>Supplier Reliability Intelligence</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reliabilityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="#888" />
            <YAxis dataKey="name" type="category" stroke="#888" width={150} fontSize={10} />
            <Tooltip 
              contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px'}}
              itemStyle={{color: '#fff'}}
            />
            <Bar dataKey="reliability">
              {reliabilityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.disrupted ? 'var(--critical)' : 'var(--success)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .disruption-map {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .live-disruption-banner {
          padding: 24px;
          background: linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(0, 0, 0, 0));
          border-left: 4px solid var(--purple);
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .banner-icon { color: var(--purple); }
        .banner-text h4 { color: var(--purple); margin-bottom: 4px; font-size: 0.8rem; letter-spacing: 1px; }
        .banner-text p { font-size: 1.1rem; font-weight: 700; }

        .banner-agent-note {
          margin-left: auto;
          background: var(--bg-tertiary);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          gap: 12px;
          max-width: 400px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .disrupted-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disrupted-list h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .disrupted-item {
          padding: 16px;
          border-left: 3px solid var(--purple);
        }

        .disrupted-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .supplier-name { font-weight: 700; }
        .product-impact { font-size: 0.85rem; color: var(--text-secondary); }

        .disruption-reason {
          font-size: 0.85rem;
          margin-bottom: 12px;
        }

        .alternate-rec {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--success);
          background: rgba(0, 200, 83, 0.05);
          padding: 6px 12px;
          border-radius: 6px;
          width: fit-content;
        }

        .rec-icon { min-width: 14px; }
      `}</style>
    </div>
  );
};

export default DisruptionMap;
