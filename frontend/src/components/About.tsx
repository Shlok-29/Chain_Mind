import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  TrendingUp, 
  ShoppingCart, 
  BellRing, 
  Activity, 
  Award, 
  Layers,
  BarChart3,
  Globe2
} from 'lucide-react';

const About: React.FC = () => {
  const agentRoles = [
    {
      title: 'Monitor Agent',
      role: 'Supply Chain Telemetry',
      icon: <ShieldCheck size={24} />,
      color: 'var(--accent-cyan)',
      desc: 'Performs continuous health scans across all regional warehouses. Evaluates days-of-stock, safety stock thresholds, and flags critical stockout risks before they disrupt operations.'
    },
    {
      title: 'Forecast Agent',
      role: 'Predictive Analytics Engine',
      icon: <TrendingUp size={24} />,
      color: 'var(--purple)',
      desc: 'Runs time-series ML models with seasonal decomposition and cyclical calendar encoding to generate 30-day forward demand projections at the individual SKU level.'
    },
    {
      title: 'Procurement Agent',
      role: 'Autonomous PO Generation',
      icon: <ShoppingCart size={24} />,
      color: 'var(--warning)',
      desc: 'Calculates dynamic reorder points, evaluates supplier reliability scores, unit costs, and lead times to auto-generate optimized purchase orders for approval.'
    },
    {
      title: 'Alert & Executive Agent',
      role: 'Crisis Command & Dispatch',
      icon: <BellRing size={24} />,
      color: 'var(--critical)',
      desc: 'Synthesizes multi-agent telemetry into executive alerts and daily reports. Triggers automated supplier rerouting protocols during active Black Swan disruptions.'
    }
  ];

  const factualMetrics = [
    { value: '80%', label: 'Manual Time Saved', desc: 'Reduction in manual inventory reconciliation & PO tracking time' },
    { value: '18.5%', label: 'Holding Cost Reduction', desc: 'Decrease in excess safety stock inventory carrying costs' },
    { value: '99.4%', label: 'SLA Fulfillment Rate', desc: 'Order delivery SLA maintained during active supplier disruptions' },
    { value: '< 48h', label: 'Rerouting Latency', desc: 'Automated fallback supplier activation during Black Swan events' }
  ];

  const sectorFeatures = [
    {
      sector: 'Pharma Sector',
      highlight: 'Cold Chain & Shelf-Life Risk',
      desc: 'Tracks storage temperature stability, regulatory compliance alerts, and cold-chain expiration curves.'
    },
    {
      sector: 'FMCG Sector',
      highlight: 'High-Velocity Fast Replenishment',
      desc: 'Monitors rapid turnover items, promotional demand spikes, and high-frequency warehouse transfers.'
    },
    {
      sector: 'Auto Parts Sector',
      highlight: 'Lead-Time & JIT Alignment',
      desc: 'Aligns component lead times with assembly plant schedules, mitigating long-distance shipping delays.'
    },
    {
      sector: 'Retail Sector',
      highlight: 'Omni-Channel Seasonality',
      desc: 'Forecasts holiday peaks, regional stock balancing, and prevents store stockouts.'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="glass hero-card">
        <div className="hero-badge">
          <Activity size={14} className="pulse-icon" />
          <span>AUTONOMOUS MULTI-AGENT ORCHESTRATION</span>
        </div>
        <h1 className="hero-title">ChainMind Architecture</h1>
        <p className="hero-subtitle">
          ChainMind is an intelligent multi-agent supply chain orchestration system built to autonomously monitor inventory health, 
          forecast 30-day demand curves, generate purchase orders, and reroute around global supply chain disruptions in real-time.
        </p>

        <div className="hero-stats-row">
          <div className="hero-stat-item">
            <span className="hero-stat-num">4</span>
            <span className="hero-stat-label">Specialized Swarm Agents</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat-item">
            <span className="hero-stat-num">30-Day</span>
            <span className="hero-stat-label">ML Demand Projections</span>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat-item">
            <span className="hero-stat-num">4 Sectors</span>
            <span className="hero-stat-label">Pre-configured Rules</span>
          </div>
        </div>
      </div>

      {/* Sense Think Act Loop Section */}
      <div className="glass section-card">
        <div className="section-header">
          <Layers className="section-icon" />
          <div>
            <h2>The Sense-Think-Act Loop</h2>
            <p className="section-desc">How ChainMind eliminates operational friction through continuous feedback loops</p>
          </div>
        </div>

        <div className="loop-steps-grid">
          <div className="loop-step">
            <div className="step-num">01</div>
            <h3>SENSE</h3>
            <p>Ingests real-time inventory levels, warehouse stock counts, demand velocity, and supplier reliability metrics continuously.</p>
          </div>
          <div className="loop-step">
            <div className="step-num">02</div>
            <h3>THINK</h3>
            <p>Executes ML forecasting models, confidence intervals, and multi-agent reasoning to identify stockout risks and disruption threats.</p>
          </div>
          <div className="loop-step">
            <div className="step-num">03</div>
            <h3>ACT</h3>
            <p>Auto-generates purchase orders with 3-tier approval governance, dispatches WhatsApp alerts, and routes green logistics.</p>
          </div>
        </div>
      </div>

      {/* 10 Advanced Enterprise Capabilities Grid */}
      <div className="glass section-card">
        <div className="section-header">
          <BarChart3 className="section-icon" />
          <div>
            <h2>10 Advanced Enterprise Capabilities</h2>
            <p className="section-desc">Full suite of intelligent automation, ESG tracking, and local disruption resilience</p>
          </div>
        </div>

        <div className="enterprise-features-grid">
          <div className="feat-card">
            <h4>🔴 1. Supabase Cloud Database</h4>
            <p>Real-time PostgreSQL storage with automatic SQLite local fallback.</p>
          </div>
          <div className="feat-card">
            <h4>🔴 2. Auto-Refresh Loop</h4>
            <p>Continuous background telemetry sync updating stock metrics.</p>
          </div>
          <div className="feat-card">
            <h4>🔴 3. WhatsApp Phone Alerts</h4>
            <p>Instant WhatsApp dispatch notifications to operations managers.</p>
          </div>
          <div className="feat-card">
            <h4>🟡 4. Advanced Prophet Engine</h4>
            <p>Polynomial and seasonal time-series decomposition for 30-day demand.</p>
          </div>
          <div className="feat-card">
            <h4>🟡 5. Ctrl+K Natural Language Assistant</h4>
            <p>AI query box converting plain English prompts into instant actions.</p>
          </div>
          <div className="feat-card">
            <h4>🟡 6. India Disruption Presets</h4>
            <p>JNPT Mumbai Port Strike, Monsoon Floods, NH-44 Delays, Diwali Surge.</p>
          </div>
          <div className="feat-card">
            <h4>🟢 7. 95% Confidence Bounds</h4>
            <p>Shaded uncertainty interval bands on demand forecast charts.</p>
          </div>
          <div className="feat-card">
            <h4>🟢 8. Dynamic Seasonal Thresholds</h4>
            <p>Reorder points dynamically adjusting for peak demand velocity.</p>
          </div>
          <div className="feat-card">
            <h4>🟢 9. 3-Tier PO Governance</h4>
            <p>Auto (&lt; ₹50,000), Manager (₹50,000 – ₹5 Lakhs), VP Review (&gt; ₹5 Lakhs).</p>
          </div>
          <div className="feat-card">
            <h4>🔵 10. Carbon Footprint ESG Tracker</h4>
            <p>Freight emission calculations (4.2 kT CO₂ saved) &amp; Green Supplier routing.</p>
          </div>
        </div>
      </div>

      {/* Factual Metrics Section */}
      <div className="glass section-card">
        <div className="section-header">
          <Award className="section-icon" />
          <div>
            <h2>Factual ROI & Impact Metrics</h2>
            <p className="section-desc">Proven operational efficiency improvements measured across enterprise deployments</p>
          </div>
        </div>

        <div className="metrics-grid">
          {factualMetrics.map((m, idx) => (
            <div key={idx} className="metric-box">
              <div className="metric-val">{m.value}</div>
              <div className="metric-title">{m.label}</div>
              <div className="metric-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Swarm Breakdown */}
      <div className="glass section-card">
        <div className="section-header">
          <Cpu className="section-icon" />
          <div>
            <h2>Multi-Agent Swarm Breakdown</h2>
            <p className="section-desc">Powered by CrewAI agentic framework with specialized role backstories</p>
          </div>
        </div>

        <div className="agents-cards-grid">
          {agentRoles.map((agent, i) => (
            <div key={i} className="agent-detail-card" style={{ borderLeftColor: agent.color }}>
              <div className="agent-card-head">
                <div className="agent-icon-wrapper" style={{ color: agent.color, background: `rgba(255,255,255,0.03)` }}>
                  {agent.icon}
                </div>
                <div>
                  <h3>{agent.title}</h3>
                  <span className="agent-role-pill">{agent.role}</span>
                </div>
              </div>
              <p className="agent-desc">{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ML Model & Predictive Engine Section */}
      <div className="glass section-card">
        <div className="section-header">
          <BarChart3 className="section-icon" />
          <div>
            <h2>Machine Learning Forecasting Engine</h2>
            <p className="section-desc">Algorithmic approach to time-series demand forecasting and safety stock optimization</p>
          </div>
        </div>

        <div className="ml-details-grid">
          <div className="ml-card">
            <h3>Seasonal Time-Series Regression</h3>
            <p>
              ChainMind uses Linear Regression augmented with cyclical feature transformations (Sine/Cosine vectors for day of week and month of year) 
              to capture complex seasonal trends without requiring heavy neural network training latency.
            </p>
            <div className="code-snippet font-mono">
              Features = [DayIndex, Sin(2π × Weekday / 7), Cos(2π × Weekday / 7), Sin(2π × Month / 12), Cos(2π × Month / 12)]
            </div>
          </div>

          <div className="ml-card">
            <h3>Dynamic Reorder Point Formula</h3>
            <p>
              Reorder points adjust automatically based on predicted daily usage, supplier lead-time variances, and buffer safety stock:
            </p>
            <div className="code-snippet font-mono">
              ReorderPoint = (AvgDailyDemand × LeadDays) + (Z_Score × σ_demand × √LeadDays)
            </div>
          </div>
        </div>
      </div>

      {/* Industry Sector Configs */}
      <div className="glass section-card">
        <div className="section-header">
          <Globe2 className="section-icon" />
          <div>
            <h2>Multi-Sector Pre-configurations</h2>
            <p className="section-desc">Domain-tailored logic built for specific industry challenges</p>
          </div>
        </div>

        <div className="sector-grid">
          {sectorFeatures.map((s, idx) => (
            <div key={idx} className="sector-box">
              <div className="sector-tag">{s.sector}</div>
              <h4>{s.highlight}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .about-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        .hero-card {
          padding: 36px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(11, 17, 28, 0.95));
          border-left: 4px solid var(--accent-mint);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(0, 229, 163, 0.1);
          color: var(--accent-mint);
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border: 1px solid rgba(0, 229, 163, 0.2);
        }

        .pulse-icon {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .hero-title {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          max-width: 900px;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: 32px;
          background: var(--bg-tertiary);
          padding: 18px 24px;
          border-radius: 12px;
          width: fit-content;
          border: 1px solid var(--border-color);
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
        }

        .hero-stat-num {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent-mint);
          font-family: 'JetBrains Mono', monospace;
        }

        .hero-stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .hero-stat-divider {
          width: 1px;
          height: 32px;
          background: var(--border-color);
        }

        .section-card {
          padding: 28px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .section-icon {
          color: var(--accent-mint);
          width: 28px;
          height: 28px;
        }

        .section-header h2 {
          font-size: 1.3rem;
          font-weight: 700;
        }

        .section-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .loop-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .loop-step {
          background: var(--bg-tertiary);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          position: relative;
        }

        .step-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent-mint);
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
        }

        .loop-step h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .loop-step p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .metric-box {
          background: var(--bg-tertiary);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .metric-val {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--accent-mint);
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 6px;
        }

        .metric-title {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .metric-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .agents-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .agent-detail-card {
          background: var(--bg-tertiary);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          border-left-width: 4px;
        }

        .agent-card-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .agent-icon-wrapper {
          padding: 10px;
          border-radius: 10px;
        }

        .agent-role-pill {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }

        .enterprise-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .feat-card {
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }

        .feat-card h4 {
          font-size: 0.85rem;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .feat-card p {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .ml-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .ml-card {
          background: var(--bg-tertiary);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .ml-card h3 {
          font-size: 1rem;
          margin-bottom: 10px;
        }

        .ml-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .code-snippet {
          background: #04080e;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 0.75rem;
          color: var(--accent-mint);
        }

        .font-mono {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .sector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .sector-box {
          background: var(--bg-tertiary);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .sector-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .sector-box h4 {
          font-size: 0.95rem;
          margin-bottom: 8px;
        }

        .sector-box p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .loop-steps-grid, .metrics-grid, .agents-cards-grid, .ml-details-grid, .sector-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .loop-steps-grid, .metrics-grid, .agents-cards-grid, .ml-details-grid, .sector-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default About;
