import React, { useState, useEffect } from 'react';
import HeaderLogo from './HeaderLogo';
import PatientsView from './PatientsView';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClockAlert,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { signOutNutricionista, getDashboardMetrics } from '../lib/neon';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pacientes'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: []
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoadingMetrics(true);
        const data = await getDashboardMetrics(user?.id || 'demo');
        setMetrics(data);
      } catch (err) {
        console.warn('Erro ao carregar métricas do dashboard:', err);
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, [user]);

  const handleLogout = async () => {
    await signOutNutricionista();
    onLogout();
  };

  const handlePatientClick = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab('pacientes');
  };

  return (
    <div className="dashboard-layout-fixed">
      {/* Menu Lateral Fixo (Sidebar) */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo-wrapper">
            <HeaderLogo />
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedPatientId(null);
              }}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pacientes')}
            >
              <Users size={20} />
              <span>Pacientes</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user-card">
            <div className="user-avatar-circle">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Nutricionista'}</span>
              <span className="user-role">Nutricionista Clínico</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Encerrar sessão"
          >
            <LogOut size={18} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="dashboard-main-content">
        {activeTab === 'pacientes' ? (
          <PatientsView
            user={user}
            selectedPatientId={selectedPatientId}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        ) : (
          <div className="dashboard-home-view fade-in">
            {/* Header / Boas-vindas */}
            <div className="dashboard-welcome-header">
              <div>
                <h1 className="welcome-heading">
                  Olá, Dr(a). {user?.name || 'Nutricionista'}! 👋
                </h1>
                <p className="welcome-subheading">
                  Confira o resumo em tempo real do seu consultório no <strong>Nutri Rodrigues</strong>.
                </p>
              </div>

              <div className="today-badge">
                <Sparkles size={16} color="#10b981" />
                <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
            </div>

            {/* Grid dos 3 Cards Principais de Informação */}
            <div className="metrics-cards-grid">
              {/* Card 1 — Total de Pacientes Ativos */}
              <div className="metric-card card-patients">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-emerald">
                    <Users size={24} />
                  </div>
                  <span className="metric-card-tag">Ativos</span>
                </div>
                <div className="metric-card-body">
                  <span className="metric-label">Total de Pacientes Ativos</span>
                  <div className="metric-value">{loadingMetrics ? '...' : metrics.totalPacientes}</div>
                  <p className="metric-description">Pacientes sob seus cuidados nutricionais</p>
                </div>
              </div>

              {/* Card 2 — Consultas da Semana */}
              <div className="metric-card card-consultas">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-cyan">
                    <CalendarCheck size={24} />
                  </div>
                  <span className="metric-card-tag tag-cyan">Esta Semana</span>
                </div>
                <div className="metric-card-body">
                  <span className="metric-label">Consultas da Semana</span>
                  <div className="metric-value">{loadingMetrics ? '...' : metrics.consultasSemana}</div>
                  <p className="metric-description">Atendimentos registrados no período atual</p>
                </div>
              </div>

              {/* Card 3 — Pacientes sem Retorno */}
              <div className="metric-card card-no-return">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-amber">
                    <ClockAlert size={24} />
                  </div>
                  <span className="metric-card-tag tag-amber">Atenção</span>
                </div>
                <div className="metric-card-body">
                  <span className="metric-label">Pacientes Sem Retorno (&gt; 30 dias)</span>
                  <div className="metric-value-sm">
                    {metrics.pacientesSemRetorno.length} {metrics.pacientesSemRetorno.length === 1 ? 'paciente' : 'pacientes'}
                  </div>

                  {/* Lista com os nomes dos pacientes sem retorno (Clicáveis) */}
                  <div className="no-return-list-wrapper">
                    {loadingMetrics ? (
                      <p className="loading-text">Carregando lista de pacientes...</p>
                    ) : metrics.pacientesSemRetorno.length === 0 ? (
                      <div className="no-return-empty">
                        <ShieldCheck size={18} color="#10b981" />
                        <span>Nenhum paciente sem retorno no momento</span>
                      </div>
                    ) : (
                      <ul className="no-return-list">
                        {metrics.pacientesSemRetorno.map(patient => (
                          <li
                            key={patient.id}
                            className="no-return-item"
                            onClick={() => handlePatientClick(patient.id)}
                            title="Clique para abrir o perfil do paciente"
                          >
                            <div className="patient-item-info">
                              <span className="patient-item-name">{patient.nome}</span>
                              <span className="patient-item-days">
                                Há {patient.diasSemRetorno} dias sem consulta
                              </span>
                            </div>
                            <ChevronRight size={16} className="chevron-icon" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção adicional do Nutricionista */}
            <div className="dashboard-account-summary">
              <div className="summary-card">
                <div className="summary-card-header">
                  <HeartPulse size={20} color="#10b981" />
                  <h3>Painel Clínico Nutri Rodrigues</h3>
                </div>
                <p className="summary-card-text">
                  Todos os dados são atualizados em tempo real do banco Neon. Use o menu lateral fixo para gerenciar seus pacientes e planos alimentares.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
