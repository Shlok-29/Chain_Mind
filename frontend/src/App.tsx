import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Forecaster from './components/Forecaster';
import AgentConsole from './components/AgentConsole';
import PurchaseOrders from './components/PurchaseOrders';
import DisruptionMap from './components/DisruptionMap';
import About from './components/About';
import Auth from './components/Auth';
import AuditorBanner from './components/AuditorBanner';
import AdminConsole from './components/AdminConsole';
import { API_BASE } from './config';
import './App.css';

const App: React.FC = () => {
  const [userSession, setUserSession] = useState<any>(() => {
    const saved = localStorage.getItem('chainmind_auth_session');
    return saved ? JSON.parse(saved) : null;
  });

  const getDefaultTabForRole = (role?: string) => {
    if (role === 'procurement_officer') return 'orders';
    if (role === 'supplier_manager') return 'disruptions';
    return 'inventory';
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    return getDefaultTabForRole(userSession?.user?.role);
  });
  const [industry, setIndustry] = useState<string>('Pharma');
  const [summary, setSummary] = useState<any>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResults, setAgentResults] = useState<any>(null);

  const handleLoginSuccess = (session: any) => {
    setUserSession(session);
    localStorage.setItem('chainmind_auth_session', JSON.stringify(session));
    if (session?.user?.industry) {
      setIndustry(session.user.industry);
    }
    const defaultTab = getDefaultTabForRole(session?.user?.role);
    setActiveTab(defaultTab);
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('chainmind_auth_session');
  };

  const fetchData = async () => {
    if (!userSession) return;
    try {
      const res = await axios.get(`${API_BASE}/data/summary?industry=${industry}`, {
        headers: { Authorization: `Bearer ${userSession.token}` }
      });
      setSummary(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  useEffect(() => {
    if (userSession) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [industry, userSession]);

  const runAgents = async () => {
    try {
      setAgentRunning(true);
      const res = await axios.post(`${API_BASE}/agents/run`, {
        industry: industry,
        use_llm: false
      }, {
        headers: { Authorization: `Bearer ${userSession?.token}` }
      });
      setAgentResults(res.data);
      setAgentRunning(false);
      fetchData();
    } catch (err: any) {
      console.error("Error running agents:", err);
      alert(err.response?.data?.detail || "Role does not have permission to run agent swarm.");
      setAgentRunning(false);
    }
  };

  // Auth Gate: Render Login screen first if unauthenticated
  if (!userSession) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      {/* Auditor Mode Sticky Header Banner */}
      <AuditorBanner userRole={userSession.user.role} />

      <Navbar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentIndustry={industry}
        onIndustryChange={setIndustry}
        onRunAgents={runAgents}
        agentRunning={agentRunning}
        disruptionActive={summary?.disruption_active || false}
        disruptionType={summary?.disruption_type || ''}
        onRefresh={fetchData}
        userSession={userSession}
        onLogout={handleLogout}
      />

      <main className="app-content">
        {activeTab === 'inventory' && <Dashboard industry={industry} results={agentResults} summary={summary} />}
        {activeTab === 'agents' && <AgentConsole results={agentResults} running={agentRunning} />}
        {activeTab === 'forecast' && <Forecaster industry={industry} />}
        {activeTab === 'orders' && (
          <PurchaseOrders 
            industry={industry} 
            results={agentResults} 
            onRunAgents={runAgents} 
            agentRunning={agentRunning}
            userSession={userSession}
          />
        )}
        {activeTab === 'disruptions' && (
          <DisruptionMap 
            industry={industry} 
            disruptionActive={summary?.disruption_active || false} 
            disruptionType={summary?.disruption_type || ''} 
            userSession={userSession}
          />
        )}
        {activeTab === 'admin' && <AdminConsole userSession={userSession} />}
        {activeTab === 'about' && <About />}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>CHAINMIND AUTONOMOUS ORCHESTRATOR v2.4</span>
          <span className="footer-dot">•</span>
          <span>SYSTEM STATUS: <strong className="text-mint">OPTIMAL</strong></span>
          <span className="footer-dot">•</span>
          <span>SESSION: <strong>{userSession.user.name}</strong> ({userSession.user.role?.toUpperCase()})</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
