import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface PurchaseOrdersProps {
  industry: string;
  results: any;
  onRunAgents?: () => void;
  agentRunning?: boolean;
}

const API_BASE = 'http://localhost:8000';

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ industry, results, onRunAgents, agentRunning }) => {
  const [historicalOrders, setHistoricalOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_BASE}/data/orders?industry=${industry}`);
        setHistoricalOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, [industry]);

  const genPOs = results?.generated_pos || [];
  const totalGenValue = genPOs.reduce((acc: number, po: any) => acc + po.value, 0);

  return (
    <div className="purchase-orders">
      <div className="section-header">
        <ShoppingCart size={20} />
        <h3>Auto-Generated Purchase Orders</h3>
      </div>

      {genPOs.length > 0 ? (
        <div className="gen-pos-container">
          <div className="glass summary-strip">
            <div className="summary-item">
              <span className="label">Total Generated</span>
              <span className="value">{genPOs.length} POs</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Value</span>
              <span className="value">₹{totalGenValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="po-grid">
            {genPOs.map((po: any, idx: number) => (
              <div key={idx} className="glass po-card">
                <div className="po-card-header">
                  <span className="po-number">{po.po_number}</span>
                  <span className={`urgency-tag ${po.urgency.toLowerCase()}`}>{po.urgency}</span>
                </div>
                <div className="po-card-body">
                  <h4>{po.product_name}</h4>
                  <div className="po-info-row">
                    <span>Qty: <b>{po.qty}</b></span>
                    <span>Value: <b>₹{po.value.toLocaleString()}</b></span>
                  </div>
                  <div className="po-supplier">
                    <span className="label">Supplier:</span>
                    <span>{po.supplier}</span>
                  </div>
                  <div className="po-eta">
                    <Clock size={14} />
                    <span>ETA: {po.expected_delivery}</span>
                  </div>
                </div>
                <div className="po-card-footer">
                  {po.auto_approved ? (
                    <div className="status-approved">
                      <CheckCircle size={14} />
                      <span>Auto-Approved</span>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm">Review & Approve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass empty-state">
          <p>No purchase orders generated in the latest agent run.</p>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onRunAgents}
            disabled={agentRunning}
          >
            {agentRunning ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
      )}

      <div className="section-header mt-40">
        <ExternalLink size={20} />
        <h3>Historical Purchase Orders</h3>
      </div>

      <div className="glass table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Product</th>
              <th>Supplier</th>
              <th>Qty</th>
              <th>Value</th>
              <th>Order Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {historicalOrders.map((po, idx) => (
              <tr key={idx}>
                <td className="font-mono">{po.po_number}</td>
                <td>{po.product_name}</td>
                <td>{po.supplier}</td>
                <td>{po.quantity}</td>
                <td>₹{po.total_value.toLocaleString()}</td>
                <td>{po.order_date}</td>
                <td>
                  <span className={`status-pill po-${po.status.replace(' ', '-').toLowerCase()}`}>
                    {po.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .purchase-orders {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
        }

        .mt-40 { margin-top: 40px; }

        .summary-strip {
          padding: 16px 24px;
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .po-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .po-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .po-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .po-number {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .urgency-tag {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .urgency-tag.critical { background: var(--critical); color: #fff; }
        .urgency-tag.warning { background: var(--warning); color: #000; }
        .urgency-tag.reorder { background: #ffdd57; color: #000; }

        .po-card-body h4 {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .po-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .po-supplier {
          font-size: 0.85rem;
          display: flex;
          gap: 8px;
        }

        .po-eta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 8px;
        }

        .po-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }

        .status-approved {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--success);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .status-pill.po-delivered { color: var(--success); }
        .status-pill.po-in-transit { color: var(--info); }
        .status-pill.po-processing { color: var(--warning); }
        .status-pill.po-pending { color: var(--text-secondary); }
      `}</style>
    </div>
  );
};

export default PurchaseOrders;
