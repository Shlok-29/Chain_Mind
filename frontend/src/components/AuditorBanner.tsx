import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AuditorBannerProps {
  userRole?: string;
}

const AuditorBanner: React.FC<AuditorBannerProps> = ({ userRole }) => {
  if (userRole !== 'auditor') return null;

  return (
    <div className="auditor-sticky-banner">
      <div className="auditor-banner-content">
        <ShieldAlert size={16} className="auditor-icon text-amber" />
        <span className="auditor-title">VIEW ONLY — AUDITOR MODE</span>
        <span className="auditor-sep">•</span>
        <span className="auditor-text">Comprehensive compliance monitoring active (Zero Write Permissions)</span>
        <span className="auditor-chip">READ-ONLY AUDIT</span>
      </div>
      <style>{`
        .auditor-sticky-banner {
          position: sticky;
          top: 0;
          z-index: 1100;
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 50%, rgba(245, 158, 11, 0.25) 100%);
          border-bottom: 1px solid rgba(245, 158, 11, 0.6);
          backdrop-filter: blur(12px);
          padding: 8px 24px;
          color: #fbbf24;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);
        }
        .auditor-banner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .auditor-icon {
          animation: pulse 2s infinite;
        }
        .auditor-title {
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #fef08a;
        }
        .auditor-sep {
          opacity: 0.6;
        }
        .auditor-text {
          opacity: 0.9;
        }
        .auditor-chip {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.5);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #fef08a;
        }
      `}</style>
    </div>
  );
};

export default AuditorBanner;
