import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';


interface DashboardProps {
  industry: string;
  summary: any;
  results: any;
}

const API_BASE = 'http://localhost:8000';

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
    'CRITICAL': '#ff4b4b',
    'LOW': '#ffa500',
    'REORDER': '#ffdd57',
    'OK': '#00c853'
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

  // Heatmap Data Preparation
  const warehouses = Array.from(new Set(inventory.map(item => item.warehouse)));
  const products = Array.from(new Set(inventory.map(item => item.product_name)));
  
  const getStockColor = (stock: number) => {
    if (stock === 0) return '#1a1a1a';
    if (stock < 50) return 'rgba(255, 75, 75, 0.4)';
    if (stock < 150) return 'rgba(255, 165, 0, 0.4)';
    return 'rgba(0, 200, 83, 0.4)';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="glass metric-card premium-shadow">
          <div className="label">Critical Items</div>
          <div className="value" style={{color: 'var(--critical)'}}>{summary?.critical_count || 0}</div>
          <div className="delta delta-down">Needs PO</div>
        </div>
        <div className="glass metric-card premium-shadow">
          <div className="label">Low Stock</div>
          <div className="value" style={{color: 'var(--warning)'}}>{summary?.low_count || 0}</div>
        </div>
        <div className="glass metric-card premium-shadow">
          <div className="label">Healthy Items</div>
          <div className="value" style={{color: 'var(--success)'}}>{summary?.ok_count || 0}</div>
        </div>
        <div className="glass metric-card premium-shadow">
          <div className="label">Total Value</div>
          <div className="value">₹{(summary?.total_inventory_value / 100000).toFixed(1)}L</div>
        </div>
        <div className="glass metric-card premium-shadow">
          <div className="label">Pending POs</div>
          <div className="value" style={{color: 'var(--accent-primary)'}}>{results?.generated_pos?.length || 0}</div>
        </div>
        <div className="glass metric-card premium-shadow">
          <div className="label">Disruptions</div>
          <div className="value" style={{color: 'var(--purple)'}}>{summary?.disruptions || 0}</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="glass chart-container">
          <h3>Inventory Status by Product</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" fontSize={10} tick={{fill: '#888'}} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px'}}
                itemStyle={{color: '#fff'}}
              />
              <Bar dataKey="stock">
                {barData.map((entry: any, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass chart-container pie-container">
          <h3>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry: any, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px'}}
                itemStyle={{color: '#fff'}}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass heatmap-container">
        <h3>Warehouse Inventory Heatmap</h3>
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

      <div className="glass table-container">
        <h3>Inventory Health Table</h3>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Stock</th>
              <th>Reorder At</th>
              <th>Days Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.sort((a, b) => a.days_of_stock - b.days_of_stock).map((item, idx) => (
              <tr key={idx}>
                <td>{item.product_name}</td>
                <td>{item.warehouse}</td>
                <td>{item.current_stock}</td>
                <td>{item.reorder_point}</td>
                <td>{item.days_of_stock}d</td>
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
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .chart-container {
          padding: 20px;
        }

        .chart-container h3 {
          margin-bottom: 20px;
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .heatmap-container {
          padding: 20px;
        }

        .heatmap-container h3 {
          margin-bottom: 20px;
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .heatmap-scroll {
          overflow-x: auto;
          border-radius: 8px;
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
          min-width: 80px;
        }

        .heatmap-table td {
          height: 40px;
          text-align: center;
          border-radius: 4px;
          transition: transform 0.2s;
        }

        .heatmap-table td:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        .warehouse-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-primary);
          text-align: right !important;
          padding-right: 12px !important;
          min-width: 120px !important;
        }

        .stock-val {
          font-size: 10px;
          font-weight: 600;
          opacity: 0.8;
        }

        .table-container {
          padding: 20px;
          overflow-x: auto;
        }

        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .inventory-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .inventory-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-pill.critical { background: rgba(255, 75, 75, 0.1); color: var(--critical); border: 1px solid rgba(255, 75, 75, 0.2); }
        .status-pill.low { background: rgba(255, 165, 0, 0.1); color: var(--warning); border: 1px solid rgba(255, 165, 0, 0.2); }
        .status-pill.reorder { background: rgba(255, 221, 87, 0.1); color: #ffdd57; border: 1px solid rgba(255, 221, 87, 0.2); }
        .status-pill.ok { background: rgba(0, 200, 83, 0.1); color: var(--success); border: 1px solid rgba(0, 200, 83, 0.2); }
      `}</style>
    </div>
  );
};

export default Dashboard;
