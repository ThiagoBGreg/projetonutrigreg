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
  Sparkles,
  UserPlus,
  Apple,
  Salad,
  Dumbbell,
  Flame,
  Zap,
  TrendingUp,
  Activity,
  Award,
  Stethoscope,
  Smile
} from 'lucide-react';
import { signOutNutricionista, getDashboardMetrics } from '../lib/neon';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pacientes'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientsViewState, setPatientsViewState] = useState('list');
  const [newPatientTrigger, setNewPatientTrigger] = useState(0);
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

  const handleOpenNewPatient = () => {
    setSelectedPatientId(null);
    setActiveTab('pacientes');
    setNewPatientTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard-layout-fixed">
      {/* Cabeçalho exclusivo para Telas Mobile */}
      <header className="dashboard-mobile-header">
        <HeaderLogo />
        <button type="button" className="btn-mobile-logout morph-btn" onClick={handleLogout} title="Sair do sistema">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </header>

      {/* Menu Lateral Fixo (Sidebar no Desktop / Barra Inferior no Mobile) */}
      <aside className="dashboard-sidebar morph-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo-wrapper">
            <HeaderLogo />
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item morph-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedPatientId(null);
              }}
            >
              <LayoutDashboard size={20} />
              <span>Painel Clínico</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item morph-nav-btn ${activeTab === 'pacientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pacientes')}
            >
              <Users size={20} />
              <span>Pacientes & Dietas</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user-card morph-user-card">
            <div className="user-avatar-circle morph-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Nutricionista'}</span>
              <span className="user-role">Profissional da Saúde</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn morph-btn"
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
            newPatientTrigger={newPatientTrigger}
            onViewStateChange={setPatientsViewState}
          />
        ) : (
          <div className="dashboard-home-view fade-in">
            {/* Banner de Boas-Vindas com Tema de Nutrição Viva e Movimento */}
            <div className="dashboard-hero-banner morph-shape">
              <div className="hero-banner-decor-circle"></div>
              
              <div className="dashboard-welcome-header">
                <div>
                  <div className="welcome-pill morph-pill">
                    <Sparkles size={14} />
                    <span>Ambiente Clínico Inteligente</span>
                  </div>
                  <h1 className="welcome-heading">
                    Olá, Dr(a). {user?.name || 'Nutricionista'}! 👋
                  </h1>
                  <p className="welcome-subheading">
                    "O alimento que você prescreve hoje é a energia, a saúde e o futuro dos seus pacientes."
                  </p>
                </div>

                <div className="today-badge morph-badge">
                  <Sparkles size={16} color="#10b981" />
                  <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>

              {/* Destaques Rápidos com Imagens de Frutas & Exercícios */}
              <div className="dashboard-quick-food-pills">
                <div className="quick-pill-card morph-card-mini">
                  <Apple size={18} color="#ef4444" />
                  <div>
                    <strong>Frutas & Antioxidantes</strong>
                    <span>Regulação celular & imunidade</span>
                  </div>
                </div>
                <div className="quick-pill-card morph-card-mini">
                  <Salad size={18} color="#10b981" />
                  <div>
                    <strong>Fibras & Microbiota</strong>
                    <span>Saúde metabólica e digestiva</span>
                  </div>
                </div>
                <div className="quick-pill-card morph-card-mini">
                  <Dumbbell size={18} color="#f59e0b" />
                  <div>
                    <strong>Treino & Performance</strong>
                    <span>Equilíbrio de macronutrientes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid dos Cards Principais de Métricas com Efeito Morphing */}
            <div className="metrics-cards-grid">
              {/* Card 1 — Total de Pacientes Ativos */}
              <div className="metric-card card-patients morph-card">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-emerald morph-circle">
                    <Users size={24} />
                  </div>
                  <span className="metric-card-tag morph-tag">Ativos</span>
                </div>
                <div className="metric-card-body">
                  <span className="metric-label">Total de Pacientes Ativos</span>
                  <div className="metric-value">{loadingMetrics ? '...' : metrics.totalPacientes}</div>
                  <p className="metric-description">Pessoas em acompanhamento e transformação</p>
                </div>
              </div>

              {/* Card 2 — Consultas da Semana */}
              <div className="metric-card card-consultas morph-card">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-cyan morph-circle">
                    <CalendarCheck size={24} />
                  </div>
                  <span className="metric-card-tag tag-cyan morph-tag">Esta Semana</span>
                </div>
                <div className="metric-card-body">
                  <span className="metric-label">Consultas da Semana</span>
                  <div className="metric-value">{loadingMetrics ? '...' : metrics.consultasSemana}</div>
                  <p className="metric-description">Atendimentos registrados no período atual</p>
                </div>
              </div>

              {/* Card 3 — Pacientes sem Retorno */}
              <div className="metric-card card-no-return morph-card">
                <div className="metric-card-header">
                  <div className="metric-icon-circle icon-amber morph-circle">
                    <ClockAlert size={24} />
                  </div>
                  <span className="metric-card-tag tag-amber morph-tag">Atenção</span>
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
                            className="no-return-item morph-item"
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

            {/* Painel de Ação Rápida e Pilares da Nutrição */}
            <div className="dashboard-features-row">
              <div className="clinical-tip-card morph-card">
                <div className="tip-header">
                  <div className="tip-icon-box morph-circle">
                    <HeartPulse size={22} color="#10b981" />
                  </div>
                  <div>
                    <h3 className="tip-title">Pilares da Prescrição Nutricional</h3>
                    <span className="tip-subtitle">Diretrizes para adesão a longo prazo</span>
                  </div>
                </div>
                <div className="tip-items-grid">
                  <div className="tip-item morph-item-subtle">
                    <Apple size={16} color="#ef4444" />
                    <div>
                      <strong>Variedade de Micronutrientes</strong>
                      <p>Quanto mais cores no prato, mais amplo é o espectro fitoquímico protetor.</p>
                    </div>
                  </div>
                  <div className="tip-item morph-item-subtle">
                    <Dumbbell size={16} color="#f59e0b" />
                    <div>
                      <strong>Sinergia com Exercício Físico</strong>
                      <p>Sincronização de carboidratos e proteínas em torno do horário de treino.</p>
                    </div>
                  </div>
                  <div className="tip-item morph-item-subtle">
                    <Stethoscope size={16} color="#06b6d4" />
                    <div>
                      <strong>Acompanhamento Frequente</strong>
                      <p>Consultas mensais aumentam em 80% o cumprimento das metas metabólicas.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Atalho para Novo Paciente */}
              <div className="quick-action-hero-card morph-card">
                <div className="quick-action-badge">
                  <Sparkles size={14} />
                  <span>Cadastros & Prescrições</span>
                </div>
                <h3 className="quick-action-title">Novo Paciente no Consultório?</h3>
                <p className="quick-action-desc">
                  Inicie a anamnese completa, calcule o IMC e prescreva o plano alimentar personalizado em poucos cliques.
                </p>
                <button
                  type="button"
                  className="btn-quick-new-patient morph-btn"
                  onClick={handleOpenNewPatient}
                >
                  <UserPlus size={18} />
                  <span>Cadastrar Paciente Agora</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Botão Flutuante no Canto da Tela para Cadastrar Novo Paciente */}
      {!(activeTab === 'pacientes' && patientsViewState === 'form') && (
        <button
          type="button"
          className="floating-action-btn morph-fab fade-in"
          onClick={handleOpenNewPatient}
          title="Cadastrar Novo Paciente"
          id="btn-floating-novo-paciente"
        >
          <UserPlus size={20} className="fab-icon" />
          <span>Novo Paciente</span>
        </button>
      )}
    </div>
  );
}
