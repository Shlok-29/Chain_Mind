import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Bot, 
  Network, 
  TrendingUp, 
  ShieldAlert, 
  AlertOctagon, 
  Clock, 
  Activity,
  Layers,
  Leaf
} from 'lucide-react';

interface DashboardProps {
  industry: string;
  summary: any;
  results: any;
}

import { API_BASE } from '../config';

const Dashboard: React.FC<DashboardProps> = ({ industry, summary, results }) => {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/data/inventory?industry=${industry}`);
        setInventory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInventory();
  }, [industry]);

  const statusColors: any = {
    'CRITICAL': '#ff4b60',
    'LOW': '#f59e0b',
    'REORDER': '#ffdd57',
    'OK': '#00e5a3'
  };

  const pieData = inventory.length > 0 ? Object.entries(
    inventory.reduce((acc: any, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })) : [];

  const barData = inventory.map(item => ({
    name: item.product_name,
    stock: item.current_stock,
    status: item.status
  }));

  const warehouses = Array.from(new Set(inventory.map(item => item.warehouse)));
  const products = Array.from(new Set(inventory.map(item => item.product_name)));
  
  const getStockColor = (stock: number) => {
    if (stock === 0) return 'rgba(255, 75, 96, 0.2)';
    if (stock < 150) return 'rgba(255, 75, 96, 0.4)';
    if (stock < 400) return 'rgba(245, 158, 11, 0.35)';
    return 'rgba(0, 229, 163, 0.35)';
  };

  const criticalDisruptions = results?.alerts?.filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'DISRUPTION') || [
    { severity: 'DISRUPTION', message: 'Port Congestion: JNPT Mumbai — ETA +48h. Agent Swarm rerouting 12 shipments.' },
    { severity: 'CRITICAL', message: 'Low Safety Stock: Paracetamol 500mg (2 days of stock remaining).' }
  ];

  return (
    <div className="dashboard-command">
      {/* Title & Subtitle Banner */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> GLOBAL DASHBOARD
        </div>
        <h1>Network Overview</h1>
        <p className="page-subtitle">Real-time agentic orchestration across global {industry} supply chain nodes. Neural monitoring active.</p>
      </div>

      {/* Top 4 Executive Metric Cards (matching Screenshot 1) */}
      <div className="dashboard-grid">
        <div className="glass metric-card">
          <div className="card-icon-top"><Bot size={18} color="var(--accent-mint)" /></div>
          <div className="label">Autonomy Index</div>
          <div className="value" style={{ color: 'var(--accent-mint)' }}>94.2 <span className="unit">%</span></div>
          <div className="delta delta-up"><TrendingUp size={12} /> +1.2% from last cycle</div>
        </div>

        <div className="glass metric-card">
          <div className="card-icon-top"><Network size={18} color="var(--accent-cyan)" /></div>
          <div className="label">Active SKUs & Nodes</div>
          <div className="value">{inventory.length > 0 ? inventory.length : 24}</div>
          <div className="delta delta-up">All sectors operational</div>
        </div>

        <div className="glass metric-card">
          <div className="card-icon-top"><TrendingUp size={18} color="var(--accent-mint)" /></div>
          <div className="label">Efficiency Gain</div>
          <div className="value" style={{ color: 'var(--accent-mint)' }}>+ 18.5 <span className="unit">%</span></div>
          <div className="delta delta-up">Exceeding target parameters</div>
        </div>

        <div className="glass metric-card">
          <div className="card-icon-top"><Leaf size={18} color="#10b981" /></div>
          <div className="label">Carbon Offset (ESG)</div>
          <div className="value" style={{ color: '#10b981' }}>4.2 <span className="unit">kT</span></div>
          <div className="delta delta-up">Emissions trending downward</div>
        </div>

        <div className="glass metric-card">
          <div className="card-icon-top"><ShieldAlert size={18} color="var(--critical)" /></div>
          <div className="label">Critical Stockouts</div>
          <div className="value" style={{ color: 'var(--critical)' }}>{summary?.critical_count || 0}</div>
          <div className="delta delta-down">Requires urgent PO</div>
        </div>

        <div className="glass metric-card">
          <div className="card-icon-top"><AlertOctagon size={18} color="var(--purple)" /></div>
          <div className="label">Disruptions</div>
          <div className="value" style={{ color: 'var(--purple)' }}>{summary?.disruptions || 0}</div>
          <div className="delta delta-down">Live alerts active</div>
        </div>
      </div>

      {/* Main Content Layout — 2 Columns (Global Visibility vs Critical Disruptions) */}
      <div className="main-command-layout">
        {/* Left Column: Visual Analytics & Heatmap */}
        <div className="left-analytics-col">
          {/* Charts Row */}
          <div className="charts-row">
            <div className="glass chart-container">
              <div className="chart-header-title">
                <Activity size={16} className="title-icon" />
                <h3>Stock Levels by Product</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-25} textAnchor="end" height={50} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="stock">
                    {barData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass chart-container pie-container">
              <div className="chart-header-title">
                <Layers size={16} className="title-icon" />
                <h3>Status Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap Container */}
          <div className="glass heatmap-container">
            <div className="chart-header-title">
              <h3>Warehouse Inventory Matrix</h3>
            </div>
            <div className="heatmap-scroll">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    {products.map(p => <th key={p}>{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w}>
                      <td className="warehouse-label">{w}</td>
                      {products.map(p => {
                        const item = inventory.find(i => i.warehouse === w && i.product_name === p);
                        const stock = item ? item.current_stock : 0;
                        return (
                          <td 
                            key={p} 
                            style={{ backgroundColor: getStockColor(stock) }}
                            title={`${w} | ${p}: ${stock}`}
                          >
                            <span className="stock-val">{stock}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Critical Disruptions & Action Log (matching Screenshot 1) */}
        <div className="right-stream-col">
          {/* Critical Disruptions Card */}
          <div className="glass disruptions-panel">
            <div className="panel-title-red">
              <AlertOctagon size={18} />
              <h3>CRITICAL DISRUPTIONS</h3>
            </div>

            <div className="disruption-cards-list">
              {criticalDisruptions.slice(0, 3).map((dis: any, idx: number) => (
                <div key={idx} className="disruption-stream-item">
                  <div className="stream-header">
                    <span className="stream-type">{dis.severity}</span>
                    <span className="stream-eta">ETA IMPACT</span>
                  </div>
                  <p className="stream-msg">{dis.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Log Card */}
          <div className="glass action-log-panel">
            <div className="panel-title">
              <Clock size={16} />
              <h3>LIVE ACTION LOG</h3>
            </div>

            <div className="log-entries">
              <div className="log-entry">
                <span className="log-badge">OP-AUTO</span>
                <span className="log-time">14:02:45 UTC</span>
                <p className="log-text">Node 0x4F2A triggered inventory balance scan across warehouses.</p>
              </div>
              <div className="log-entry">
                <span className="log-badge">FORECAST</span>
                <span className="log-time">14:01:10 UTC</span>
                <p className="log-text">30-day polynomial trend forecast computed for {industry} SKUs.</p>
              </div>
              <div className="log-entry">
                <span className="log-badge">PROCURE</span>
                <span className="log-time">13:58:30 UTC</span>
                <p className="log-text">Auto-generated PO-AUTO-8821 for critical inventory replenishment.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass table-container">
        <h3>Inventory Health Telemetry</h3>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Warehouse Node</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Stock Coverage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.sort((a, b) => a.days_of_stock - b.days_of_stock).map((item, idx) => (
              <tr key={idx}>
                <td className="font-bold">{item.product_name}</td>
                <td>{item.warehouse}</td>
                <td className="font-mono">{item.current_stock}</td>
                <td className="font-mono">{item.reorder_point}</td>
                <td>{item.days_of_stock} Days</td>
                <td>
                  <span className={`status-pill ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .dashboard-command {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .banner-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-mint);
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .banner-tag .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-mint);
          box-shadow: 0 0 6px var(--accent-mint);
        }

        .card-icon-top {
          position: absolute;
          top: 16px;
          right: 16px;
          opacity: 0.7;
        }

        .unit {
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .main-command-layout {
          display: grid;
          grid-template-columns: 2.8fr 1.2fr;
          gap: 20px;
        }

        .left-analytics-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .chart-container {
          padding: 20px;
        }

        .chart-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .chart-header-title h3 {
          font-size: 0.95rem;
          font-weight: 700;
        }

        .title-icon {
          color: var(--accent-mint);
        }

        .heatmap-container {
          padding: 20px;
        }

        .heatmap-scroll {
          overflow-x: auto;
        }

        .heatmap-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
        }

        .heatmap-table th {
          font-size: 10px;
          color: var(--text-secondary);
          padding: 8px;
          text-transform: uppercase;
        }

        .heatmap-table td {
          height: 38px;
          text-align: center;
          border-radius: 4px;
        }

        .warehouse-label {
          font-size: 11px;
          font-weight: 700;
          text-align: right !important;
          padding-right: 12px !important;
        }

        .stock-val {
          font-size: 10px;
          font-weight: 700;
        }

        .right-stream-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .disruptions-panel {
          padding: 20px;
          border-left: 4px solid var(--critical);
          background: rgba(255, 75, 96, 0.04);
        }

        .panel-title-red {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--critical);
          margin-bottom: 16px;
        }

        .panel-title-red h3 {
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .disruption-cards-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disruption-stream-item {
          background: var(--bg-tertiary);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 75, 96, 0.2);
        }

        .stream-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--critical);
          margin-bottom: 4px;
        }

        .stream-msg {
          font-size: 0.8rem;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .action-log-panel {
          padding: 20px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .panel-title h3 {
          font-size: 0.9rem;
        }

        .log-entries {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .log-entry {
          background: var(--bg-tertiary);
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .log-badge {
          background: rgba(0, 229, 163, 0.1);
          color: var(--accent-mint);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.65rem;
          margin-right: 8px;
        }

        .log-time {
          color: var(--text-muted);
          font-size: 0.65rem;
        }

        .log-text {
          margin-top: 4px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .table-container {
          padding: 20px;
          overflow-x: auto;
        }

        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        .inventory-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .inventory-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
        }

        .font-bold { font-weight: 700; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .status-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .status-pill.critical { background: rgba(255, 75, 96, 0.15); color: var(--critical); border: 1px solid rgba(255, 75, 96, 0.3); }
        .status-pill.low { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-pill.reorder { background: rgba(255, 221, 87, 0.15); color: #ffdd57; border: 1px solid rgba(255, 221, 87, 0.3); }
        .status-pill.ok { background: rgba(0, 229, 163, 0.15); color: var(--accent-mint); border: 1px solid rgba(0, 229, 163, 0.3); }

        @media (max-width: 1100px) {
          .main-command-layout {
            grid-template-columns: 1fr;
          }
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
