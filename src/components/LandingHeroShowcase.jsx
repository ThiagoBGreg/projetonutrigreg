import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import InteractiveFoodShowcase from './InteractiveFoodShowcase';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { 
  Sparkles, 
  HeartHandshake, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Award, 
  Zap, 
  Check, 
  ChevronRight,
  ArrowRight,
  Flame,
  Apple,
  Dumbbell,
  Stethoscope,
  Smile,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';

export default function LandingHeroShowcase({ 
  onLoginSuccess, 
  onRegisterSuccess, 
  initialAuthMode = 'login' 
}) {
  const [authMode, setAuthMode] = useState(initialAuthMode); // 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState('beneficios'); // 'beneficios' | 'motivos' | 'ciencia'

  const impactBanners = [
    {
      icon: <Stethoscope size={28} color="#10b981" />,
      title: 'Por Que Ter um Nutricionista Presente?',
      text: 'Cada corpo possui um código genético, microbiota e rotina únicos. Um nutricionista decifra esses sinais para criar um protocolo seguro, evitando carências e acelerando resultados sem radicalismos.',
      highlight: 'Acompanhamento que Salva Vidas'
    },
    {
      icon: <Flame size={28} color="#f59e0b" />,
      title: 'Alimentação Como Combustível & Performance',
      text: 'Não existe treino milagroso sem nutrição compatível. A ingestão calculada de macro e micronutrientes eleva em até 300% o rendimento atlético, acelera a recuperação e potencializa a hipertrofia.',
      highlight: 'Energia Limpa e Constante'
    },
    {
      icon: <ShieldCheck size={28} color="#06b6d4" />,
      title: 'Prevenção Primária de Doenças Crônicas',
      text: 'Hipertensão, diabetes tipo 2, dislipidemias e esteatose hepática podem ser prevenidas ou revertidas com estratégias alimentares fundamentadas pela ciência nutricional.',
      highlight: 'Saúde para os Próximos 40 Anos'
    },
    {
      icon: <Smile size={28} color="#ec4899" />,
      title: 'Relação Leve e Prazerosa com a Comida',
      text: 'Diga adeus ao efeito sanfona e à culpa ao comer. O nutricionista reconstrói a relação com os alimentos, permitindo eventos sociais e pratos favoritos com consciência e controle.',
      highlight: 'Liberdade sem Culpa'
    }
  ];

  return (
    <div className="landing-master-container">
      {/* Barra de Topo com Logo e Acesso Rápido */}
      <header className="landing-top-nav">
        <div className="landing-nav-inner">
          <HeaderLogo />
          
          <div className="landing-nav-actions">
            <a href="#alimentos-interativos" className="landing-nav-link morph-link">
              <Apple size={16} />
              <span>Alimentos & Atividade</span>
            </a>
            <a href="#por-que-nutricionista" className="landing-nav-link morph-link">
              <Stethoscope size={16} />
              <span>Importância do Nutri</span>
            </a>
            <button 
              type="button" 
              className="btn-nav-auth morph-btn"
              onClick={() => {
                setAuthMode('login');
                const authEl = document.getElementById('auth-portal-section');
                authEl?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Acessar Consultório</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION DE ALTO IMPACTO */}
      <section className="hero-impact-section">
        <div className="hero-glow-blob blob-1"></div>
        <div className="hero-glow-blob blob-2"></div>
        <div className="hero-glow-blob blob-3"></div>

        <div className="hero-container-grid">
          {/* Lado Esquerdo: Mensagem Forte e Chamada */}
          <div className="hero-text-content">
            <div className="hero-badge-pill morph-pill">
              <Sparkles size={16} className="sparkle-spin" />
              <span>Saúde, Performance & Longevidade</span>
            </div>

            <h1 className="hero-main-title">
              A Sua Melhor Versão Começa com a <span className="text-highlight-gradient">Nutrição Certa</span>
            </h1>

            <p className="hero-lead-text">
              Ter um nutricionista presente na sua rotina não é apenas receber uma dieta — é ter um <strong>mentor científico</strong> que alinha seus exames, seus treinos físicos e seus hábitos para você viver com energia máxima, foco e longevidade.
            </p>

            <div className="hero-pillars-row">
              <div className="hero-pillar-chip morph-chip">
                <Apple size={16} color="#10b981" />
                <span>Frutas & Alimentos Vivos</span>
              </div>
              <div className="hero-pillar-chip morph-chip">
                <Dumbbell size={16} color="#f59e0b" />
                <span>Atividade Física Consciente</span>
              </div>
              <div className="hero-pillar-chip morph-chip">
                <HeartHandshake size={16} color="#06b6d4" />
                <span>Acompanhamento Pessoal</span>
              </div>
            </div>

            {/* Micro Banners de Estatísticas */}
            <div className="hero-stats-band">
              <div className="hero-stat-card morph-stat">
                <span className="hero-stat-val">100%</span>
                <span className="hero-stat-sub">Ciência Nutricional</span>
              </div>
              <div className="hero-stat-card morph-stat">
                <span className="hero-stat-val">+3x</span>
                <span className="hero-stat-sub">Mais Disposição</span>
              </div>
              <div className="hero-stat-card morph-stat">
                <span className="hero-stat-val">-70%</span>
                <span className="hero-stat-sub">Risco de Recaídas</span>
              </div>
            </div>

            <div className="hero-cta-buttons">
              <button
                type="button"
                className="btn-hero-primary morph-btn"
                onClick={() => {
                  setAuthMode('login');
                  document.getElementById('auth-portal-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Acessar Painel Clínico</span>
                <ChevronRight size={18} />
              </button>
              <a href="#alimentos-interativos" className="btn-hero-secondary morph-btn">
                <span>Ver Alimentos & Treinos</span>
                <Sparkles size={16} />
              </a>
            </div>
          </div>

          {/* Lado Direito: Grid de Fotos Flutuantes com Efeito Morphing */}
          <div className="hero-visual-collage">
            {/* Foto 1: Prato / Salada Colorida */}
            <div className="floating-photo-card card-pos-1 morph-shape">
              <img 
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80" 
                alt="Vegetais frescos e salada" 
                className="floating-img"
              />
              <div className="photo-badge">
                <Apple size={14} color="#10b981" />
                <span>Saladas & Fibras</span>
              </div>
            </div>

            {/* Foto 2: Atleta / Exercício Físico */}
            <div className="floating-photo-card card-pos-2 morph-shape">
              <img 
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80" 
                alt="Pessoa praticando atividade física com vitalidade" 
                className="floating-img"
              />
              <div className="photo-badge badge-accent">
                <Dumbbell size={14} color="#f59e0b" />
                <span>Atividade & Força</span>
              </div>
            </div>

            {/* Foto 3: Frutas e Cores */}
            <div className="floating-photo-card card-pos-3 morph-shape">
              <img 
                src="https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80" 
                alt="Frutas frescas variadas" 
                className="floating-img"
              />
              <div className="photo-badge badge-cyan">
                <Sparkles size={14} color="#06b6d4" />
                <span>Antioxidantes Vivos</span>
              </div>
            </div>

            {/* Foto 4: Refeição Saudável & Equilíbrio */}
            <div className="floating-photo-card card-pos-4 morph-shape">
              <img 
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80" 
                alt="Alimentação saudável e nutritiva" 
                className="floating-img"
              />
              <div className="photo-badge badge-pink">
                <HeartHandshake size={14} color="#ec4899" />
                <span>Estilo de Vida</span>
              </div>
            </div>

            {/* Card Central Flutuante com Frase Marcante */}
            <div className="hero-quote-floating-bubble morph-bubble">
              <Stethoscope size={20} color="#10b981" />
              <p>"Seu corpo é o único lugar que você tem para viver. Cuide da sua nutrição."</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: POR QUE UM NUTRICIONISTA É INDISPENSÁVEL */}
      <section className="why-nutri-section" id="por-que-nutricionista">
        <div className="section-header-centered">
          <div className="section-badge-pill morph-pill">
            <Award size={16} />
            <span>Ciência, Cuidado & Resultados</span>
          </div>
          <h2 className="section-title-gradient">
            Por Que a Presença de um Nutricionista Muda Sua Vida?
          </h2>
          <p className="section-subtitle-impact">
            A alimentação errada mina sua energia e compromete seu futuro. Veja como o acompanhamento clínico transforma sua saúde em 4 pilares:
          </p>
        </div>

        <div className="impact-banners-grid">
          {impactBanners.map((banner, idx) => (
            <div key={idx} className="impact-feature-card morph-feature">
              <div className="feature-icon-wrapper morph-circle">
                {banner.icon}
              </div>
              <span className="feature-highlight-tag">{banner.highlight}</span>
              <h3 className="feature-card-title">{banner.title}</h3>
              <p className="feature-card-text">{banner.text}</p>
              
              <div className="feature-card-footer">
                <div className="feature-decor-line"></div>
                <span className="feature-footer-cta">Impacto Comprovado</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALERIA E CATÁLOGO INTERATIVO DE ALIMENTOS & EXERCÍCIOS */}
      <InteractiveFoodShowcase />

      {/* SEÇÃO: PORTAL DE ACESSO DO PROFISSIONAL / PACIENTE */}
      <section className="auth-portal-section" id="auth-portal-section">
        <div className="auth-portal-background-mesh"></div>

        <div className="auth-portal-grid-wrapper">
          {/* Lado Esquerdo do Card de Acesso: Banner Informativo */}
          <div className="auth-portal-promo-panel morph-shape">
            <div className="promo-badge">
              <Sparkles size={14} />
              <span>Área do Consultório</span>
            </div>

            <h3 className="promo-title">
              Gestão Clínica de Alta Precisão & Cuidado Humanizado
            </h3>

            <p className="promo-desc">
              Prescreva planos alimentares, monitore o progresso dos pacientes, registre anamneses e impulsione vidas através do sistema <strong>Nutri Rodrigues</strong>.
            </p>

            <ul className="promo-features-list">
              <li>
                <div className="promo-check morph-check">
                  <Check size={14} />
                </div>
                <span>Cálculo Automático de IMC, Metas e Necessidades Calóricas</span>
              </li>
              <li>
                <div className="promo-check morph-check">
                  <Check size={14} />
                </div>
                <span>Histórico Completo de Consultas e Monitoramento de Retornos</span>
              </li>
              <li>
                <div className="promo-check morph-check">
                  <Check size={14} />
                </div>
                <span>Acesso Seguro com Banco de Dados em Tempo Real</span>
              </li>
            </ul>

            <div className="promo-quote-card morph-card-mini">
              <p>"Nutrir bem é o maior ato de amor próprio e longevidade que alguém pode praticar."</p>
            </div>
          </div>

          {/* Lado Direito: Formulário Dinâmico de Autenticação */}
          <div className="auth-portal-form-container">
            {/* Tabs para alternar entre Login e Cadastro */}
            <div className="auth-tab-switcher">
              <button
                type="button"
                className={`auth-tab-btn morph-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                <span>Entrar</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn morph-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                <span>Criar Conta</span>
              </button>
            </div>

            <div className="auth-form-card-integrated morph-shape">
              {authMode === 'register' ? (
                <RegisterScreen
                  onNavigateLogin={() => setAuthMode('login')}
                  onRegisterSuccess={onRegisterSuccess}
                  isEmbedded={true}
                />
              ) : authMode === 'forgot' ? (
                <ForgotPasswordScreen
                  onNavigateLogin={() => setAuthMode('login')}
                  isEmbedded={true}
                />
              ) : (
                <LoginScreen
                  onNavigateRegister={() => setAuthMode('register')}
                  onNavigateForgotPassword={() => setAuthMode('forgot')}
                  onLoginSuccess={onLoginSuccess}
                  isEmbedded={true}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER MODERNO */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-info">
            <HeaderLogo />
            <p className="footer-slogan">
              Nutrição baseada em evidências, alimentos de verdade, movimento diário e transformação de vidas.
            </p>
          </div>
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} Nutri Rodrigues. Todos os direitos reservados.</p>
            <span className="footer-dev-tag">Plataforma Clínica & Portal do Paciente</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
