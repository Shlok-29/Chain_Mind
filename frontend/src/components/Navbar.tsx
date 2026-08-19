import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  TrendingUp, 
  ClipboardList, 
  AlertTriangle, 
  Info, 
  Play, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Building2,
  ChevronDown,
  Search,
  Sparkles,
  MessageSquare,
  X,
  LogOut,
  UserCheck
} from 'lucide-react';
import axios from 'axios';

import UserProfileModal from './UserProfileModal';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentIndustry: string;
  onIndustryChange: (ind: string) => void;
  onRunAgents: () => void;
  agentRunning: boolean;
  disruptionActive: boolean;
  disruptionType: string;
  onRefresh: () => void;
  userSession?: any;
  onLogout?: () => void;
}

import { API_BASE } from '../config';

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentIndustry,
  onIndustryChange,
  onRunAgents,
  agentRunning,
  disruptionActive,
  disruptionType,
  onRefresh,
  userSession,
  onLogout
}) => {
  const [nlQuery, setNlQuery] = useState('');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);

  const industries = ['Pharma', 'FMCG', 'Auto Parts', 'Retail'];

  const tabs = [
    { id: 'inventory', label: 'DASHBOARD', icon: <LayoutDashboard size={15} /> },
    { id: 'agents', label: 'AGENT SWARM', icon: <Cpu size={15} /> },
    { id: 'forecast', label: 'FORECAST', icon: <TrendingUp size={15} /> },
    { id: 'orders', label: 'ORDERS', icon: <ClipboardList size={15} /> },
    { id: 'disruptions', label: 'SIMULATIONS', icon: <AlertTriangle size={15} /> },
    { id: 'about', label: 'ABOUT', icon: <Info size={15} /> },
  ];

  // Ctrl+K key binding for AI Search Box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQueryModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNLSubmit = async (queryText?: string) => {
    const q = queryText || nlQuery;
    if (!q.trim()) return;

    try {
      setLoadingQuery(true);
      setQueryResponse(null);
      const res = await axios.post(`${API_BASE}/api/nl-query`, {
        query: q,
        industry: currentIndustry
      });

      setQueryResponse(res.data.response);
      setLoadingQuery(false);

      if (res.data.action === 'NAVIGATE_TAB' && res.data.target_tab) {
        onTabChange(res.data.target_tab);
      } else if (res.data.action === 'TRIGGER_DISRUPTION') {
        onRefresh();
        onTabChange('disruptions');
      }
    } catch (err) {
      console.error(err);
      setQueryResponse("Unable to process query. Check server connection.");
      setLoadingQuery(false);
    }
  };

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

  return (
    <header className="double-layer-navbar glass">
      {/* LAYER 1: Top Executive Header Bar */}
      <div className="navbar-top-row">
        <div className="top-row-container">
          {/* Brand Logo & Security Badge */}
          <div className="navbar-brand-group" onClick={() => onTabChange('inventory')}>
            <img src="/logo.png" alt="ChainMind Logo" className="navbar-logo-img" />
            <div className="brand-text-col">
              <span className="brand-title">CHAINMIND</span>
              <span className="brand-sub">AUTONOMOUS ORCHESTRATOR</span>
            </div>
          </div>

          {/* Center NL AI Search Assistant */}
          <div className="nl-search-bar" onClick={() => setIsQueryModalOpen(true)}>
            <Sparkles size={14} className="text-mint" />
            <span className="search-placeholder">Ask AI Assistant</span>
            <span className="kbd-shortcut">Ctrl K</span>
          </div>

          {/* Right Action Controls */}
          <div className="top-row-actions">
            {/* Industry Selector Dropdown */}
            <div className="industry-dropdown-container">
              <Building2 size={14} className="dropdown-icon" />
              <select
                value={currentIndustry}
                onChange={(e) => onIndustryChange(e.target.value)}
                className="industry-select-input"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>
                    {ind} Sector
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="dropdown-arrow" />
            </div>

            {/* Disruption Trigger Action */}
            {!disruptionActive ? (
              <button className="btn btn-secondary btn-sm" onClick={triggerDisruption} title="Simulate Disruption">
                <Zap size={14} />
                <span>Simulate Disruption</span>
              </button>
            ) : (
              <button className="btn btn-mint btn-sm" onClick={resolveDisruption} title={disruptionType}>
                <CheckCircle2 size={14} />
                <span>Resolve Disruption</span>
              </button>
            )}

            {/* Run Agent Swarm Button */}
            <button
              className={`btn btn-primary btn-sm ${agentRunning ? 'running' : ''}`}
              onClick={onRunAgents}
              disabled={agentRunning}
            >
              {agentRunning ? <RefreshCw className="spin" size={14} /> : <Play size={14} />}
              <span>{agentRunning ? 'SWARM SYNCING' : 'RUN SWARM'}</span>
            </button>

            {/* System Status Pill */}
            <div className={`status-pill-badge ${disruptionActive ? 'disrupted' : 'optimal'}`}>
              <span className="status-dot"></span>
              <span className="status-label">{disruptionActive ? 'DISRUPTION LIVE' : 'OPTIMAL'}</span>
            </div>

            {/* User Profile & Logout */}
            {userSession?.user && (
              <div className="user-profile-badge" onClick={() => setIsProfileOpen(true)} title="Click to view Executive Profile">
                <div className="user-avatar-dot">
                  <UserCheck size={14} className="text-mint" />
                </div>
                <div className="user-info">
                  <span className="user-name">{userSession.user.name}</span>
                  <span className="user-role">{userSession.user.role || 'Executive'}</span>
                </div>
                {onLogout && (
                  <button className="btn-logout" onClick={(e) => { e.stopPropagation(); onLogout(); }} title="Log Out Session">
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LAYER 2: Dedicated Navigation Tab Bar */}
      <div className="navbar-bottom-row">
        <div className="bottom-row-container">
          <nav className="navbar-tabs-full">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab-btn-lg ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Natural Language AI Assistant Modal */}
      {isQueryModalOpen && (
        <div className="nl-modal-overlay" onClick={() => setIsQueryModalOpen(false)}>
          <div className="glass nl-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sparkles size={18} className="text-mint" />
                <h3>Ask AI Assistant</h3>
              </div>
              <button className="close-btn" onClick={() => setIsQueryModalOpen(false)}><X size={16} /></button>
            </div>

            <div className="modal-input-row">
              <input 
                type="text" 
                placeholder="Type your prompt (e.g. 'Show critical stock', 'Simulate JNPT strike', 'Run agent swarm')..." 
                value={nlQuery}
                onChange={e => setNlQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNLSubmit()}
                autoFocus
                className="nl-input-field"
              />
              <button className="btn btn-primary" onClick={() => handleNLSubmit()} disabled={loadingQuery}>
                {loadingQuery ? <RefreshCw className="spin" size={14} /> : <Search size={14} />}
                <span>Ask</span>
              </button>
            </div>

            {/* Prompt Quick Chips */}
            <div className="prompt-chips">
              <span className="chip-label">Suggestions:</span>
              <button className="chip-btn" onClick={() => { setNlQuery("Show critical stock items"); handleNLSubmit("Show critical stock items"); }}>"Critical Stock"</button>
              <button className="chip-btn" onClick={() => { setNlQuery("Simulate JNPT port strike"); handleNLSubmit("Simulate JNPT port strike"); }}>"JNPT Strike"</button>
              <button className="chip-btn" onClick={() => { setNlQuery("Run agent swarm pipeline"); handleNLSubmit("Run agent swarm pipeline"); }}>"Run Swarm"</button>
              <button className="chip-btn" onClick={() => { setNlQuery("Show purchase orders"); handleNLSubmit("Show purchase orders"); }}>"View POs"</button>
            </div>

            {/* AI Response Output */}
            {queryResponse && (
              <div className="glass query-response-box">
                <MessageSquare size={16} className="text-mint response-icon" />
                <p>{queryResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Executive Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userSession={userSession}
        currentIndustry={currentIndustry}
        onIndustryChange={onIndustryChange}
        onLogout={onLogout || (() => {})}
      />

      <style>{`
        .double-layer-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          border-radius: 0;
          border-left: none;
          border-right: none;
          border-top: none;
          border-bottom: 1px solid var(--border-color);
          background: rgba(7, 11, 18, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
        }

        /* LAYER 1: Top Row */
        .navbar-top-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 24px;
        }

        .top-row-container {
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .navbar-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .navbar-logo-img {
          width: 34px;
          height: 34px;
          object-fit: contain;
          filter: drop-shadow(0 0 10px rgba(0, 229, 163, 0.5));
        }

        .brand-text-col {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .brand-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #00e5a3, #00c9ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-sub {
          font-size: 0.55rem;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .nl-search-bar {
          flex: 1;
          max-width: 420px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .nl-search-bar:hover {
          border-color: var(--accent-mint);
        }

        .search-placeholder {
          font-size: 0.75rem;
          color: var(--text-secondary);
          flex: 1;
        }

        .kbd-shortcut {
          font-size: 0.6rem;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }

        .top-row-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .industry-dropdown-container {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 12px;
          height: 34px;
        }

        .dropdown-icon { color: var(--accent-mint); margin-right: 6px; pointer-events: none; }
        .dropdown-arrow { color: var(--text-secondary); margin-left: 6px; pointer-events: none; }

        .industry-select-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 700;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          padding-right: 10px;
        }

        .industry-select-input option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .status-pill-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .status-pill-badge.optimal {
          background: rgba(0, 229, 163, 0.08);
          color: var(--accent-mint);
          border: 1px solid rgba(0, 229, 163, 0.2);
        }

        .status-pill-badge.disrupted {
          background: rgba(255, 75, 96, 0.12);
          color: var(--critical);
          border: 1px solid rgba(255, 75, 96, 0.3);
        }

        .status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .optimal .status-dot { background: var(--accent-mint); box-shadow: 0 0 8px var(--accent-mint); }
        .disrupted .status-dot { background: var(--critical); box-shadow: 0 0 8px var(--critical); }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 4px 10px 4px 6px;
          border-radius: 20px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .user-profile-badge:hover {
          border-color: var(--accent-mint);
        }

        .user-avatar-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 229, 163, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-info { display: flex; flex-direction: column; line-height: 1.1; }
        .user-name { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); }
        .user-role { font-size: 0.6rem; color: var(--text-muted); font-weight: 600; }

        .btn-logout {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .btn-logout:hover { color: var(--critical); }

        /* LAYER 2: Bottom Navigation Row */
        .navbar-bottom-row {
          padding: 6px 24px;
          background: rgba(15, 23, 42, 0.4);
        }

        .bottom-row-container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .navbar-tabs-full {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-tab-btn-lg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-tab-btn-lg:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-tab-btn-lg.active {
          background: var(--bg-tertiary);
          color: var(--accent-mint);
          border-color: rgba(0, 229, 163, 0.35);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Modal Styles */
        .nl-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 100px;
        }

        .nl-modal-card {
          width: 600px;
          padding: 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-active);
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-title { display: flex; align-items: center; gap: 10px; }
        .close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }

        .modal-input-row { display: flex; gap: 12px; margin-bottom: 16px; }

        .nl-input-field {
          flex: 1;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
        }

        .nl-input-field:focus { border-color: var(--accent-mint); }

        .prompt-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .chip-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }
        .chip-btn { background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--accent-mint); padding: 4px 10px; border-radius: 16px; font-size: 0.7rem; cursor: pointer; }
        .chip-btn:hover { border-color: var(--accent-mint); }

        .query-response-box {
          padding: 16px;
          display: flex;
          gap: 12px;
          background: rgba(0, 229, 163, 0.05);
          border-left: 3px solid var(--accent-mint);
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .response-icon { flex-shrink: 0; margin-top: 2px; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
};

export default Navbar;
