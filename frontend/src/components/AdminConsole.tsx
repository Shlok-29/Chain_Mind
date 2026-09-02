import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  FileSpreadsheet, 
  History, 
  RefreshCw
} from 'lucide-react';
import { API_BASE } from '../config';

interface AdminConsoleProps {
  userSession: any;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ userSession }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('operations_manager');
  const [formIndustry, setFormIndustry] = useState('Pharma');
  const [formWarehouse, setFormWarehouse] = useState('Mumbai Central');

  const authHeader = {
    headers: { Authorization: `Bearer ${userSession?.token}` }
  };

  const isSuperAdmin = userSession?.user?.role === 'super_admin';

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/users`, authHeader);
      setUsers(res.data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/audit-logs`, authHeader);
      setAuditLogs(res.data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users' && isSuperAdmin) {
      fetchUsers();
    } else if (activeSubTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeSubTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/users`,
        {
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          industry: formIndustry,
          warehouse: formWarehouse
        },
        authHeader
      );
      setIsCreateModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create user');
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setLoading(true);
      await axios.put(
        `${API_BASE}/api/admin/users/${selectedUser.id}`,
        {
          name: formName,
          role: formRole,
          industry: formIndustry,
          warehouse: formWarehouse
        },
        authHeader
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update user');
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await axios.patch(`${API_BASE}/api/admin/users/${userId}/status`, {}, authHeader);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormIndustry(u.industry || 'Pharma');
    setFormWarehouse(u.warehouse || 'Mumbai Central');
    setIsEditModalOpen(true);
  };

  const exportAuditCSV = () => {
    const headers = ['ID', 'Timestamp', 'User Email', 'User Role', 'Action', 'Details'];
    const rows = auditLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user_email}"`,
      `"${l.user_role}"`,
      `"${l.action}"`,
      `"${l.details?.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chainmind_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(l => 
    l.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rolesList = [
    { value: 'super_admin', label: 'ROLE 1: Super Admin' },
    { value: 'executive', label: 'ROLE 2: Executive' },
    { value: 'operations_manager', label: 'ROLE 3: Operations Manager' },
    { value: 'procurement_officer', label: 'ROLE 4: Procurement Officer' },
    { value: 'warehouse_manager', label: 'ROLE 5: Warehouse Manager' },
    { value: 'demand_planner', label: 'ROLE 6: Demand Planner' },
    { value: 'supplier_manager', label: 'ROLE 7: Supplier Manager' },
    { value: 'auditor', label: 'ROLE 8: Auditor' },
  ];

  return (
    <div className="admin-console-page">
      {/* Header Banner */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> SUPER ADMIN GOVERNANCE & AUDIT CONTROLS
        </div>
        <h1>Enterprise Administration Console</h1>
        <p className="page-subtitle">Manage user roles, access privileges, industry assignments, and real-time audit trails.</p>
      </div>

      {/* Subtab Navigation */}
      <div className="admin-subtabs glass">
        {isSuperAdmin && (
          <button 
            className={`admin-subtab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('users')}
          >
            <Users size={16} />
            <span>User Management ({users.length})</span>
          </button>
        )}
        <button 
          className={`admin-subtab-btn ${activeSubTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('audit')}
        >
          <History size={16} />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Top Action Toolbar */}
      <div className="admin-toolbar">
        <div className="search-box glass">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder={activeSubTab === 'users' ? "Search users by name, email, or role..." : "Filter audit logs..."} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          {activeSubTab === 'users' && isSuperAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus size={14} />
              <span>Create New User</span>
            </button>
          )}

          {activeSubTab === 'audit' && (
            <button className="btn btn-secondary btn-sm" onClick={exportAuditCSV}>
              <FileSpreadsheet size={14} className="text-mint" />
              <span>Export Audit Trail (CSV)</span>
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={activeSubTab === 'users' ? fetchUsers : fetchAuditLogs}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* USER MANAGEMENT SECTION */}
      {activeSubTab === 'users' && isSuperAdmin && (
        <div className="glass table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name & Email</th>
                <th>Supply Chain Role</th>
                <th>Industry</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="font-mono text-cyan">#{u.id}</td>
                  <td>
                    <div className="user-name-col">
                      <span className="font-bold">{u.name}</span>
                      <span className="text-xs text-muted">{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{u.industry || 'All'}</td>
                  <td>{u.warehouse || 'All'}</td>
                  <td>
                    <span className={`status-pill ${u.is_active ? 'status-ok' : 'status-critical'}`}>
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-group">
                      <button className="btn-icon" onClick={() => openEditModal(u)} title="Edit User Privileges">
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className={`btn-icon ${u.is_active ? 'text-amber' : 'text-mint'}`} 
                        onClick={() => handleToggleStatus(u.id)}
                        title={u.is_active ? "Deactivate Account" : "Activate Account"}
                      >
                        {u.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOGS SECTION */}
      {activeSubTab === 'audit' && (
        <div className="glass table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Email</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-muted">{log.timestamp}</td>
                  <td className="font-bold">{log.user_email}</td>
                  <td>
                    <span className="role-badge-sm">{log.user_role}</span>
                  </td>
                  <td className="font-mono text-cyan">{log.action}</td>
                  <td className="text-sm">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="nl-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="glass nl-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Supply Chain User Account</h3>
            </div>
            <form onSubmit={handleCreateUser} className="auth-form mt-16">
              <div className="input-field-group">
                <label>FULL NAME</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Marcus Vance" />
              </div>
              <div className="input-field-group">
                <label>ENTERPRISE EMAIL</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required placeholder="user@company.com" />
              </div>
              <div className="input-field-group">
                <label>PASSWORD</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required placeholder="••••••••••••" />
              </div>
              <div className="input-grid-row">
                <div className="input-field-group">
                  <label>ROLE</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value)}>
                    {rolesList.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="input-field-group">
                  <label>INDUSTRY</label>
                  <select value={formIndustry} onChange={e => setFormIndustry(e.target.value)}>
                    <option value="Pharma">Pharma</option>
                    <option value="FMCG">FMCG</option>
                    <option value="Auto Parts">Auto Parts</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>
              <div className="input-field-group">
                <label>ASSIGNED WAREHOUSE (Required for Warehouse Manager)</label>
                <select value={formWarehouse} onChange={e => setFormWarehouse(e.target.value)}>
                  <option value="Mumbai Central">Mumbai Central</option>
                  <option value="Delhi North">Delhi North</option>
                  <option value="Chennai South">Chennai South</option>
                  <option value="Hyderabad Hub">Hyderabad Hub</option>
                  <option value="Pune DC">Pune DC</option>
                  <option value="Bangalore Hub">Bangalore Hub</option>
                </select>
              </div>
              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="nl-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="glass nl-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Privileges ({selectedUser?.email})</h3>
            </div>
            <form onSubmit={handleEditUser} className="auth-form mt-16">
              <div className="input-field-group">
                <label>FULL NAME</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>
              <div className="input-grid-row">
                <div className="input-field-group">
                  <label>ROLE</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value)}>
                    {rolesList.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="input-field-group">
                  <label>INDUSTRY</label>
                  <select value={formIndustry} onChange={e => setFormIndustry(e.target.value)}>
                    <option value="Pharma">Pharma</option>
                    <option value="FMCG">FMCG</option>
                    <option value="Auto Parts">Auto Parts</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>
              <div className="input-field-group">
                <label>ASSIGNED WAREHOUSE</label>
                <select value={formWarehouse} onChange={e => setFormWarehouse(e.target.value)}>
                  <option value="Mumbai Central">Mumbai Central</option>
                  <option value="Delhi North">Delhi North</option>
                  <option value="Chennai South">Chennai South</option>
                  <option value="Hyderabad Hub">Hyderabad Hub</option>
                  <option value="Pune DC">Pune DC</option>
                  <option value="Bangalore Hub">Bangalore Hub</option>
                </select>
              </div>
              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-console-page {
          padding: 24px;
        }
        .admin-subtabs {
          display: flex;
          gap: 12px;
          padding: 8px 16px;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        .admin-subtab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .admin-subtab-btn.active {
          background: rgba(14, 165, 233, 0.15);
          color: var(--accent-cyan);
          border: 1px solid rgba(14, 165, 233, 0.4);
        }
        .admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          flex: 1;
          max-width: 450px;
        }
        .search-box input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          outline: none;
        }
        .toolbar-actions {
          display: flex;
          gap: 10px;
        }
        .role-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .role-super_admin { background: rgba(168, 85, 247, 0.2); border-color: rgba(168, 85, 247, 0.5); color: #c084fc; }
        .role-executive { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.5); color: #60a5fa; }
        .role-operations_manager { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5); color: #34d399; }
        .role-procurement_officer { background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #fbbf24; }
        .role-warehouse_manager { background: rgba(236, 72, 153, 0.2); border-color: rgba(236, 72, 153, 0.5); color: #f472b6; }
        .role-demand_planner { background: rgba(14, 165, 233, 0.2); border-color: rgba(14, 165, 233, 0.5); color: #38bdf8; }
        .role-supplier_manager { background: rgba(139, 92, 246, 0.2); border-color: rgba(139, 92, 246, 0.5); color: #a78bfa; }
        .role-auditor { background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #fde047; }
        .role-badge-sm { font-size: 0.75rem; font-weight: 600; opacity: 0.9; }
        .action-buttons-group { display: flex; gap: 8px; }
        .btn-icon { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 6px; border-radius: 6px; cursor: pointer; }
        .btn-icon:hover { background: rgba(255,255,255,0.15); }
        .modal-actions-row { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
      `}</style>
    </div>
  );
};

export default AdminConsole;
