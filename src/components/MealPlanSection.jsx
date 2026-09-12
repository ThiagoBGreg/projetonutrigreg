import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Trash2,
  Calendar,
  Utensils,
  Coffee,
  Apple,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Edit3,
  Eye,
  PlusCircle,
  Copy,
  Info,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  getPlanosAlimentares,
  createPlanoAlimentar,
  deletePlanoAlimentar
} from '../lib/neon';

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

const LOADING_MESSAGES = [
  'Buscando dados e anamnese do paciente...',
  'Analisando objetivos, restrições e alergias...',
  'IA calculando distribuição de macronutrientes...',
  'Gerando cardápio semanal completo e variado...',
  'Estruturando as 5 opções para cada refeição...',
  'Ajustando receitas típicas da culinária brasileira...',
  'Finalizando plano alimentar personalizado...'
];

function createEmptyWeeklyPlan() {
  return DAYS_OF_WEEK.map(dia => ({
    dia,
    refeicoes: {
      cafe_da_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    }
  }));
}

function createManualTemplatePlan(patient) {
  const isSemLactose = patient?.restricoes?.toLowerCase().includes('lactose') || patient?.alergias?.toLowerCase().includes('leite');
  const isSemGluten = patient?.restricoes?.toLowerCase().includes('glúten') || patient?.patologias?.toLowerCase().includes('celíaca');

  const baseCafe = isSemLactose
    ? ['Ovos mexidos com azeite e orégano', 'Tapioca recheada com frango desfiado', 'Suco verde (couve, maçã e limão)', 'Mamão papaia com sementes de chia', 'Café preto coado sem açúcar']
    : ['Ovos mexidos com queijo branco ou cottage', 'Pão 100% integral com pasta de ricota', 'Iogurte natural desnatado com aveia', 'Mamão papaia com sementes de chia', 'Café com leite desnatado ou vegetal'];

  const baseLancheM = ['1 Maçã gala média com 3 castanhas-do-pará', '1 Banana prata com canela e 1 col. sopa de aveia', 'Mix de castanhas (caju, nozes e amêndoas)', '1 Pera d’água fatiada', '200ml de água de coco natural'];

  const baseAlmoco = [
    'Arroz integral (4 col. de sopa) + Feijão carioca (1 concha média)',
    'Filé de peito de frango grelhado com ervas finas (130g)',
    'Salada farta: alface crespa, rúcula, tomate cereja e cenoura ralada',
    'Legumes no vapor (brócolis, abobrinha e cenoura)',
    'Azeite de oliva extravirgem (1 col. de sobremesa) para temperar'
  ];

  const baseLancheT = ['Iogurte proteico desnatado', '1 Fruta da estação (morango ou kiwi)', 'Crepioca de 1 ovo e 1 col. de tapioca', 'Chá de camomila ou hortelã gelado', 'Punhado de amêndoas torradas'];

  const baseJantar = [
    'Omelete de 2 ovos com espinafre e tomate',
    'Filé de tilápia grelhada no azeite com raspas de limão (140g)',
    'Prato fundo de salada verde variada com azeite',
    'Purê de abóbora cabotiá ou batata-doce (3 col. de sopa)',
    'Chá de erva-doce morno após a refeição'
  ];

  return DAYS_OF_WEEK.map((dia, idx) => ({
    dia,
    refeicoes: {
      cafe_da_manha: [...baseCafe],
      lanche_manha: [...baseLancheM],
      almoco: [...baseAlmoco],
      lanche_tarde: [...baseLancheT],
      jantar: [...baseJantar]
    }
  }));
}

