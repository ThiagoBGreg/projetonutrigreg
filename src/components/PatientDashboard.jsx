import React, { useState, useEffect } from 'react';
import HeaderLogo from './HeaderLogo';
import { 
  LogOut, 
  Utensils, 
  Droplets, 
  Target, 
  HeartPulse, 
  AlertTriangle, 
  Moon, 
  Sun, 
  Activity, 
  Scale, 
  Ruler, 
  Calendar,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  Info,
  Clock,
  KeyRound,
  Copy,
  Check,
  Coffee,
  Apple,
  Dumbbell,
  Flame,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { signOutNutricionista, getPatientPortalData } from '../lib/neon';

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const MEALS_CONFIG = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: Coffee, defaultTime: '07:30', color: '#f59e0b' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: Apple, defaultTime: '10:00', color: '#10b981' },
  { key: 'almoco', label: 'Almoço', icon: Utensils, defaultTime: '12:30', color: '#06b6d4' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: Coffee, defaultTime: '16:00', color: '#8b5cf6' },
  { key: 'jantar', label: 'Jantar', icon: Utensils, defaultTime: '19:30', color: '#ec4899' }
];

export default function PatientDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState(0);
  const [waterCups, setWaterCups] = useState(() => {
    const saved = localStorage.getItem(`water_cups_${user?.id || user?.email}`);
    return saved ? Number(saved) : 0;
  });
  const [activeTab, setActiveTab] = useState('plano'); // 'plano' | 'metas' | 'anamnese'

  useEffect(() => {
    async function loadPatient() {
      try {
        setLoading(true);
        const res = await getPatientPortalData(user?.email || user?.id);
        setData(res);
      } catch (err) {
        console.error('Erro ao carregar portal do paciente:', err);
        setError('Não foi possível carregar seus dados no momento.');
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [user]);

  const handleLogout = async () => {
    await signOutNutricionista();
    onLogout();
  };

  const handleCopyKey = (key) => {
    if (!key) return;
    navigator.clipboard?.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleWaterClick = (cups) => {
    const next = cups === waterCups ? cups - 1 : cups;
    setWaterCups(next);
    localStorage.setItem(`water_cups_${user?.id || user?.email}`, next.toString());
  };

  if (loading) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner" style={{ width: '42px', height: '42px', borderWidth: '3px', borderTopColor: '#10b981' }} />
          <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.98rem' }}>Carregando seu plano alimentar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
        <div className="morph-card" style={{ maxWidth: '440px', width: '100%', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <AlertTriangle size={48} color="#ef4444" />
          <h3 style={{ margin: 0, color: '#0f172a' }}>Ops! Algo deu errado</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          <button className="btn-primary" onClick={handleLogout} style={{ marginTop: '8px' }}>
            <LogOut size={16} />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    );
  }

  const paciente = data?.paciente;
  const plano = data?.planoAlimentar;
  const chaveAcesso = paciente?.chave_acesso || (typeof user?.token === 'string' && user.token.startsWith('patient_session_') ? user.token.replace('patient_session_', '') : '');

  // Calculo de IMC
  const peso = paciente?.peso_inicial ? Number(paciente.peso_inicial) : null;
  const altura = paciente?.altura ? Number(paciente.altura) : null;
  let imc = null;
  let imcClass = '';
  if (peso && altura && altura > 0) {
    const h = altura > 3 ? altura / 100 : altura;
    imc = (peso / (h * h)).toFixed(1);
    if (imc < 18.5) imcClass = 'Abaixo do peso';
    else if (imc < 25) imcClass = 'Peso ideal';
    else if (imc < 30) imcClass = 'Sobrepeso';
    else imcClass = 'Obesidade';
  }

  // Verifica se o plano salvo possui a estrutura semanal de 7 dias com 5 refeições (Prompt 6)
  const isWeeklyStructured = Boolean(
    plano?.conteudo?.plano_semanal &&
    Array.isArray(plano.conteudo.plano_semanal) &&
    plano.conteudo.plano_semanal.length > 0
  );

  const defaultRefeicoes = [
    { titulo: 'Café da Manhã', horario: '07:30', itens: ['Ovos mexidos com azeite ou queijo branco', '1 fatia de pão integral ou aveia', 'Café sem açúcar ou chá verde', '1 porção de fruta (mamão ou maçã)'] },
    { titulo: 'Lanche da Manhã', horario: '10:00', itens: ['1 porção de castanhas do Pará ou nozes (20g)', 'Iogurte natural desnatado'] },
    { titulo: 'Almoço', horario: '12:30', itens: ['Salada verde à vontade com azeite extra virgem', 'Arroz integral (2 colheres de sopa)', 'Feijão carioca (1 concha)', 'Filé de peito de frango grelhado ou peixe (120g)', 'Legumes cozidos (cenoura, brócolis)'] },
    { titulo: 'Lanche da Tarde', horario: '16:00', itens: ['Vitamina de frutas com leite desnatado ou vegetal', '1 colher de chia ou linhaça'] },
    { titulo: 'Jantar', horario: '19:30', itens: ['Sopa de legumes com frango desfiado ou Omelete com legumes', 'Mix de folhas verdes'] }
  ];

  let fallbackRefeicoes = defaultRefeicoes;
  if (plano?.conteudo?.refeicoes && Array.isArray(plano.conteudo.refeicoes) && plano.conteudo.refeicoes.length > 0) {
    fallbackRefeicoes = plano.conteudo.refeicoes;
  }

  const metaLitrosAgua = paciente?.litros_agua ? Number(paciente.litros_agua) : 2.5;
  const totalCopos = Math.round(metaLitrosAgua * 4); // 250ml cada copo

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <nav className="dashboard-nav">
        <HeaderLogo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {chaveAcesso && (
            <div className="portal-key-pill" onClick={() => handleCopyKey(chaveAcesso)} title="Clique para copiar sua chave de acesso">
              <KeyRound size={14} color="#06b6d4" />
              <span>Chave: <strong>{chaveAcesso}</strong></span>
              {copiedKey ? <Check size={13} color="#10b981" /> : <Copy size={13} color="#94a3b8" />}
            </div>
          )}

          <div className="badge-patient">
            <Sparkles size={14} />
            <span>Portal do Paciente</span>
          </div>

          <button
            className="btn-secondary"
            onClick={handleLogout}
            title="Encerrar sessão"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        {/* Welcome Header */}
        <div className="welcome-banner patient-banner morph-shape">
          <div className="patient-banner-text">
            <div className="patient-welcome-pill morph-pill">
              <Sparkles size={14} className="sparkle-spin" />
              <span>Plano Nutricional em Tempo Real</span>
            </div>
            <h2 className="welcome-title">
              Olá, {paciente?.nome || user?.name}! 👋
            </h2>
            <p className="welcome-subtitle">
              Acompanhe seu cardápio semanal completo, hidratação e metas prescritas pelo seu nutricionista.
            </p>
          </div>

          <div className="patient-banner-aside">
            {chaveAcesso && (
              <div className="patient-key-display-card morph-card-mini">
                <div className="key-header-row">
                  <KeyRound size={16} color="#06b6d4" />
                  <span>Sua Chave de Acesso</span>
                </div>
                <div className="key-number-row">
                  <span className="key-digits">{chaveAcesso}</span>
                  <button
                    type="button"
                    className="btn-copy-portal-key"
                    onClick={() => handleCopyKey(chaveAcesso)}
                    title="Copiar Chave de Acesso"
                  >
                    {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {paciente?.nutricionista_nome && (
              <div className="nutri-badge-card morph-card-mini">
                <div className="nutri-badge-icon">
                  <Stethoscope size={20} color="#10b981" />
                </div>
                <div>
                  <span className="nutri-badge-label">Nutricionista Responsável</span>
                  <strong className="nutri-badge-name">{paciente.nutricionista_nome}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card morph-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Scale size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">Peso Registrado</span>
              <strong className="stat-value">{peso ? `${peso} kg` : '70.0 kg'}</strong>
              <span className="stat-caption">Registrado na anamnese</span>
            </div>
          </div>

          <div className="stat-card morph-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Ruler size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">Altura & IMC</span>
              <strong className="stat-value">{altura ? `${altura} m` : '1.70 m'}</strong>
              <span className="stat-caption" style={{ color: '#10b981', fontWeight: 600 }}>
                {imc ? `IMC ${imc} (${imcClass})` : 'IMC 24.2 (Peso ideal)'}
              </span>
            </div>
          </div>

          <div className="stat-card morph-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
              <Droplets size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">Meta de Hidratação</span>
              <strong className="stat-value">{metaLitrosAgua} Litros / dia</strong>
              <span className="stat-caption">{waterCups} de {totalCopos} copos (250ml) hoje</span>
            </div>
          </div>

          <div className="stat-card morph-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Target size={24} />
            </div>
            <div className="stat-data">
              <span className="stat-label">Foco Principal</span>
              <strong className="stat-value" style={{ fontSize: '1.1rem' }}>
                {paciente?.objetivo_texto || (Array.isArray(paciente?.objetivos) ? paciente.objetivos[0] : 'Reeducação Alimentar')}
              </strong>
              <span className="stat-caption">Plano personalizado</span>
            </div>
          </div>
        </div>

        {/* Interactive Water Tracker */}
        <div className="water-tracker-card morph-card">
          <div className="water-tracker-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={20} color="#0ea5e9" className="pulse-slow" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
                Controle Diário de Água
              </h3>
            </div>
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Progresso: <strong>{Math.min(100, Math.round((waterCups / totalCopos) * 100))}%</strong>
            </span>
          </div>

          <div className="water-cups-row">
            {Array.from({ length: totalCopos }).map((_, idx) => {
              const isFilled = idx < waterCups;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`water-cup-btn ${isFilled ? 'filled' : ''}`}
                  onClick={() => handleWaterClick(idx + 1)}
                  title={`Copo ${idx + 1} (250ml) - Clique para marcar`}
                >
                  <Droplets size={16} />
                  <span>{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="patient-tabs">
          <button
            className={`patient-tab-btn ${activeTab === 'plano' ? 'active' : ''}`}
            onClick={() => setActiveTab('plano')}
          >
            <Utensils size={18} />
            <span>Meu Plano Alimentar</span>
          </button>

          <button
            className={`patient-tab-btn ${activeTab === 'metas' ? 'active' : ''}`}
            onClick={() => setActiveTab('metas')}
          >
            <Target size={18} />
            <span>Metas & Rotina</span>
          </button>

          <button
            className={`patient-tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`}
            onClick={() => setActiveTab('anamnese')}
          >
            <Info size={18} />
            <span>Orientações & Restrições</span>
          </button>
        </div>

        {/* Tab 1: Plano Alimentar */}
        {activeTab === 'plano' && (
          <div className="meal-plan-section fade-in">
            <div className="section-header-row">
              <div>
                <h3 className="section-title">
                  {plano?.conteudo?.titulo || 'Cardápio & Refeições Prescritas'}
                </h3>
                <p className="section-subtitle">
                  {plano?.conteudo?.observacoes_gerais || 'Siga os horários e porções recomendados pelo seu nutricionista para atingir seu objetivo.'}
                </p>
              </div>
              <div className="plan-badge">
                <Sparkles size={16} color="#10b981" />
                <span>Prescrição Ativa</span>
              </div>
            </div>

            {/* Se o plano é estruturado semanalmente por 7 dias (Prompt 6) */}
            {isWeeklyStructured ? (
              <div className="patient-weekly-plan-wrapper">
                {/* Abas dos 7 dias */}
                <div className="patient-days-tabs">
                  {DAYS_OF_WEEK.map((diaNome, idx) => {
                    const isActive = activeDayTab === idx;
                    return (
                      <button
                        key={diaNome}
                        type="button"
                        className={`patient-day-tab-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveDayTab(idx)}
                      >
                        <span className="day-name-short">{diaNome.slice(0, 3)}</span>
                        <span className="day-name-long">{diaNome}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="active-day-heading">
                  <Calendar size={18} color="#10b981" />
                  <h4>Cardápio de {DAYS_OF_WEEK[activeDayTab]}</h4>
                </div>

                {/* Grid das 5 Refeições do dia selecionado */}
                <div className="meal-cards-grid">
                  {MEALS_CONFIG.map(({ key, label, icon: MealIcon, defaultTime, color }) => {
                    const dayData = plano.conteudo.plano_semanal[activeDayTab] || { refeicoes: {} };
                    const rawOptions = dayData.refeicoes?.[key] || [];
                    const options = Array.isArray(rawOptions) ? rawOptions.filter(Boolean) : [String(rawOptions)];

                    return (
                      <div key={key} className="meal-card morph-card">
                        <div className="meal-card-header" style={{ borderLeftColor: color }}>
                          <div className="meal-title-group">
                            <div className="meal-icon-mini" style={{ backgroundColor: `${color}18`, color: color }}>
                              <MealIcon size={16} />
                            </div>
                            <h4 className="meal-title">{label}</h4>
                          </div>
                          <span className="meal-time">
                            <Clock size={14} />
                            <span>{defaultTime}</span>
                          </span>
                        </div>

                        <ul className="meal-items-list">
                          {options.length > 0 ? (
                            options.map((item, optIdx) => (
                              <li key={optIdx} className="meal-item">
                                <CheckCircle2 size={16} color="#10b981" style={{ minWidth: '16px' }} />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="meal-item text-muted">
                              <span>Refeição livre ou conforme orientação</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Navegação entre dias */}
                <div className="patient-day-nav-bar">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={activeDayTab === 0}
                    onClick={() => setActiveDayTab((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={16} />
                    <span>Dia Anterior</span>
                  </button>

                  <span className="patient-day-indicator">
                    {activeDayTab + 1} de 7: <strong>{DAYS_OF_WEEK[activeDayTab]}</strong>
                  </span>

                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={activeDayTab === 6}
                    onClick={() => setActiveDayTab((p) => Math.min(6, p + 1))}
                  >
                    <span>Próximo Dia</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback: Lista de refeições padrão */
              <div className="meal-cards-grid">
                {fallbackRefeicoes.map((ref, idx) => (
                  <div key={idx} className="meal-card morph-card">
                    <div className="meal-card-header">
                      <div className="meal-title-group">
                        <span className="meal-index">{idx + 1}</span>
                        <h4 className="meal-title">{ref.titulo}</h4>
                      </div>
                      {ref.horario && (
                        <span className="meal-time">
                          <Clock size={14} />
                          <span>{ref.horario}</span>
                        </span>
                      )}
                    </div>

                    <ul className="meal-items-list">
                      {Array.isArray(ref.itens) && ref.itens.map((item, itemIdx) => (
                        <li key={itemIdx} className="meal-item">
                          <CheckCircle2 size={16} color="#10b981" style={{ minWidth: '16px' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Metas & Rotina */}
        {activeTab === 'metas' && (
          <div className="goals-section fade-in">
            <div className="goals-grid">
              <div className="goal-card morph-card">
                <div className="goal-header">
                  <Target size={20} color="#10b981" />
                  <h4>Objetivos Nutricionais</h4>
                </div>
                <div className="tag-cloud">
                  {Array.isArray(paciente?.objetivos) && paciente.objetivos.length > 0 ? (
                    paciente.objetivos.map((obj, i) => (
                      <span key={i} className="goal-tag morph-chip">{obj}</span>
                    ))
                  ) : (
                    <>
                      <span className="goal-tag morph-chip">Reeducação Alimentar</span>
                      <span className="goal-tag morph-chip">Emagrecimento Saudável</span>
                      <span className="goal-tag morph-chip">Ganho de Disposição</span>
                    </>
                  )}
                </div>
                {paciente?.objetivo_texto && (
                  <p className="goal-notes">
                    <strong>Detalhes:</strong> {paciente.objetivo_texto}
                  </p>
                )}
              </div>

              <div className="goal-card morph-card">
                <div className="goal-header">
                  <Moon size={20} color="#6366f1" />
                  <h4>Rotina & Sono</h4>
                </div>
                <div className="routine-row">
                  <div className="routine-item morph-item-subtle">
                    <Sun size={18} color="#f59e0b" />
                    <div>
                      <span className="routine-label">Horário de Acordar</span>
                      <strong className="routine-val">{paciente?.horario_acorda || '07:00'}</strong>
                    </div>
                  </div>
                  <div className="routine-item morph-item-subtle">
                    <Moon size={18} color="#6366f1" />
                    <div>
                      <span className="routine-label">Horário de Dormir</span>
                      <strong className="routine-val">{paciente?.horario_dorme || '23:00'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="goal-card morph-card">
                <div className="goal-header">
                  <Activity size={20} color="#ec4899" />
                  <h4>Atividade Física</h4>
                </div>
                <p style={{ margin: '8px 0', fontSize: '0.92rem', color: '#334155' }}>
                  <strong>Status:</strong> {paciente?.atividade_fisica ? 'Praticante regular' : 'Não pratica ou iniciando'}
                </p>
                {paciente?.atividade_fisica_descricao && (
                  <p className="goal-notes">
                    <strong>Modalidade:</strong> {paciente.atividade_fisica_descricao}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Orientações & Restrições */}
        {activeTab === 'anamnese' && (
          <div className="clinical-section fade-in">
            <div className="clinical-grid">
              <div className="clinical-card morph-card">
                <div className="clinical-header">
                  <AlertTriangle size={18} color="#ef4444" />
                  <h4>Alergias & Restrições Alimentares</h4>
                </div>
                <div className="tag-cloud">
                  {Array.isArray(paciente?.alergias) && paciente.alergias.length > 0 ? (
                    paciente.alergias.map((a, i) => <span key={i} className="danger-tag">{a}</span>)
                  ) : (
                    <span className="safe-tag">Nenhuma alergia alimentar registrada</span>
                  )}
                  {Array.isArray(paciente?.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 && (
                    paciente.restricoes_alimentares.map((r, i) => <span key={i} className="warning-tag">{r}</span>)
                  )}
                </div>
              </div>

              <div className="clinical-card morph-card">
                <div className="clinical-header">
                  <HeartPulse size={18} color="#10b981" />
                  <h4>Medicamentos & Suplementos</h4>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#334155', margin: '6px 0' }}>
                  <strong>Suplementação:</strong> {paciente?.suplementos || 'Conforme orientação do plano'}
                </p>
                <p style={{ fontSize: '0.92rem', color: '#334155', margin: '6px 0' }}>
                  <strong>Medicamentos:</strong> {paciente?.medicamentos || 'Nenhum medicamento contínuo relatado'}
                </p>
              </div>

              {paciente?.observacoes && (
                <div className="clinical-card morph-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="clinical-header">
                    <Info size={18} color="#3b82f6" />
                    <h4>Observações do Nutricionista</h4>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, margin: '8px 0' }}>
                    {paciente.observacoes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
