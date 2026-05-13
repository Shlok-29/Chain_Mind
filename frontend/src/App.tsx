import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  ClipboardList, 
  AlertTriangle, 
  RefreshCw,
  Activity
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Forecaster from './components/Forecaster';
import AgentConsole from './components/AgentConsole';
import PurchaseOrders from './components/PurchaseOrders';
import DisruptionMap from './components/DisruptionMap';
import './App.css';

const API_BASE = 'http://localhost:8000';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [industry, setIndustry] = useState('Pharma');
  const [summary, setSummary] = useState<any>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResults, setAgentResults] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data/summary?industry=${industry}`);
      setSummary(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [industry]);

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

  const tabs = [
    { id: 'inventory', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'forecast', label: 'Forecast', icon: <TrendingUp size={20} /> },
    { id: 'agents', label: 'Agents', icon: <Cpu size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { id: 'disruptions', label: 'Map', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <div className="app-container">
      <Sidebar 
        currentIndustry={industry} 
        onIndustryChange={setIndustry}
        onRunAgents={runAgents}
        agentRunning={agentRunning}
        disruptionActive={summary?.disruption_active}
        disruptionType={summary?.disruption_type}
        onRefresh={fetchData}
      />
      
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            <h1>ChainMind — {industry} Supply Chain</h1>
            <p className="subtitle">Agentic AI Supply Chain Optimizer</p>
          </div>
          <div className="header-actions">
            <div className="status-badge">
              <Activity size={14} className="pulse" />
              <span>System Live</span>
            </div>
            <button className="btn btn-secondary" onClick={fetchData}>
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <div className="tabs-container">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-viewport">
          {activeTab === 'inventory' && <Dashboard industry={industry} summary={summary} results={agentResults} />}
          {activeTab === 'forecast' && <Forecaster industry={industry} />}
          {activeTab === 'agents' && <AgentConsole results={agentResults} running={agentRunning} />}
          {activeTab === 'orders' && <PurchaseOrders industry={industry} results={agentResults} onRunAgents={runAgents} agentRunning={agentRunning} />}
          {activeTab === 'disruptions' && <DisruptionMap industry={industry} disruptionActive={summary?.disruption_active} disruptionType={summary?.disruption_type}/>}
        </div>

        <footer className="footer">
          <p>ChainMind — Capgemini AgentifAI Buildathon 2026 | Built with React + FastAPI + Recharts</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
