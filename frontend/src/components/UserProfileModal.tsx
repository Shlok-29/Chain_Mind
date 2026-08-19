import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Building2, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  X, 
  KeyRound
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: any;
  currentIndustry: string;
  onIndustryChange: (ind: string) => void;
  onLogout: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userSession,
  currentIndustry,
  onIndustryChange,
  onLogout
}) => {
  if (!isOpen || !userSession?.user) return null;

  const user = userSession.user;
  const industries = ['Pharma', 'FMCG', 'Auto Parts', 'Retail'];

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="glass profile-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <User size={28} className="text-mint" />
          </div>
          <div className="profile-title-col">
            <h3>{user.name || 'Executive User'}</h3>
            <span className="role-tag">{user.role || 'Supply Chain Director'}</span>
          </div>
          <button className="close-profile-btn" onClick={onClose} title="Close Profile">
            <X size={18} />
          </button>
        </div>

        {/* Security Clearance Tag */}
        <div className="clearance-banner">
          <ShieldCheck size={14} className="text-mint" />
          <span>SECURITY CLEARANCE: LEVEL 4 EXECUTIVE ACCESS</span>
        </div>

        {/* Details Grid */}
        <div className="profile-details-grid">
          <div className="detail-item">
            <Mail size={14} className="detail-icon" />
            <div className="detail-text">
              <span className="label">Enterprise Email</span>
              <span className="value">{user.email || 'executive@chainmind.ai'}</span>
            </div>
          </div>

          <div className="detail-item">
            <Building2 size={14} className="detail-icon" />
            <div className="detail-text">
              <span className="label">Active Sector</span>
              <select 
                value={currentIndustry} 
                onChange={(e) => onIndustryChange(e.target.value)}
                className="sector-select-inline"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind} Industry</option>
                ))}
              </select>
            </div>
          </div>

          <div className="detail-item">
            <KeyRound size={14} className="detail-icon" />
            <div className="detail-text">
              <span className="label">Session Token</span>
              <span className="value font-mono text-cyan">{userSession.token || 'token_exec_99812'}</span>
            </div>
          </div>

          <div className="detail-item">
            <Clock size={14} className="detail-icon" />
            <div className="detail-text">
              <span className="label">Authenticated Session</span>
              <span className="value">Active (256-Bit Quantum SSL)</span>
            </div>
          </div>
        </div>

        {/* Permissions & Privileges */}
        <div className="privileges-section">
          <h4>Executive Privileges & Permissions</h4>
          <div className="privilege-list">
            <div className="privilege-item">
              <CheckCircle2 size={14} className="text-mint" />
              <span>Autonomous Agent Swarm Pipeline Execution</span>
            </div>
            <div className="privilege-item">
              <CheckCircle2 size={14} className="text-mint" />
              <span>Tier 3 High-Value Purchase Order Sign-off (&gt; ₹5 Lakhs)</span>
            </div>
            <div className="privilege-item">
              <CheckCircle2 size={14} className="text-mint" />
              <span>Black Swan Disruption Simulation Overrides</span>
            </div>
            <div className="privilege-item">
              <CheckCircle2 size={14} className="text-mint" />
              <span>Direct WhatsApp Telemetry Alerts Dispatch</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="profile-actions-row">
          <button className="btn btn-secondary btn-block" onClick={onClose}>
            <span>Close Profile</span>
          </button>
          <button className="btn btn-critical btn-block" onClick={() => { onClose(); onLogout(); }}>
            <LogOut size={16} />
            <span>Log Out Session</span>
          </button>
        </div>
      </div>

      <style>{`
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 2500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .profile-modal-card {
          width: 100%;
          max-width: 480px;
          padding: 28px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-active);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 163, 0.08);
          position: relative;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .profile-avatar-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(0, 229, 163, 0.1);
          border: 1px solid rgba(0, 229, 163, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-title-col h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .role-tag {
          font-size: 0.7rem;
          color: var(--accent-mint);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .close-profile-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
        }

        .close-profile-btn:hover {
          color: var(--text-primary);
        }

        .clearance-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 229, 163, 0.06);
          border: 1px solid rgba(0, 229, 163, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--bg-tertiary);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .detail-icon {
          color: var(--accent-mint);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .detail-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-text .label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .detail-text .value {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-primary);
          word-break: break-all;
        }

        .sector-select-inline {
          background: transparent;
          border: none;
          color: var(--accent-mint);
          font-size: 0.78rem;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .sector-select-inline option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .privileges-section {
          background: var(--bg-tertiary);
          padding: 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          margin-bottom: 20px;
        }

        .privileges-section h4 {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-secondary);
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }

        .privilege-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privilege-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-primary);
        }

        .profile-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-critical {
          background: rgba(255, 75, 96, 0.15);
          border: 1px solid rgba(255, 75, 96, 0.4);
          color: var(--critical);
        }

        .btn-critical:hover {
          background: rgba(255, 75, 96, 0.25);
        }

        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-cyan { color: var(--accent-cyan); }
      `}</style>
    </div>
  );
};

export default UserProfileModal;
