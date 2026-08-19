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
import { API_BASE } from './config';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [industry, setIndustry] = useState('Pharma');
  const [summary, setSummary] = useState<any>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResults, setAgentResults] = useState<any>(null);

  // Authentication Session State
  const [userSession, setUserSession] = useState<any>(() => {
    const saved = localStorage.getItem('chainmind_auth_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (session: any) => {
    setUserSession(session);
    localStorage.setItem('chainmind_auth_session', JSON.stringify(session));
    if (session?.user?.industry) {
      setIndustry(session.user.industry);
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('chainmind_auth_session');
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data/summary?industry=${industry}`);
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
      });
      setAgentResults(res.data);
      setAgentRunning(false);
      fetchData();
    } catch (err) {
      console.error("Error running agents:", err);
      setAgentRunning(false);
    }
  };

  // Auth Gate: Render Login screen first if unauthenticated
  if (!userSession) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
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
        {activeTab === 'orders' && <PurchaseOrders industry={industry} results={agentResults} onRunAgents={runAgents} agentRunning={agentRunning} />}
        {activeTab === 'disruptions' && (
          <DisruptionMap 
            industry={industry} 
            disruptionActive={summary?.disruption_active || false} 
            disruptionType={summary?.disruption_type || ''} 
          />
        )}
        {activeTab === 'about' && <About />}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>CHAINMIND AUTONOMOUS ORCHESTRATOR v2.4</span>
          <span>SYSTEM STATUS: OPTIMAL</span>
          <span>SESSION: {userSession.user.name} ({userSession.user.role})</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
