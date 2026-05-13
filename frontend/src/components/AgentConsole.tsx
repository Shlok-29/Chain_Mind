import { Terminal, Bell, Shield, TrendingUp, ShoppingCart, CheckCircle2 } from 'lucide-react';

interface AgentConsoleProps {
  results: any;
  running: boolean;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ results, running }) => {
  const agentIcons: any = {
    "monitor_output": { icon: <Shield />, color: "#2196f3", title: "Monitor Agent" },
    "forecast_output": { icon: <TrendingUp />, color: "#9c27b0", title: "Forecast Agent" },
    "procurement_output": { icon: <ShoppingCart />, color: "#ff9800", title: "Procurement Agent" },
    "alert_output": { icon: <Bell />, color: "#f44336", title: "Alert Agent" }
  };

  const archInfo = [
    { icon: <Shield />, name: "Monitor Agent", desc: "Scans inventory every cycle. Flags CRITICAL & LOW items.", color: "#2196f3" },
    { icon: <TrendingUp />, name: "Forecast Agent", desc: "30-day demand forecasting using ML time-series models.", color: "#9c27b0" },
    { icon: <ShoppingCart />, name: "Procurement Agent", desc: "Auto-generates POs. Selects best supplier by reliability & cost.", color: "#ff9800" },
    { icon: <Bell />, name: "Alert Agent", desc: "Sends real-time alerts to ops managers. Generates exec reports.", color: "#f44336" },
  ];

  if (running) {
    return (
      <div className="agent-console loading-state">
        <div className="agent-pipeline-viz">
          {archInfo.map((a, i) => (
            <div key={i} className="viz-node-container">
              <div className="viz-node" style={{ borderColor: a.color, animationDelay: `${i * 0.5}s` }}>
                {a.icon}
              </div>
              {i < archInfo.length - 1 && <div className="viz-line" style={{ animationDelay: `${i * 0.5}s` }}></div>}
            </div>
          ))}
        </div>
        <p>Agents are analyzing your supply chain data...</p>
      </div>
    );
  }

  return (
    <div className="agent-console">
      <div className="console-layout">
        <div className="logs-column">
          <h3 className="section-header"><Terminal size={18} /> Execution Logs</h3>
          <div className="agent-logs-container">
            {Object.keys(agentIcons).map(key => (
              <div key={key} className="glass agent-log-box" style={{ borderLeft: `4px solid ${agentIcons[key].color}` }}>
                <div className="log-header">
                  {agentIcons[key].icon}
                  <h4>{agentIcons[key].title}</h4>
                </div>
                <div className="log-content">
                  {results?.[key] || "No logs available. Run the pipeline to see output."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="alerts-column">
          <h3 className="section-header"><Bell size={18} /> Live Alerts</h3>
          <div className="alerts-list">
            {!results?.alerts || results.alerts.length === 0 ? (
              <div className="glass alert-empty">
                <CheckCircle2 color="var(--success)" />
                <p>No active alerts. Supply chain is healthy.</p>
              </div>
            ) : (
              results.alerts.map((alert: any, idx: number) => (
                <div key={idx} className={`glass alert-item ${alert.severity.toLowerCase()}`}>
                  <div className="alert-severity">{alert.severity}</div>
                  <p className="alert-msg">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="architecture-grid">
        {archInfo.map((a, i) => (
          <div key={i} className="glass arch-card" style={{ borderTop: `4px solid ${a.color}` }}>
            <div className="arch-icon" style={{ color: a.color }}>{a.icon}</div>
            <h5>{a.name}</h5>
            <p>{a.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .agent-console {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .console-layout {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .agent-logs-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .agent-log-box {
          padding: 16px;
          animation: fadeIn 0.5s ease forwards;
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          color: var(--text-primary);
        }

        .log-header h4 { font-size: 0.9rem; }

        .log-content {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          padding: 14px;
          border-left: 3px solid transparent;
        }

        .alert-item.critical { border-left-color: var(--critical); background: rgba(255, 75, 75, 0.05); }
        .alert-item.warning { border-left-color: var(--warning); background: rgba(255, 165, 0, 0.05); }
        .alert-item.disruption { border-left-color: var(--purple); background: rgba(156, 39, 176, 0.05); }
        .alert-item.info { border-left-color: var(--info); background: rgba(33, 150, 243, 0.05); }

        .alert-severity {
          font-size: 0.7rem;
          font-weight: 800;
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .alert-msg {
          font-size: 0.85rem;
        }

        .architecture-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .arch-card {
          padding: 20px;
          text-align: center;
        }

        .arch-icon {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }

        .arch-card h5 {
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .arch-card p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .agent-pipeline-viz {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 20px;
        }

        .viz-node-container {
          display: flex;
          align-items: center;
        }

        .viz-node {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          animation: nodePulse 2s infinite ease-in-out;
        }

        .viz-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, var(--border-color), var(--accent-primary), var(--border-color));
          background-size: 200% 100%;
          animation: lineFlow 2s infinite linear;
        }

        @keyframes nodePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        @keyframes lineFlow {
          0% { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
      `}</style>
    </div>
  );
};

export default AgentConsole;
