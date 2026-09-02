import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, CheckCircle2, Clock, ExternalLink, RefreshCw, Play, Send, Plus, Lock } from 'lucide-react';
import { API_BASE } from '../config';

interface PurchaseOrdersProps {
  industry: string;
  results: any;
  onRunAgents?: () => void;
  agentRunning?: boolean;
  userSession?: any;
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ 
  industry, 
  results, 
  onRunAgents, 
  agentRunning,
  userSession 
}) => {
  const [historicalOrders, setHistoricalOrders] = useState<any[]>([]);
  const [approvedPOs, setApprovedPOs] = useState<Record<string, boolean>>({});
  const [whatsappSent, setWhatsappSent] = useState<Record<string, boolean>>({});

  // Manual PO Create Modal
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [poProductName, setPoProductName] = useState('');
  const [poSupplier, setPoSupplier] = useState('MediChem Pvt Ltd');
  const [poQty, setPoQty] = useState(100);
  const [poUnitCost, setPoUnitCost] = useState(150);

  const role = userSession?.user?.role || 'operations_manager';
  const canCreatePO = ['super_admin', 'operations_manager', 'procurement_officer'].includes(role);

  const authHeader = {
    headers: { Authorization: `Bearer ${userSession?.token}` }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data/orders?industry=${industry}`, authHeader);
      setHistoricalOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [industry, userSession]);

  const handleApprovePO = async (poNumber: string, _poValue?: number) => {
    try {
      await axios.post(`${API_BASE}/api/orders/${poNumber}/approve`, {}, authHeader);
      setApprovedPOs(prev => ({ ...prev, [poNumber]: true }));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to approve purchase order');
    }
  };

  const handleCreateManualPO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/orders/create`, {
        sku: 'SKU-MANUAL',
        product_name: poProductName,
        supplier: poSupplier,
        quantity: poQty,
        unit_cost: poUnitCost,
        industry: industry,
        warehouse: userSession?.user?.warehouse || 'Mumbai Central'
      }, authHeader);

      const newPo = {
        po_number: res.data.po_number,
        product_name: res.data.product_name,
        supplier: res.data.supplier,
        quantity: res.data.quantity,
        total_value: res.data.total_value,
        status: 'PENDING_APPROVAL',
        warehouse: res.data.warehouse
      };

      setHistoricalOrders(prev => [newPo, ...prev]);
      setIsCreatePoOpen(false);
      setPoProductName('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create PO');
    }
  };

  const handleSendWhatsApp = async (po: any) => {
    try {
      await axios.post(`${API_BASE}/api/alerts/whatsapp`, {
        phone_number: "+91 9876543210",
        sku: po.product_name,
        message: `PO Alert (${po.po_number}): ${po.product_name} - Qty: ${po.qty || po.quantity}, Value: ₹${(po.value || po.total_value).toLocaleString()}. Requires sign-off.`
      });
      setWhatsappSent(prev => ({ ...prev, [po.po_number]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const genPOs = results?.generated_pos || [];
  const totalGenValue = genPOs.reduce((acc: number, po: any) => acc + po.value, 0);

  const getTierInfo = (val: number) => {
    if (val < 50000) return { label: 'TIER 1 • AUTO-APPROVED', color: 'var(--accent-mint)', class: 'tier-1' };
    if (val <= 500000) return { label: 'TIER 2 • MANAGER SIGN-OFF', color: 'var(--warning)', class: 'tier-2' };
    return { label: 'TIER 3 • EXECUTIVE / VP APPROVAL', color: 'var(--purple)', class: 'tier-3' };
  };

  // Check if role can approve a specific PO value
  const getApprovalPermission = (poValue: number) => {
    if (['super_admin', 'operations_manager'].includes(role)) {
      return { allowed: true, tooltip: 'Approve PO' };
    }
    if (role === 'executive') {
      if (poValue > 50000) return { allowed: true, tooltip: 'Approve Executive Tier PO' };
      return { allowed: false, tooltip: 'Executives approve POs above ₹50,000 only' };
    }
    if (role === 'procurement_officer') {
      if (poValue <= 50000) return { allowed: true, tooltip: 'Approve PO' };
      return { allowed: false, tooltip: 'Requires Operations Manager approval' };
    }
    return { allowed: false, tooltip: 'No approval permissions for your role' };
  };

  return (
    <div className="orders-page">
      {/* Title Header */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> AUTONOMOUS PROCUREMENT & 3-TIER GOVERNANCE
        </div>
        <div className="banner-flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Purchase Orders Command</h1>
            <p className="page-subtitle">Auto-generated purchase orders with 3-tier financial approval governance and role permissions.</p>
          </div>

          {canCreatePO && (
            <button className="btn btn-primary" onClick={() => setIsCreatePoOpen(true)}>
              <Plus size={16} />
              <span>Create PO Manually</span>
            </button>
          )}
        </div>
      </div>

      <div className="section-header">
        <ShoppingCart size={18} className="text-mint" />
        <h3>Generated Purchase Orders & Approval Tiers</h3>
      </div>

      {genPOs.length > 0 ? (
        <div className="gen-pos-container">
          <div className="glass summary-strip">
            <div className="summary-item">
              <span className="label">Total Generated</span>
              <span className="value">{genPOs.length} POs</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Estimated Value</span>
              <span className="value text-mint">₹{totalGenValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="po-grid">
            {genPOs.map((po: any, idx: number) => {
              const isApproved = po.auto_approved || approvedPOs[po.po_number];
              const tier = getTierInfo(po.value);
              const waSent = whatsappSent[po.po_number];
              const perm = getApprovalPermission(po.value);

              return (
                <div key={idx} className="glass po-card">
                  <div className="po-card-header">
                    <span className="po-number">{po.po_number}</span>
                    <span className={`urgency-tag ${po.urgency.toLowerCase()}`}>{po.urgency}</span>
                  </div>

                  <div className="tier-badge-chip" style={{ color: tier.color, borderColor: tier.color }}>
                    {tier.label}
                  </div>

                  <div className="po-card-body">
                    <h4>{po.product_name}</h4>
                    <div className="po-info-row">
                      <span>Qty: <b>{po.qty} units</b></span>
                      <span>Value: <b className="text-mint">₹{po.value.toLocaleString()}</b></span>
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

                  <div className="po-card-actions">
                    <button 
                      className={`btn btn-wa-alert ${waSent ? 'sent' : ''}`}
                      onClick={() => handleSendWhatsApp(po)}
                      disabled={waSent}
                    >
                      <Send size={12} />
                      <span>{waSent ? 'WhatsApp Sent' : 'WhatsApp Alert'}</span>
                    </button>
                  </div>

                  <div className="po-card-footer">
                    {isApproved ? (
                      <div className="status-approved">
                        <CheckCircle2 size={16} />
                        <span>{po.auto_approved ? 'Tier 1 Auto-Approved' : 'Approved & Authorized'}</span>
                      </div>
                    ) : (
                      <button 
                        className={`btn btn-secondary btn-sm ${!perm.allowed ? 'btn-disabled-locked' : ''}`}
                        onClick={() => perm.allowed && handleApprovePO(po.po_number, po.value)}
                        disabled={!perm.allowed}
                        title={perm.tooltip}
                      >
                        {!perm.allowed && <Lock size={12} className="mr-4" />}
                        <span>{perm.allowed ? (po.value > 500000 ? 'VP Multi-Factor Sign-off' : 'Approve PO') : perm.tooltip}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass empty-state">
          <p>No new purchase orders generated in the current cycle.</p>
          {['super_admin', 'operations_manager'].includes(role) && onRunAgents && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={onRunAgents}
              disabled={agentRunning}
            >
              {agentRunning ? <RefreshCw className="spin" size={14} /> : <Play size={14} />}
              <span>{agentRunning ? 'Running Swarm...' : 'Run Swarm Pipeline'}</span>
            </button>
          )}
        </div>
      )}

      {/* Historical Purchase Orders Section */}
      <div className="section-header mt-32">
        <ExternalLink size={18} className="text-mint" />
        <h3>Historical Purchase Orders & Dispatch Telemetry</h3>
      </div>

      <div className="glass table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Product Name</th>
              <th>Preferred Supplier</th>
              <th>Quantity</th>
              <th>Total Value</th>
              <th>Approval Tier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {historicalOrders.map((po, idx) => {
              const tier = getTierInfo(po.total_value);
              return (
                <tr key={idx}>
                  <td className="font-mono text-cyan">{po.po_number}</td>
                  <td className="font-bold">{po.product_name}</td>
                  <td>{po.supplier}</td>
                  <td className="font-mono">{po.quantity}</td>
                  <td className="font-mono text-mint">₹{po.total_value.toLocaleString()}</td>
                  <td><span className="tier-text-sm" style={{ color: tier.color }}>{tier.label.split('•')[0]}</span></td>
                  <td>
                    <span className={`status-pill po-${po.status.replace(' ', '-').toLowerCase()}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MANUAL PO CREATION MODAL */}
      {isCreatePoOpen && (
        <div className="nl-modal-overlay" onClick={() => setIsCreatePoOpen(false)}>
          <div className="glass nl-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Purchase Order Manually</h3>
            </div>
            <form onSubmit={handleCreateManualPO} className="auth-form mt-16">
              <div className="input-field-group">
                <label>PRODUCT NAME</label>
                <input 
                  type="text" 
                  value={poProductName} 
                  onChange={e => setPoProductName(e.target.value)} 
                  placeholder="e.g. Paracetamol 500mg Raw Material" 
                  required 
                />
              </div>

              <div className="input-field-group">
                <label>PREFERRED SUPPLIER</label>
                <select value={poSupplier} onChange={e => setPoSupplier(e.target.value)}>
                  <option value="MediChem Pvt Ltd">MediChem Pvt Ltd</option>
                  <option value="PharmaSynth India">PharmaSynth India</option>
                  <option value="GlobalMed Suppliers">GlobalMed Suppliers</option>
                  <option value="HUL Distribution">HUL Distribution</option>
                  <option value="Bosch Auto Parts">Bosch Auto Parts</option>
                </select>
              </div>

              <div className="input-grid-row">
                <div className="input-field-group">
                  <label>QUANTITY (UNITS)</label>
                  <input 
                    type="number" 
                    value={poQty} 
                    onChange={e => setPoQty(parseInt(e.target.value) || 0)} 
                    required 
                  />
                </div>
                <div className="input-field-group">
                  <label>UNIT COST (₹)</label>
                  <input 
                    type="number" 
                    value={poUnitCost} 
                    onChange={e => setPoUnitCost(parseFloat(e.target.value) || 0)} 
                    required 
                  />
                </div>
              </div>

              <div className="summary-item mt-12" style={{ padding: '10px 14px', background: 'rgba(0, 229, 163, 0.08)', borderRadius: '6px' }}>
                <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estimated Total Value:</span>
                <span className="value text-mint font-mono font-bold" style={{ marginLeft: '8px' }}>₹{(poQty * poUnitCost).toLocaleString()}</span>
              </div>

              <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatePoOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .btn-disabled-locked {
          opacity: 0.5;
          cursor: not-allowed !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          color: var(--text-muted) !important;
        }

        .orders-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-header h3 {
          font-size: 1rem;
          font-weight: 700;
        }

        .mt-32 { margin-top: 32px; }

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
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .po-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .po-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tier-badge-chip {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid;
          background: rgba(15, 23, 42, 0.6);
          width: fit-content;
        }

        .po-number {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: var(--accent-cyan);
          font-size: 0.85rem;
        }

        .urgency-tag {
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .urgency-tag.critical { background: rgba(255, 75, 96, 0.2); color: var(--critical); border: 1px solid rgba(255, 75, 96, 0.4); }
        .urgency-tag.warning { background: rgba(245, 158, 11, 0.2); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.4); }
        .urgency-tag.reorder { background: rgba(255, 221, 87, 0.2); color: #ffdd57; border: 1px solid rgba(255, 221, 87, 0.4); }

        .po-card-body h4 {
          font-size: 0.95rem;
          margin-bottom: 8px;
        }

        .po-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .po-supplier {
          font-size: 0.8rem;
          display: flex;
          gap: 8px;
          color: var(--text-secondary);
        }

        .po-eta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .po-card-actions {
          margin-top: 4px;
        }

        .btn-wa-alert {
          background: rgba(37, 211, 102, 0.1);
          border: 1px solid rgba(37, 211, 102, 0.3);
          color: #25D366;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .btn-wa-alert.sent {
          background: rgba(37, 211, 102, 0.2);
          opacity: 0.8;
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
          color: var(--accent-mint);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .empty-state {
          padding: 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-secondary);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-bold { font-weight: 700; }
        .text-cyan { color: var(--accent-cyan); }
        .text-mint { color: var(--accent-mint); }
        .tier-text-sm { font-size: 0.75rem; font-weight: 800; }

        .status-pill.po-delivered { color: var(--accent-mint); background: rgba(0,229,163,0.1); }
        .status-pill.po-in-transit { color: var(--accent-blue); background: rgba(59,130,246,0.1); }
        .status-pill.po-processing { color: var(--warning); background: rgba(245,158,11,0.1); }
        .status-pill.po-pending { color: var(--text-muted); background: rgba(100,116,139,0.1); }
      `}</style>
    </div>
  );
};

export default PurchaseOrders;