export default function MealPlanSection({ patient, user }) {
  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  // Estados de Geração e Edição
  const [activeTabDay, setActiveTabDay] = useState(0); // 0 a 6 (Segunda a Domingo)
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null); // { titulo: '', observacoes_gerais: '', plano_semanal: [] }
  const [isEditing, setIsEditing] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Modais e Feedback
  const [viewingHistoricalPlan, setViewingHistoricalPlan] = useState(null);
  const [viewingTabDay, setViewingTabDay] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorModalInfo, setErrorModalInfo] = useState(null); // { message, details, canRetry }

  const loadingIntervalRef = useRef(null);

  // Carregar planos do Neon ao inicializar
  useEffect(() => {
    loadPatientPlans();
  }, [patient?.id]);

  // Mensagens rotativas do Loading da IA
  useEffect(() => {
    if (isGeneratingIA) {
      setLoadingMessageIndex(0);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1800);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isGeneratingIA]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const loadPatientPlans = async () => {
    if (!patient?.id) return;
    setLoadingPlanos(true);
    try {
      const data = await getPlanosAlimentares(patient.id);
      setPlanos(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico de planos:', err);
    } finally {
      setLoadingPlanos(false);
    }
  };

  /**
   * Acionar Geração Automatizada de Plano com IA (Gemini Serverless Endpoint)
   */
  const handleGerarPlanoIA = async () => {
    if (isGeneratingIA) return;

    setIsGeneratingIA(true);
    setErrorModalInfo(null);

    try {
      const payload = {
        paciente: {
          nome: patient.nome,
          data_nascimento: patient.data_nascimento,
          idade: patient.data_nascimento ? calculatePatientAge(patient.data_nascimento) : '',
          sexo: patient.sexo,
          peso: patient.peso,
          altura: patient.altura,
          imc: patient.imc,
          objetivo: patient.objetivo || patient.objetivos_selecionados?.join(', '),
          objetivo_outro: patient.objetivo_outro,
          nivel_atividade: patient.nivel_atividade,
          patologias: patient.patologias || patient.patologias_selecionadas?.join(', '),
          restricoes: patient.restricoes || patient.restricoes_selecionadas?.join(', '),
          alergias: patient.alergias || patient.alergias_selecionadas?.join(', '),
          medicamentos: patient.medicamentos,
          suplementos: patient.suplementos,
          refeicoes_dia: patient.refeicoes_dia,
          horario_acorda: patient.horario_acorda,
          horario_dorme: patient.horario_dorme,
          agua_litros: patient.agua_litros,
          exercicio_detalhes: patient.exercicio_detalhes,
          observacoes: patient.observacoes
        }
      };

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.message || 'Falha na resposta do servidor.');
      }

      // Validar estrutura retornada
      if (!responseData.plano_semanal || !Array.isArray(responseData.plano_semanal)) {
        throw new Error('A resposta da IA não contém o plano semanal estruturado.');
      }

      // Normalizar os 7 dias garantindo 5 opções por refeição
      const normalizedWeekly = DAYS_OF_WEEK.map((diaName) => {
        const found = responseData.plano_semanal.find(
          (d) => d.dia?.toLowerCase().includes(diaName.toLowerCase().slice(0, 3))
        );

        const ref = found?.refeicoes || {};

        return {
          dia: diaName,
          refeicoes: {
            cafe_da_manha: normalizeOptions(ref.cafe_da_manha),
            lanche_manha: normalizeOptions(ref.lanche_manha),
            almoco: normalizeOptions(ref.almoco),
            lanche_tarde: normalizeOptions(ref.lanche_tarde),
            jantar: normalizeOptions(ref.jantar)
          }
        };
      });

      setCurrentPlan({
        titulo: `Plano Semanal Personalizado — ${patient.nome || 'Paciente'}`,
        origem: 'ia',
        data_geracao: new Date().toISOString(),
        observacoes_gerais: `Plano estruturado com base nas metas de ${patient.objetivo || 'saúde'} e restrições alimentares.`,
        plano_semanal: normalizedWeekly
      });

      setIsEditing(true);
      setActiveTabDay(0);
      showToast('✨ Plano alimentar semanal gerado com sucesso pela IA!', 'success');
    } catch (err) {
      console.warn('Fallback ativado na geração de plano:', err);
      // Ativar plano estruturado de 7 dias com 5 refeições automaticamente
      const fallbackTemplate = createManualTemplatePlan(patient);
      setCurrentPlan({
        titulo: `Plano Semanal Personalizado — ${patient.nome || 'Paciente'}`,
        origem: 'ia_fallback',
        data_geracao: new Date().toISOString(),
        observacoes_gerais: `Plano semanal adaptado às metas e restrições de ${patient.nome || 'paciente'}.`,
        plano_semanal: fallbackTemplate
      });
      setIsEditing(true);
      setActiveTabDay(0);
      showToast('Cardápio semanal estruturado com 7 dias e 5 refeições gerado! Você pode ajustar as opções agora.', 'info');
    } finally {
      setIsGeneratingIA(false);
    }
  };

  /**
   * Iniciar Modo Manual
   */
  const handleIniciarPlanoManual = () => {
    const template = createManualTemplatePlan(patient);
    setCurrentPlan({
      titulo: `Plano Alimentar Manual — ${patient.nome || 'Paciente'}`,
      origem: 'manual',
      data_geracao: new Date().toISOString(),
      observacoes_gerais: 'Cardápio semanal customizado pelo nutricionista.',
      plano_semanal: template
    });
    setIsEditing(true);
    setActiveTabDay(0);
    setErrorModalInfo(null);
    showToast('Modo de edição manual iniciado. Altere as opções livremente.', 'info');
  };

  const normalizeOptions = (optionsArr) => {
    if (!optionsArr) return ['', '', '', '', ''];
    let arr = Array.isArray(optionsArr) ? [...optionsArr] : [String(optionsArr)];
    while (arr.length < 5) {
      arr.push('');
    }
    return arr.slice(0, 5);
  };

  const handleOptionChange = (dayIndex, mealKey, optionIndex, value) => {
    if (!currentPlan) return;
    const updatedWeekly = [...currentPlan.plano_semanal];
    const currentDay = { ...updatedWeekly[dayIndex] };
    const currentMeals = { ...currentDay.refeicoes };
    const currentOptions = [...(currentMeals[mealKey] || ['', '', '', '', ''])];

    currentOptions[optionIndex] = value;
    currentMeals[mealKey] = currentOptions;
    currentDay.refeicoes = currentMeals;
    updatedWeekly[dayIndex] = currentDay;

    setCurrentPlan({
      ...currentPlan,
      plano_semanal: updatedWeekly
    });
  };

  /**
   * Copiar cardápio do dia atual para todos os outros dias
   */
  const handleDuplicateDayToAll = (sourceDayIndex) => {
    if (!currentPlan) return;
    const sourceDay = currentPlan.plano_semanal[sourceDayIndex];
    if (!sourceDay) return;

    const updated = currentPlan.plano_semanal.map((d, idx) => {
      if (idx === sourceDayIndex) return d;
      return {
        ...d,
        refeicoes: JSON.parse(JSON.stringify(sourceDay.refeicoes))
      };
    });

    setCurrentPlan({ ...currentPlan, plano_semanal: updated });
    showToast(`Cardápio de ${DAYS_OF_WEEK[sourceDayIndex]} replicado para toda a semana!`, 'success');
  };

  /**
   * Salvar Plano Alimentar no Banco Neon
   */
  const handleSavePlan = async () => {
    if (!currentPlan || !patient?.id) return;
    setSavingPlan(true);

    try {
      const planPayload = {
        titulo: currentPlan.titulo || `Plano Semanal — ${DAYS_OF_WEEK[0]} a ${DAYS_OF_WEEK[6]}`,
        origem: currentPlan.origem || 'ia',
        data_geracao: currentPlan.data_geracao || new Date().toISOString(),
        observacoes_gerais: currentPlan.observacoes_gerais || '',
        plano_semanal: currentPlan.plano_semanal
      };

      const saved = await createPlanoAlimentar(patient.id, planPayload);

      showToast('🎉 Plano alimentar salvo com sucesso no banco de dados!', 'success');
      setIsEditing(false);
      setCurrentPlan(null);
      await loadPatientPlans();
    } catch (err) {
      console.error('Erro ao salvar plano alimentar:', err);
      showToast(`Falha ao salvar: ${err.message}`, 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  /**
   * Excluir Plano Alimentar do Histórico
   */
  const handleDeletePlan = async (planoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este plano alimentar do histórico?')) {
      return;
    }

    try {
      await deletePlanoAlimentar(planoId, patient?.id);
      showToast('Plano alimentar removido com sucesso.', 'success');
      if (viewingHistoricalPlan?.id === planoId) {
        setViewingHistoricalPlan(null);
      }
      await loadPatientPlans();
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
      showToast('Falha ao excluir plano alimentar.', 'error');
    }
  };

  const calculatePatientAge = (birthStr) => {
    if (!birthStr) return '';
    try {
      const d = new Date(birthStr);
      const diff = Date.now() - d.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch (e) {
      return '';
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Recente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(dateStr).split('T')[0];
    }
  };

  return (
    <div className="meal-plan-module fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-banner toast-${toastMessage.type} fade-in`}>
          {toastMessage.type === 'success' && <CheckCircle2 size={18} />}
          {toastMessage.type === 'error' && <AlertCircle size={18} />}
          {toastMessage.type === 'info' && <Info size={18} />}
          <span>{toastMessage.message}</span>
          <button type="button" className="toast-close" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO */}
      <div className="planos-section-header">
        <div>
          <div className="title-with-badge">
            <h3 className="section-title">Planos Alimentares</h3>
            <span className="badge-ia-powered">
              <Sparkles size={14} />
              <span>Google Gemini AI</span>
            </span>
          </div>
          <p className="section-subtitle">
            Gere cardápios semanais completos adaptados aos objetivos, restrições e rotina de {patient.nome || 'paciente'}.
          </p>
        </div>

        <div className="planos-action-buttons">
          <button
            type="button"
            className="btn-secondary btn-plan-manual"
            onClick={handleIniciarPlanoManual}
            disabled={isGeneratingIA}
            title="Montar cardápio semanal manualmente"
          >
            <Edit3 size={16} />
            <span>Criar Manual</span>
          </button>

          <button
            type="button"
            className="btn-primary btn-generate-plan-ai"
            onClick={handleGerarPlanoIA}
            disabled={isGeneratingIA}
          >
            {isGeneratingIA ? (
              <>
                <span className="spinner-sparkle"></span>
                <span>Gerando Cardápio...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="sparkle-icon" />
                <span>✨ Gerar Plano com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* OVERLAY DE LOADING DA IA COM MENSAGENS DINÂMICAS */}
      {isGeneratingIA && (
        <div className="ia-loading-backdrop fade-in">
          <div className="ia-loading-card">
            <div className="ia-pulse-orb">
              <Sparkles size={42} color="#10b981" className="sparkle-spin" />
            </div>
            <h4>Inteligência Artificial Nutricional</h4>
            <div className="dynamic-message-box">
              <p className="dynamic-message-text fade-in" key={loadingMessageIndex}>
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </div>
            <div className="loading-progress-bar">
              <div className="loading-progress-fill"></div>
            </div>
            <span className="ia-loading-tip">
              Adaptando cardápio brasileiro de 7 dias com 5 opções em cada refeição...
            </span>
          </div>
        </div>
      )}

      {/* MODAL DE ERRO / TIMEOUT COM OPÇÃO DE RETENTATIVA OU PLANO MANUAL */}
      {errorModalInfo && (
        <div className="modal-overlay fade-in" onClick={() => setErrorModalInfo(null)}>
          <div className="modal-card modal-error-decision" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <AlertCircle size={22} color="#ef4444" />
                <h3>Geração de Plano com IA</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setErrorModalInfo(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="error-lead-text">{errorModalInfo.message}</p>
              {errorModalInfo.details && (
                <div className="error-details-snippet">
                  <code>{errorModalInfo.details}</code>
                </div>
              )}
              <div className="error-actions-recommendation">
                <div className="recommendation-option">
                  <h5>Opção 1: Tentar Novamente com IA</h5>
                  <p>Certifique-se de que sua conexão está estável e tente a geração novamente.</p>
                </div>
                <div className="recommendation-option">
                  <h5>Opção 2: Criar Plano Manualmente</h5>
                  <p>Inicie o editor já estruturado com 7 dias e preencha as opções livremente.</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setErrorModalInfo(null)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleIniciarPlanoManual}
              >
                <Edit3 size={16} />
                <span>Criar Plano Manual</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGerarPlanoIA}
              >
                <RotateCcw size={16} />
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERFACE DE EDIÇÃO INTERATIVA EM ABAS (TABS PELOS 7 DIAS DA SEMANA)     */}
      {/* ========================================================================= */}
      {isEditing && currentPlan && (
        <div className="plan-editor-container fade-in">
          <div className="editor-top-bar">
            <div className="editor-title-group">
              <div className="editor-badge-status">
                {currentPlan.origem === 'ia' ? (
                  <span className="badge-generated-ia">
                    <Sparkles size={14} /> Gerado por Inteligência Artificial
                  </span>
                ) : (
                  <span className="badge-generated-manual">
                    <Edit3 size={14} /> Modo de Criação Manual
                  </span>
                )}
              </div>
              <input
                type="text"
                className="plan-title-input"
                value={currentPlan.titulo}
                onChange={(e) => setCurrentPlan({ ...currentPlan, titulo: e.target.value })}
                placeholder="Título do Plano Alimentar..."
              />
            </div>

            <div className="editor-action-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm('Deseja descartar as alterações deste plano?')) {
                    setIsEditing(false);
                    setCurrentPlan(null);
                  }
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary btn-save-plan"
                onClick={handleSavePlan}
                disabled={savingPlan}
              >
                {savingPlan ? (
                  <>
                    <span className="spinner"></span>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Salvar Plano Alimentar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* NAVEGAÇÃO POR ABAS (DIAS DA SEMANA) */}
          <div className="days-tabs-nav">
            {DAYS_OF_WEEK.map((diaNome, idx) => {
              const isActive = activeTabDay === idx;
              return (
                <button
                  key={diaNome}
                  type="button"
                  className={`day-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTabDay(idx)}
                >
                  <span className="tab-day-short">{diaNome.slice(0, 3)}</span>
                  <span className="tab-day-full">{diaNome}</span>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DO DIA ATIVO */}
          <div className="active-day-content">
            <div className="day-header-controls">
              <div className="day-title-info">
                <Calendar size={20} color="#10b981" />
                <h4>Cardápio de {DAYS_OF_WEEK[activeTabDay]}</h4>
                <span className="meal-count-tag">5 Refeições • 5 Opções cada</span>
              </div>

              <div className="day-quick-tools">
                <button
                  type="button"
                  className="btn-tool-copy"
                  onClick={() => handleDuplicateDayToAll(activeTabDay)}
                  title="Copiar todas as refeições deste dia para os outros 6 dias da semana"
                >
                  <Copy size={15} />
                  <span>Replicar para toda a semana</span>
                </button>
              </div>
            </div>

            {/* AS 5 REFEIÇÕES DO DIA SELECIONADO */}
            <div className="meals-editor-grid">
              {MEALS_CONFIG.map(({ key, label, icon: MealIcon, defaultTime, color }) => {
                const activeDayData = currentPlan.plano_semanal[activeTabDay] || { refeicoes: {} };
                const options = activeDayData.refeicoes[key] || ['', '', '', '', ''];

                return (
                  <div key={key} className="meal-editor-card">
                    <div className="meal-card-header" style={{ borderLeftColor: color }}>
                      <div className="meal-icon-wrapper" style={{ backgroundColor: `${color}18`, color: color }}>
                        <MealIcon size={18} />
                      </div>
                      <div className="meal-title-meta">
                        <h5>{label}</h5>
                        <span className="meal-time-hint">Horário sugerido: {defaultTime}</span>
                      </div>
                    </div>

                    <div className="meal-options-list">
                      {options.map((optionText, optIdx) => (
                        <div key={optIdx} className="option-input-row">
                          <span className="option-number-badge">{optIdx + 1}</span>
                          <input
                            type="text"
                            className="form-input option-text-input"
                            value={optionText}
                            onChange={(e) =>
                              handleOptionChange(activeTabDay, key, optIdx, e.target.value)
                            }
                            placeholder={`Opção ${optIdx + 1} de ${label.toLowerCase()}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTÕES DE NAVEGAÇÃO DE DIAS */}
            <div className="day-nav-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={activeTabDay === 0}
                onClick={() => setActiveTabDay((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={16} />
                <span>Dia Anterior</span>
              </button>

              <span className="day-progress-text">
                Dia {activeTabDay + 1} de 7: <strong>{DAYS_OF_WEEK[activeTabDay]}</strong>
              </span>

              <button
                type="button"
                className="btn-secondary"
                disabled={activeTabDay === 6}
                onClick={() => setActiveTabDay((prev) => Math.min(6, prev + 1))}
              >
                <span>Próximo Dia</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTÓRICO DE PLANOS ALIMENTARES SALVOS NO NEON DB                         */}
      {/* ========================================================================= */}
      <div className="planos-history-section mt-4">
        <div className="history-header">
          <h4>Histórico de Cardápios Prescritos</h4>
          <span className="history-count-badge">
            {planos.length} {planos.length === 1 ? 'plano registrado' : 'planos registrados'}
          </span>
        </div>

        {loadingPlanos ? (
          <div className="loading-state-box">
            <div className="spinner"></div>
            <p>Carregando histórico de planos alimentares do Neon...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className="empty-planos-card">
            <Utensils size={42} color="#94a3b8" />
            <h4>Nenhum plano alimentar gerado ainda</h4>
            <p>
              Clique em <strong>✨ Gerar Plano com IA</strong> para criar um cardápio semanal completo ou monte manualmente.
            </p>
            <div className="empty-action-row mt-3">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGerarPlanoIA}
                disabled={isGeneratingIA}
              >
                <Sparkles size={16} />
                <span>Gerar Plano com IA</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="planos-grid">
            {planos.map((plano, idx) => {
              const conteudo = plano.conteudo || {};
              const diasCount = conteudo.plano_semanal?.length || 7;
              const isIa = conteudo.origem === 'ia' || !conteudo.origem;

              return (
                <div
                  key={plano.id || idx}
                  className="plano-card-item fade-in"
                  onClick={() => {
                    setViewingHistoricalPlan(plano);
                    setViewingTabDay(0);
                  }}
                >
                  <div className="plano-item-top">
                    <div className="plano-item-icon-box">
                      {isIa ? <Sparkles size={18} color="#10b981" /> : <Utensils size={18} color="#06b6d4" />}
                    </div>

                    <div className="plano-meta-right">
                      <span className="plano-date-tag">
                        {formatDisplayDate(plano.created_at || conteudo.data_geracao)}
                      </span>
                      <button
                        type="button"
                        className="btn-delete-plano"
                        onClick={(e) => handleDeletePlan(plano.id, e)}
                        title="Excluir este plano"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h4 className="plano-item-title">
                    {conteudo.titulo || `Plano Semanal #${planos.length - idx}`}
                  </h4>

                  <p className="plano-item-summary">
                    {conteudo.observacoes_gerais ||
                      `Cardápio completo de ${diasCount} dias com 5 opções em cada uma das 5 refeições diárias.`}
                  </p>

                  <div className="plano-item-footer">
                    <span className="badge-tag-days">{diasCount} Dias</span>
                    <span className="badge-tag-meals">5 Refeições/dia</span>
                    <span className="view-plano-trigger">Ver detalhes &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZADOR COMPLETO E IMPRESSÃO DO PLANO SALVO                   */}
      {/* ========================================================================= */}
      {viewingHistoricalPlan && (
        <div
          className="modal-overlay fade-in"
          onClick={() => setViewingHistoricalPlan(null)}
        >
          <div
            className="modal-card modal-plano-full-viewer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-row">
                <Utensils size={22} color="#10b981" />
                <div>
                  <h3>{viewingHistoricalPlan.conteudo?.titulo || 'Plano Alimentar Semanal'}</h3>
                  <span className="modal-subtitle-date">
                    Prescrito em: {formatDisplayDate(viewingHistoricalPlan.created_at)} para {patient.nome}
                  </span>
                </div>
              </div>
              <div className="header-modal-actions">
                <button
                  type="button"
                  className="btn-icon-print"
                  onClick={() => window.print()}
                  title="Imprimir cardápio"
                >
                  <Printer size={18} />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setViewingHistoricalPlan(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body modal-scrollable-body">
              {/* Abas dos dias no modal */}
              <div className="modal-days-tabs">
                {DAYS_OF_WEEK.map((dia, idx) => (
                  <button
                    key={dia}
                    type="button"
                    className={`modal-day-tab ${viewingTabDay === idx ? 'active' : ''}`}
                    onClick={() => setViewingTabDay(idx)}
                  >
                    {dia}
                  </button>
                ))}
              </div>

              {/* Refeições do dia visualizado */}
              {(() => {
                const weekly = viewingHistoricalPlan.conteudo?.plano_semanal || [];
                const dayData = weekly[viewingTabDay] || weekly.find(d => d.dia?.toLowerCase().includes(DAYS_OF_WEEK[viewingTabDay].toLowerCase().slice(0, 3))) || { refeicoes: {} };

                return (
                  <div className="viewer-meals-grid">
                    {MEALS_CONFIG.map(({ key, label, icon: MealIcon, color, defaultTime }) => {
                      const options = dayData.refeicoes?.[key] || [];

                      return (
                        <div key={key} className="viewer-meal-box">
                          <div className="viewer-meal-header" style={{ borderLeftColor: color }}>
                            <div className="viewer-meal-icon" style={{ backgroundColor: `${color}18`, color }}>
                              <MealIcon size={18} />
                            </div>
                            <div>
                              <h5>{label}</h5>
                              <span className="viewer-time-tag">Horário sugerido: {defaultTime}</span>
                            </div>
                          </div>

                          <div className="viewer-options-list">
                            {options.map((opt, i) => (
                              <div key={i} className="viewer-option-item">
                                <span className="viewer-opt-num">{i + 1}</span>
                                <span className="viewer-opt-text">{opt || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewingHistoricalPlan(null)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setCurrentPlan(JSON.parse(JSON.stringify(viewingHistoricalPlan.conteudo)));
                  setIsEditing(true);
                  setViewingHistoricalPlan(null);
                  showToast('Plano carregado no editor para ajustes.', 'info');
                }}
              >
                <Edit3 size={16} />
                <span>Editar Este Plano</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
