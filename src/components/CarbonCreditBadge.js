import React from 'react';

export default function CarbonCreditBadge() {
  return (
    <div className="carbon-badge-container">
      <div className="carbon-badge-pulse" />
      <div className="carbon-badge">
        <div className="carbon-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 18Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>
        <div className="carbon-text">
          <span className="carbon-title">First Indian Company</span>
          <span className="carbon-subtitle">to receive <span className="highlight">Verra Carbon Credits</span></span>
        </div>
      </div>
    </div>
  );
}
