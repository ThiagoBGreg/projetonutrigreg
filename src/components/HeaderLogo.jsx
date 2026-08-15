import React from 'react';

export default function HeaderLogo() {
  return (
    <div className="brand-header">
      <img src="/logo.png" alt="Nutri Rodrigues Logo" className="brand-logo-img" />
      <div className="brand-text-wrapper">
        <h1 className="brand-title">
          Nutri <span>Rodrigues</span>
        </h1>
        <span className="brand-subtitle">NUTRIÇÃO E BEM-ESTAR</span>
      </div>
    </div>
  );
}

