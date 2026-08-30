import React from 'react';
import { Apple, Sparkles } from 'lucide-react';

export default function HeaderLogo() {
  return (
    <div className="brand-header morph-brand">
      <div className="brand-logo-container morph-logo">
        <img src="/logo.png" alt="Nutri Rodrigues Logo" className="brand-logo-img" />
        <div className="logo-sparkle-dot"></div>
      </div>
      <div className="brand-text-wrapper">
        <h1 className="brand-title">
          Nutri <span className="brand-highlight">Rodrigues</span>
        </h1>
        <span className="brand-subtitle">NUTRIÇÃO & BEM-ESTAR INTEGRAL</span>
      </div>
    </div>
  );
}
