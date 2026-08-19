import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  Bot
} from 'lucide-react';
import axios from 'axios';

interface AuthProps {
  onLoginSuccess: (session: any) => void;
}

import { API_BASE } from '../config';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Supply Chain Director');
  const [industry, setIndustry] = useState('Pharma');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
        onLoginSuccess(res.data);
      } else {
        if (!name) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        const res = await axios.post(`${API_BASE}/api/auth/register`, {
          email,
          password,
          name,
          role,
          industry
        });
        onLoginSuccess(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'executive@chainmind.ai',
        password: 'admin'
      });
      onLoginSuccess(res.data);
    } catch (err) {
      console.error(err);
      // Fallback demo session if offline
      onLoginSuccess({
        token: 'demo_token_123',
        user: {
          name: 'Alex Mercer',
          email: 'executive@chainmind.ai',
          role: 'Supply Chain VP',
          industry: 'Pharma'
        }
      });
    }
  };

  return (
    <div className="auth-gateway-container">
      <div className="auth-background-grid"></div>

      <div className="glass auth-card">
        {/* Header Branding */}
        <div className="auth-brand">
          <div className="auth-logo-wrapper">
            <img src="/logo.png" alt="ChainMind Logo" className="auth-logo" />
          </div>
          <h1>CHAINMIND</h1>
          <p className="auth-subtitle">Autonomous Multi-Agent Supply Chain Orchestrator</p>
          
          <div className="security-badge">
            <ShieldCheck size={12} className="text-mint" />
            <span>256-BIT QUANTUM ENCRYPTION ACTIVE</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            SIGN IN
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error-banner">{error}</div>}

          {!isLogin && (
            <div className="input-field-group">
              <label>FULL NAME</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Aris Thorne" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="input-field-group">
            <label>ENTERPRISE EMAIL</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input 
                type="email" 
                placeholder="executive@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-field-group">
            <label>PASSWORD</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="input-grid-row">
              <div className="input-field-group">
                <label>ROLE TITLE</label>
                <div className="input-wrapper">
                  <Bot size={16} className="input-icon" />
                  <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="Supply Chain Director">Supply Chain Director</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Procurement Specialist">Procurement Specialist</option>
                    <option value="Logistics VP">Logistics VP</option>
                  </select>
                </div>
              </div>

              <div className="input-field-group">
                <label>SECTOR</label>
                <div className="input-wrapper">
                  <Building2 size={16} className="input-icon" />
                  <select value={industry} onChange={e => setIndustry(e.target.value)}>
                    <option value="Pharma">Pharma</option>
                    <option value="FMCG">FMCG</option>
                    <option value="Auto Parts">Auto Parts</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <span>{loading ? 'AUTHENTICATING...' : (isLogin ? 'ACCESS COMMAND CENTER' : 'INITIALIZE ACCOUNT')}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Shortcut */}
        <div className="demo-login-divider">
          <span>OR QUICK ACCESS</span>
        </div>

        <button type="button" className="btn btn-secondary btn-block btn-demo" onClick={handleDemoLogin}>
          <Sparkles size={16} className="text-mint" />
          <span>Demo Executive Login (1-Click Preview)</span>
        </button>
      </div>

      <style>{`
        .auth-gateway-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #070b12;
          position: relative;
          padding: 24px;
        }

        .auth-background-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(to right, rgba(0, 201, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 201, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 36px;
          position: relative;
          z-index: 10;
          border: 1px solid var(--border-active);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 163, 0.05);
        }

        .auth-brand {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-logo-wrapper {
          width: 64px;
          height: 64px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-logo {
          width: 54px;
          height: 54px;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(0, 229, 163, 0.5));
        }

        .auth-brand h1 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #00e5a3, #00c9ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(0, 229, 163, 0.06);
          border: 1px solid rgba(0, 229, 163, 0.2);
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: var(--bg-tertiary);
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid var(--border-color);
        }

        .auth-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tab-btn.active {
          background: var(--bg-secondary);
          color: var(--accent-mint);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-error-banner {
          background: rgba(255, 75, 96, 0.1);
          border: 1px solid rgba(255, 75, 96, 0.3);
          color: var(--critical);
          padding: 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          text-align: center;
        }

        .input-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-field-group label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-wrapper input, .input-wrapper select {
          width: 100%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 10px 12px 10px 38px;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-wrapper input:focus, .input-wrapper select:focus {
          border-color: var(--accent-mint);
        }

        .toggle-password-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .input-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-block {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .demo-login-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0 16px;
          color: var(--text-muted);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .demo-login-divider::before, .demo-login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .demo-login-divider span {
          padding: 0 10px;
        }

        .btn-demo {
          border-color: rgba(0, 229, 163, 0.3);
          background: rgba(0, 229, 163, 0.04);
        }

        .btn-demo:hover {
          background: rgba(0, 229, 163, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Auth;
