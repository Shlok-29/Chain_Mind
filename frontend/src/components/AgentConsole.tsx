import React from 'react';
import { 
  Terminal, 
  Bell, 
  ShieldCheck, 
  TrendingUp, 
  ShoppingCart, 
  CheckCircle2, 
  Cpu,
  Sliders,
  Radio,
  RefreshCw
} from 'lucide-react';

interface AgentConsoleProps {
  results: any;
  running: boolean;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ results, running }) => {
  const agentIcons: any = {
    "monitor_output": { icon: <ShieldCheck size={20} />, color: "var(--accent-cyan)", title: "Monitor Agent" },
    "forecast_output": { icon: <TrendingUp size={20} />, color: "var(--purple)", title: "Forecast Agent" },
    "procurement_output": { icon: <ShoppingCart size={20} />, color: "var(--warning)", title: "Procurement Agent" },
    "alert_output": { icon: <Bell size={20} />, color: "var(--critical)", title: "Alert Agent" }
  };

  const archInfo = [
    { icon: <ShieldCheck size={22} />, name: "Monitor Agent", desc: "Scans inventory telemetry. Flags CRITICAL & LOW items.", color: "var(--accent-cyan)" },
    { icon: <TrendingUp size={22} />, name: "Forecast Agent", desc: "30-day demand forecasting using time-series linear models.", color: "var(--purple)" },
    { icon: <ShoppingCart size={22} />, name: "Procurement Agent", desc: "Auto-generates POs. Selects optimal supplier by reliability.", color: "var(--warning)" },
    { icon: <Bell size={22} />, name: "Alert Agent", desc: "Dispatches alerts to operations managers. Generates reports.", color: "var(--critical)" },
  ];

  return (
    <div className="agent-swarm-page">
      {/* Title Header matching Screenshot 4 */}
      <div className="page-title-banner">
        <div className="banner-tag">
          <span className="dot"></span> SWARM ORCHESTRATION CORE
        </div>
        <div className="flex-between">
          <div>
            <h1>Neural Sync Topology</h1>
            <p className="page-subtitle">Global multi-agent coordination matrix. Monitoring autonomous node delegation, resource routing, and live task execution streams.</p>
          </div>
          <div className="system-load-badge">
            {running && <RefreshCw size={14} className="spin text-mint" />}
            <span className="load-label">{running ? 'Swarm Syncing...' : 'System Load'}</span>
            <span className="load-val">{running ? '98.2%' : '87.4%'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Node Topology & Event Stream */}
      <div className="topology-grid">
        {/* Left Column: Interactive Topology Node Graph */}
        <div className="left-topology-col">
          <div className="glass node-graph-card">
            <div className="graph-header">
              <div className="graph-title">
                <Cpu size={18} className="text-mint" />
                <h3>ACTIVE NODE TOPOLOGY</h3>
              </div>
              <div className="node-legend">
                <span className="legend-item"><span className="dot syncing"></span> SYNCING</span>
                <span className="legend-item"><span className="dot idle"></span> IDLE</span>
                <span className="legend-item"><span className="dot latent"></span> LATENT</span>
              </div>
            </div>

            {/* Neural Topology Visualizer Container */}
            <div className="topology-canvas">
              <div className="canvas-node alpha-core">
                <span className="node-glow"></span>
                <span className="node-title">ALPHA CORE</span>
              </div>
              <div className="canvas-node node-1 syncing-node"></div>
              <div className="canvas-node node-2 idle-node"></div>
              <div className="canvas-node node-3 latent-node"></div>
              <div className="canvas-node node-4 syncing-node"></div>
              <div className="canvas-node node-5 idle-node"></div>

              {/* Connecting vectors */}
              <svg className="node-lines-svg">
                <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="rgba(0,229,163,0.3)" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="80%" y2="25%" stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="70%" y2="75%" stroke="rgba(255,75,96,0.3)" strokeDasharray="4 4" />
                <line x1="50%" y1="50%" x2="25%" y2="70%" stroke="rgba(0,229,163,0.3)" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>

          {/* Deployed Swarms Cards */}
          <div className="deployed-swarms-row">
            <div className="glass swarm-card">
              <div className="swarm-card-head">
                <span className="swarm-code">SW-LOGISTICS-A1</span>
                <span className="swarm-status active">ACTIVE</span>
              </div>
              <h4>Freight Routing Optimization</h4>
              <div className="swarm-metrics">
                <span>12 Nodes</span>
                <span>99.8% Eff</span>
              </div>
              <div className="swarm-bar"><div className="bar-fill" style={{ width: '85%' }}></div></div>
            </div>

            <div className="glass swarm-card">
              <div className="swarm-card-head">
                <span className="swarm-code">SW-PROCURE-B2</span>
                <span className="swarm-status idle">IDLE</span>
              </div>
              <h4>Supplier Negotiation Sync</h4>
              <div className="swarm-metrics">
                <span>8 Nodes</span>
                <span>Ready</span>
              </div>
              <div className="swarm-bar"><div className="bar-fill" style={{ width: '40%' }}></div></div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Stream & Parameters (matching Screenshot 4) */}
        <div className="right-stream-col">
          <div className="glass stream-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Radio size={16} className="text-mint" />
                <h3>LIVE EVENT STREAM</h3>
              </div>
              <span className="protocol-code">TCP://SYN</span>
            </div>

            <div className="event-stream-list">
              <div className="stream-event">
                <span className="dot-event mint"></span>
                <div>
                  <span className="event-time">14:02:45.092</span>
                  <p>Node <span className="text-cyan">0x4F2A</span> completed route optimization for Fleet Beta.</p>
                </div>
              </div>
              <div className="stream-event">
                <span className="dot-event blue"></span>
                <div>
                  <span className="event-time">14:02:44.811</span>
                  <p>Consensus reached on inventory reallocation protocol P-902.</p>
                </div>
              </div>
              <div className="stream-event">
                <span className="dot-event red"></span>
                <div>
                  <span className="event-time">14:02:42.105</span>
                  <p>Latency spike detected in regional subnet R-ASIA-E. Re-routing signals.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass parameters-panel">
            <div className="panel-title">
              <Sliders size={16} />
              <h3>GLOBAL PARAMETERS</h3>
            </div>

            <div className="parameter-item">
              <div className="param-label-row">
                <span>Autonomy Threshold</span>
                <span className="param-val">0.85</span>
              </div>
              <div className="param-slider-bg"><div className="param-fill" style={{ width: '85%' }}></div></div>
            </div>

            <div className="parameter-item">
              <div className="param-label-row">
                <span>Resource Allocation Bias</span>
                <span className="param-val text-mint">DYNAMIC</span>
              </div>
              <div className="param-slider-bg"><div className="param-fill mint" style={{ width: '65%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Logs & Agent Output Section */}
      <div className="console-layout">
        <div className="logs-column">
          <h3 className="section-header"><Terminal size={18} /> Swarm Execution Logs</h3>
          <div className="agent-logs-container">
            {Object.keys(agentIcons).map(key => (
              <div key={key} className="glass agent-log-box" style={{ borderLeft: `4px solid ${agentIcons[key].color}` }}>
                <div className="log-header">
                  <span className="agent-log-icon">{agentIcons[key].icon}</span>
                  <h4>{agentIcons[key].title}</h4>
                </div>
                <div className="log-content">
                  {results?.[key] || "No active logs available. Trigger 'RUN SWARM' to execute pipeline."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="alerts-column">
          <h3 className="section-header"><Bell size={18} /> Swarm Alerts</h3>
          <div className="alerts-list">
            {!results?.alerts || results.alerts.length === 0 ? (
              <div className="glass alert-empty">
                <CheckCircle2 color="var(--accent-mint)" />
                <p>No active alerts. All swarm parameters within nominal thresholds.</p>
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

      {/* Architecture Cards Grid */}
      <div className="architecture-grid">
        {archInfo.map((a, i) => (
          <div key={i} className="glass arch-card" style={{ borderTop: `3px solid ${a.color}` }}>
            <div className="arch-icon" style={{ color: a.color }}>{a.icon}</div>
            <h5>{a.name}</h5>
            <p>{a.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .agent-swarm-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .system-load-badge {
          background: var(--bg-tertiary);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .load-label { font-size: 0.75rem; color: var(--text-secondary); }
        .load-val { font-size: 1.2rem; font-weight: 800; color: var(--accent-mint); font-family: 'JetBrains Mono', monospace; }

        .topology-grid {
          display: grid;
          grid-template-columns: 2.8fr 1.2fr;
          gap: 20px;
        }

        .left-topology-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .node-graph-card {
          padding: 20px;
        }

        .graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .graph-title { display: flex; align-items: center; gap: 8px; }
        .text-mint { color: var(--accent-mint); }
        .text-cyan { color: var(--accent-cyan); }

        .node-legend {
          display: flex;
          gap: 14px;
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 700;
        }

        .legend-item { display: flex; align-items: center; gap: 6px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
        .dot.syncing { background: var(--accent-mint); box-shadow: 0 0 6px var(--accent-mint); }
        .dot.idle { background: var(--accent-cyan); }
        .dot.latent { background: var(--critical); }

        .topology-canvas {
          height: 240px;
          background: #04080e;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .canvas-node {
          position: absolute;
          border-radius: 50%;
        }

        .alpha-core {
          width: 24px;
          height: 24px;
          background: var(--accent-mint);
          box-shadow: 0 0 20px var(--accent-mint);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .node-title {
          position: absolute;
          top: -20px;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-mint);
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .node-1 { width: 12px; height: 12px; background: var(--accent-mint); top: 30%; left: 20%; box-shadow: 0 0 10px var(--accent-mint); }
        .node-2 { width: 10px; height: 10px; background: var(--accent-cyan); top: 25%; left: 80%; }
        .node-3 { width: 10px; height: 10px; background: var(--critical); top: 75%; left: 70%; }
        .node-4 { width: 12px; height: 12px; background: var(--accent-mint); top: 70%; left: 25%; box-shadow: 0 0 10px var(--accent-mint); }

        .node-lines-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .deployed-swarms-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .swarm-card {
          padding: 16px;
        }

        .swarm-card-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .swarm-code { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        .swarm-status { font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
        .swarm-status.active { background: rgba(0,229,163,0.15); color: var(--accent-mint); }
        .swarm-status.idle { background: rgba(0,201,255,0.15); color: var(--accent-cyan); }

        .swarm-card h4 { font-size: 0.9rem; margin-bottom: 12px; }

        .swarm-metrics {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .swarm-bar {
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: var(--accent-mint);
        }

        .right-stream-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stream-panel {
          padding: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .panel-title { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; }
        .protocol-code { font-size: 0.65rem; font-family: 'JetBrains Mono', monospace; color: var(--text-muted); }

        .event-stream-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .stream-event {
          display: flex;
          gap: 10px;
          font-size: 0.8rem;
        }

        .dot-event {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .dot-event.mint { background: var(--accent-mint); box-shadow: 0 0 6px var(--accent-mint); }
        .dot-event.blue { background: var(--accent-blue); }
        .dot-event.red { background: var(--critical); }

        .event-time { font-size: 0.65rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

        .parameters-panel {
          padding: 20px;
        }

        .parameter-item {
          margin-top: 14px;
        }

        .param-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 6px;
        }

        .param-val { font-weight: 800; font-family: 'JetBrains Mono', monospace; }

        .param-slider-bg {
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }

        .param-fill {
          height: 100%;
          background: var(--accent-blue);
        }

        .param-fill.mint { background: var(--accent-mint); }

        .console-layout {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 1rem;
        }

        .agent-logs-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .agent-log-box {
          padding: 16px;
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .log-header h4 { font-size: 0.85rem; }

        .log-content {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.6;
          font-family: 'JetBrains Mono', monospace;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-item {
          padding: 12px;
          border-left: 3px solid transparent;
        }

        .alert-item.critical { border-left-color: var(--critical); background: rgba(255,75,96,0.05); }
        .alert-item.warning { border-left-color: var(--warning); background: rgba(245,158,11,0.05); }
        .alert-item.disruption { border-left-color: var(--purple); background: rgba(168,85,247,0.05); }

        .alert-severity { font-size: 0.65rem; font-weight: 800; margin-bottom: 2px; }
        .alert-msg { font-size: 0.8rem; }

        .architecture-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .arch-card {
          padding: 18px;
          text-align: center;
        }

        .arch-icon { margin-bottom: 10px; display: flex; justify-content: center; }
        .arch-card h5 { font-size: 0.85rem; margin-bottom: 6px; }
        .arch-card p { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }

        @media (max-width: 1100px) {
          .topology-grid, .console-layout, .architecture-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentConsole;
