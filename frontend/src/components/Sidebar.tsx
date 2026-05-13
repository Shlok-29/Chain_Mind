import React from 'react';
import { 
  Building2, 
  Zap, 
  RefreshCw, 
  Play, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

interface SidebarProps {
  currentIndustry: string;
  onIndustryChange: (ind: string) => void;
  onRunAgents: () => void;
  agentRunning: boolean;
  disruptionActive: boolean;
  disruptionType: string;
  onRefresh: () => void;
}

const API_BASE = 'http://localhost:8000';

const Sidebar: React.FC<SidebarProps> = ({ 
  currentIndustry, 
  onIndustryChange, 
  onRunAgents, 
  agentRunning,
  disruptionActive,
  disruptionType,
  onRefresh
}) => {
  const industries = ['Pharma', 'FMCG', 'Auto Parts', 'Retail'];

  const triggerDisruption = async () => {
    try {
      await axios.post(`${API_BASE}/simulation/disruption`, { active: true });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const resolveDisruption = async () => {
    try {
      await axios.post(`${API_BASE}/simulation/disruption`, { active: false });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const regenerateData = async () => {
    if (confirm("Are you sure you want to regenerate all supply chain data?")) {
      try {
        await axios.post(`${API_BASE}/data/regenerate`);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <div className="logo-icon">🔗</div>
        <span className="logo-text">ChainMind</span>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">Control Panel</h3>
        <div className="industry-selector">
          <label className="label">Select Industry</label>
          <div className="industry-list">
            {industries.map(ind => (
              <button 
                key={ind}
                className={`industry-btn ${currentIndustry === ind ? 'active' : ''}`}
                onClick={() => onIndustryChange(ind)}
              >
                <Building2 size={16} />
                <span>{ind}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <h3 className="section-title">Agent Configuration</h3>
        <div className="agent-controls">
          <button 
            className={`btn btn-primary ${agentRunning ? 'loading' : ''}`}
            onClick={onRunAgents}
            disabled={agentRunning}
          >
            {agentRunning ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
            <span>Run Agent Pipeline</span>
          </button>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <h3 className="section-title">Disruption Simulator</h3>
        <div className="disruption-controls">
          {!disruptionActive ? (
            <button className="btn btn-secondary danger-hover" onClick={triggerDisruption}>
              <Zap size={18} />
              <span>Trigger Disruption</span>
            </button>
          ) : (
            <div className="active-disruption">
              <div className="disruption-alert">
                <AlertOctagon size={20} color="var(--critical)" />
                <span>{disruptionType}</span>
              </div>
              <button className="btn btn-secondary success-hover" onClick={resolveDisruption}>
                <CheckCircle2 size={18} />
                <span>Resolve</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="btn-text" onClick={regenerateData}>
          <RefreshCw size={14} />
          <span>Regenerate Data</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 24px;
          border-radius: 0;
          border-left: none;
          border-top: none;
          border-bottom: none;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .logo-icon {
          font-size: 24px;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }

        .industry-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .industry-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .industry-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .industry-btn.active {
          background: var(--bg-tertiary);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0 24px 0;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .danger-hover:hover {
          background: rgba(255, 75, 75, 0.1);
          border-color: var(--critical);
          color: var(--critical);
        }

        .success-hover:hover {
          background: rgba(0, 200, 83, 0.1);
          border-color: var(--success);
          color: var(--success);
        }

        .active-disruption {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .disruption-alert {
          background: rgba(255, 75, 75, 0.1);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 75, 75, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: var(--critical);
          font-weight: 500;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
        }

        .btn-text {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
        }

        .btn-text:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
