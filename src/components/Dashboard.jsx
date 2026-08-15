import React from 'react';
import HeaderLogo from './HeaderLogo';
import { LogOut, UserCheck, ShieldCheck, HeartPulse } from 'lucide-react';
import { signOutNutricionista } from '../lib/neon';

export default function Dashboard({ user, onLogout }) {
  const handleLogout = async () => {
    await signOutNutricionista();
    onLogout();
  };

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <HeaderLogo />
        <button
          className="btn-secondary"
          onClick={handleLogout}
          title="Encerrar sessão"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-banner">
          <h2 className="welcome-title">
            Bem-vindo(a), {user?.name || 'Nutricionista'}! 👋
          </h2>
          <p className="welcome-subtitle">
            Seu painel de gerenciamento no <strong>Nutri Rodrigues</strong> está ativo.
          </p>
        </div>

        <div className="profile-card">
          <h3 className="profile-card-title">Informações do Nutricionista</h3>
          
          <div className="profile-info-grid">
            <div className="info-item">
              <span className="info-label">Nome Completo</span>
              <span className="info-value">{user?.name || 'Não informado'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Email Profissional</span>
              <span className="info-value">{user?.email || 'Não informado'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Status da Conta</span>
              <span className="info-value" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={16} /> Autenticado (Neon Auth)
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Especialidade</span>
              <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HeartPulse size={16} color="#10b981" /> Nutrição Clínica & Esportiva
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
