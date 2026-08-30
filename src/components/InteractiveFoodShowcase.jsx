import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Heart, 
  Dumbbell, 
  Apple, 
  Salad, 
  Activity, 
  Award, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function InteractiveFoodShowcase() {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [hoveredCard, setHoveredCard] = useState(null);

  const categories = [
    { id: 'todos', label: 'Tudo de Vitalidade', icon: <Sparkles size={16} /> },
    { id: 'frutas', label: 'Frutas & Antioxidantes', icon: <Apple size={16} /> },
    { id: 'vegetais', label: 'Verduras & Fibras', icon: <Salad size={16} /> },
    { id: 'pratos', label: 'Pratos Equilibrados', icon: <Flame size={16} /> },
    { id: 'exercicios', label: 'Movimento & Esporte', icon: <Dumbbell size={16} /> }
  ];

  const items = [
    {
      id: 1,
      category: 'frutas',
      title: 'Frutas Vermelhas & Mirtilos',
      subtitle: 'Antioxidantes & Saúde Celular',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
      badge: 'Super Imunidade',
      quote: 'Combatem radicais livres, reduzem o estresse oxidativo e otimizam a cognição.',
      nutrients: ['Vitamina C +++ ', 'Polifenóis', 'Baixo Índice Glicêmico'],
      impactText: 'Prescrição do Nutri: Indispensável na prevenção do envelhecimento precoce celular.',
      color: '#ef4444'
    },
    {
      id: 2,
      category: 'vegetais',
      title: 'Vegetais Verdes Escuros & Folhas',
      subtitle: 'Clorofila, Magnésio & Fibras',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      badge: 'Detox Metabólico',
      quote: 'Ativam enzimas hepáticas, regulam a pressão arterial e nutrem a microbiota intestinal.',
      nutrients: ['Magnésio Quelato', 'Ácido Fólico', 'Fibras Prebióticas'],
      impactText: 'Prescrição do Nutri: A base da pirâmide para equilíbrio hormonal e saciedade.',
      color: '#10b981'
    },
    {
      id: 3,
      category: 'pratos',
      title: 'Bowls Nutritivos & Proteínas Limpas',
      subtitle: 'Equilíbrio Macro e Micronutricional',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      badge: 'Alta Performance',
      quote: 'A proporção ideal entre aminoácidos essenciais, gorduras boas e carboidratos complexos.',
      nutrients: ['Proteínas de Alto VB', 'Ômega 3', 'Energia Sustentável'],
      impactText: 'Prescrição do Nutri: Potencializa a queima de gordura e preserva a massa magra.',
      color: '#f59e0b'
    },
    {
      id: 4,
      category: 'exercicios',
      title: 'Treino de Força & Hipertrofia',
      subtitle: 'Estímulo Muscular & Metabolismo',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      badge: 'Metabolismo Acelerado',
      quote: 'Sem nutrição estratégica, o treino gera desgaste em vez de evolução muscular.',
      nutrients: ['Timing de Nutrientes', 'Recuperação Rápida', 'Densidade Óssea'],
      impactText: 'Prescrição do Nutri: Ajuste fino de calorias e macros para ganhos consistentes.',
      color: '#8b5cf6'
    },
    {
      id: 5,
      category: 'frutas',
      title: 'Cítricos & Frutas Tropicais',
      subtitle: 'Vitamina C & Hidratação Natural',
      image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80',
      badge: 'Vitalidade Diária',
      quote: 'Eleva a absorção de ferro de origem vegetal e revigora o sistema imune.',
      nutrients: ['Vitamina C Pura', 'Bioflavonoides', 'Eletrólitos'],
      impactText: 'Prescrição do Nutri: Estratégico no pós-treino e no desjejum alcalinizante.',
      color: '#f97316'
    },
    {
      id: 6,
      category: 'exercicios',
      title: 'Corrida, Ciclismo & Cardio',
      subtitle: 'Saúde Cardiovascular & Resistência',
      image: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=800&q=80',
      badge: 'Coração Saudável',
      quote: 'A ingestão correta de carboidratos evita a fadiga precoce e preserva a saúde cardíaca.',
      nutrients: ['Estoque de Glicogênio', 'Eletrólitos', 'VO2 Máximo'],
      impactText: 'Prescrição do Nutri: Suporte intra e pós-treino para máxima longevidade.',
      color: '#06b6d4'
    },
    {
      id: 7,
      category: 'vegetais',
      title: 'Abacate, Oleaginosas & Gorduras Boas',
      subtitle: 'Nutrição Cerebral & Hormônios',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
      badge: 'Foco & Hormônios',
      quote: 'Gorduras monoinsaturadas essenciais para a síntese hormonal e proteção das artérias.',
      nutrients: ['Gorduras Boas', 'Vitamina E', 'Glutationa'],
      impactText: 'Prescrição do Nutri: Promove saciedade prolongada e alta clareza mental.',
      color: '#10b981'
    },
    {
      id: 8,
      category: 'exercicios',
      title: 'Yoga, Mobilidade & Bem-Estar',
      subtitle: 'Conexão Mente-Corpo & Postura',
      image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
      badge: 'Equilíbrio & Sono',
      quote: 'A regulação do cortisol através da alimentação transforma a qualidade do seu sono.',
      nutrients: ['Triptofano', 'Fitoterápicos', 'Redução do Cortisol'],
      impactText: 'Prescrição do Nutri: Estratégia alimentar para modulação do estresse e bem-estar.',
      color: '#ec4899'
    }
  ];

  const filteredItems = activeCategory === 'todos' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <section className="food-showcase-section" id="alimentos-interativos">
      <div className="section-header-centered">
        <div className="section-badge-pill morph-pill">
          <Sparkles size={16} className="sparkle-spin" />
          <span>Nutrição Viva & Atividade Física</span>
        </div>
        <h2 className="section-title-gradient">
          A Alquimia da Saúde: Alimentos Funcionais e Movimento
        </h2>
        <p className="section-subtitle-impact">
          Passe o cursor sobre os cards para ver a transformação orgânica de forma e entender como cada nutriente potencializa seu corpo sob orientação de um nutricionista.
        </p>
      </div>

      {/* Categorias Interativas */}
      <div className="categories-filter-bar">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`category-pill-btn morph-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Imagens com Morphing no Hover */}
      <div className="interactive-cards-grid">
        {filteredItems.map(item => {
          const isHovered = hoveredCard === item.id;

          return (
            <div
              key={item.id}
              className={`morph-card-container ${isHovered ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="morph-card-inner">
                {/* Imagem com forma orgânica que muta no hover */}
                <div className="morph-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="morph-img-interactive"
                    loading="lazy"
                  />
                  <div className="morph-image-overlay"></div>
                  
                  {/* Badge de Impacto */}
                  <span className="morph-float-badge">
                    <Zap size={14} />
                    {item.badge}
                  </span>

                  {/* Indicador de Interação */}
                  <div className="hover-shape-indicator">
                    <span>Muta no Hover</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                {/* Conteúdo do Card com Efeito de Expansão */}
                <div className="morph-card-content">
                  <span className="morph-category-tag">{item.subtitle}</span>
                  <h3 className="morph-card-title">{item.title}</h3>
                  <p className="morph-card-quote">"{item.quote}"</p>

                  {/* Tags Nutricionais */}
                  <div className="morph-nutrients-list">
                    {item.nutrients.map((nutr, idx) => (
                      <span key={idx} className="nutrient-chip morph-chip">
                        <CheckCircle2 size={12} color="#10b981" />
                        {nutr}
                      </span>
                    ))}
                  </div>

                  {/* Prescrição e Impacto do Nutricionista */}
                  <div className="morph-prescricao-box">
                    <ShieldCheck size={16} className="prescricao-icon" />
                    <span>{item.impactText}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner de Impacto Central */}
      <div className="impact-cta-banner morph-banner">
        <div className="impact-banner-decor-blob"></div>
        <div className="impact-banner-content">
          <div className="impact-icon-circle morph-circle">
            <Heart size={32} color="#ffffff" />
          </div>
          <div className="impact-text-wrapper">
            <h3 className="impact-headline">
              "Você não precisa de restrições radicais, você precisa de um plano que respeite sua biologia."
            </h3>
            <p className="impact-lead">
              Mais de 85% das pessoas que tentam dietas por conta própria desistem no primeiro mês. O acompanhamento com um nutricionista garante adesão, saúde metabólica e resultados permanentes.
            </p>
          </div>
          <div className="impact-stats-cluster">
            <div className="stat-box morph-stat">
              <span className="stat-number">+85%</span>
              <span className="stat-desc">Adesão com Nutricionista</span>
            </div>
            <div className="stat-box morph-stat">
              <span className="stat-number">3x</span>
              <span className="stat-desc">Mais Energia no Treino</span>
            </div>
            <div className="stat-box morph-stat">
              <span className="stat-number">100%</span>
              <span className="stat-desc">Individualizado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
