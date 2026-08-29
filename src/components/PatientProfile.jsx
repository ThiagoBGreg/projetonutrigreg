import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  Plus,
  Calendar,
  Scale,
  Activity,
  HeartPulse,
  Droplets,
  Clock,
  Shield,
  Utensils,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingDown,
  TrendingUp,
  User,
  Phone,
  Mail,
  Target,
  FileText,
  CalendarPlus,
  Info
} from 'lucide-react';
import {
  updatePaciente,
  getConsultas,
  createConsulta,
  deleteConsulta,
  getPlanosAlimentares
} from '../lib/neon';

/* Utilitários de cálculo e formatação */
function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function calculateIMC(peso, alturaCm) {
  const p = parseFloat(peso);
  const a = parseFloat(alturaCm);
  if (!p || !a || a <= 0) return { imc: '', classificacao: '—' };
  const alturaM = a / 100;
  const imcVal = (p / (alturaM * alturaM)).toFixed(1);
  let classificacao = '';
  const num = parseFloat(imcVal);
  if (num < 18.5) classificacao = 'Abaixo do peso';
  else if (num < 25) classificacao = 'Peso normal';
  else if (num < 30) classificacao = 'Sobrepeso';
  else if (num < 35) classificacao = 'Obesidade Grau I';
  else if (num < 40) classificacao = 'Obesidade Grau II';
  else classificacao = 'Obesidade Grau III';
  return { imc: imcVal, classificacao };
}

function formatDate(dateStr) {
  if (!dateStr) return 'Não informada';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function formatTimeInput(val) {
  if (!val && val !== 0) return '';
  const str = String(val).trim();
  if (str.includes(':')) return str;
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 2) {
    const h = Math.min(Math.max(parseInt(digits, 10), 0), 23);
    return `${String(h).padStart(2, '0')}:00`;
  } else if (digits.length === 3) {
    const h = parseInt(digits.slice(0, 1), 10);
    const m = Math.min(parseInt(digits.slice(1), 10), 59);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } else {
    const h = Math.min(parseInt(digits.slice(0, 2), 10), 23);
    const m = Math.min(parseInt(digits.slice(2, 4), 10), 59);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

const DEFAULT_OBJECTIVES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const DEFAULT_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const DEFAULT_RESTRICOES = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
const DEFAULT_ALERGIAS = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

/* ========================================================================= */
/* COMPONENTE DO GRÁFICO DE EVOLUÇÃO DE PESO (SVG RESPONSIVO PURO)           */
/* ========================================================================= */
function WeightEvolutionChart({ consultas, initialWeight }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Montar série cronológica
  let dataPoints = [];

  // Se houver peso inicial e nenhuma consulta, ou como ponto de partida
  const sortedConsultas = [...consultas].sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta));

  if (sortedConsultas.length > 0) {
    dataPoints = sortedConsultas.map(c => ({
      id: c.id,
      date: c.data_consulta,
      dateLabel: formatDate(c.data_consulta),
      peso: Number(c.peso)
    }));
  } else if (initialWeight) {
    dataPoints = [
      {
        id: 'initial',
        date: 'Início',
        dateLabel: 'Peso Inicial',
        peso: Number(initialWeight)
      }
    ];
  }

  if (dataPoints.length === 0) {
    return (
      <div className="weight-chart-empty">
        <Scale size={36} color="#94a3b8" />
        <h4>Nenhuma consulta registrada ainda</h4>
        <p>Registre a primeira consulta para acompanhar o gráfico de evolução de peso do paciente.</p>
      </div>
    );
  }

  const svgWidth = 650;
  const svgHeight = 260;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const pesos = dataPoints.map(d => d.peso);
  const minPeso = Math.floor(Math.min(...pesos) - 2);
  const maxPeso = Math.ceil(Math.max(...pesos) + 2);
  const range = maxPeso - minPeso || 1;

  // Calcular coordenadas
  const points = dataPoints.map((d, index) => {
    const x = dataPoints.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (index / (dataPoints.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.peso - minPeso) / range) * chartHeight;
    return { ...d, x, y, index };
  });

  // Gerar caminho da linha
  const pathD = points.length === 1
    ? `M ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y}`
    : points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');

  // Gerar caminho de preenchimento (área com gradiente)
  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Linhas horizontais de grade (4 níveis)
  const gridSteps = 4;
  const gridLines = [];
  for (let i = 0; i <= gridSteps; i++) {
    const val = minPeso + (i / gridSteps) * range;
    const y = padding.top + chartHeight - (i / gridSteps) * chartHeight;
    gridLines.push({ val: val.toFixed(1), y });
  }

  // Variação total de peso
  const firstPeso = dataPoints[0].peso;
  const lastPeso = dataPoints[dataPoints.length - 1].peso;
  const totalDiff = (lastPeso - firstPeso).toFixed(1);

  return (
    <div className="weight-chart-wrapper">
      <div className="weight-chart-header">
        <div className="chart-title-area">
          <Scale size={20} color="#10b981" />
          <h3>Evolução de Peso ao Longo do Tempo</h3>
        </div>
        <div className="chart-summary-badge">
          {Number(totalDiff) < 0 ? (
            <span className="diff-tag diff-negative">
              <TrendingDown size={16} />
              <span>{Math.abs(totalDiff)} kg perdidos</span>
            </span>
          ) : Number(totalDiff) > 0 ? (
            <span className="diff-tag diff-positive">
              <TrendingUp size={16} />
              <span>+{totalDiff} kg ganhos</span>
            </span>
          ) : (
            <span className="diff-tag diff-neutral">
              <span>Peso estável</span>
            </span>
          )}
          <span className="current-weight-tag">Atual: <strong>{lastPeso} kg</strong></span>
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="weight-svg-chart"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadowDot" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#059669" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Linhas de Grade e Valores no Eixo Y */}
          {gridLines.map((g, i) => (
            <g key={i} className="chart-grid-row">
              <line
                x1={padding.left}
                y1={g.y}
                x2={svgWidth - padding.right}
                y2={g.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 12}
                y={g.y + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                {g.val} kg
              </text>
            </g>
          ))}

          {/* Área Gradiente */}
          {areaD && (
            <path d={areaD} fill="url(#emeraldAreaGradient)" />
          )}

          {/* Linha Principal do Gráfico */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de Dados Interativos */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.index === i;
            return (
              <g
                key={i}
                className="chart-data-point"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Eixo X - Label de Data */}
                <text
                  x={pt.x}
                  y={svgHeight - 14}
                  textAnchor="middle"
                  className="chart-axis-text-x"
                >
                  {pt.dateLabel}
                </text>

                {/* Círculo externo para hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 8 : 5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  filter="url(#shadowDot)"
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Ponto central */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 3.5 : 2}
                  fill="#059669"
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip Dinâmico ao passar o mouse */}
        {hoveredPoint && (
          <div
            className="chart-tooltip-bubble fade-in"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`
            }}
          >
            <div className="tooltip-date">{hoveredPoint.dateLabel}</div>
            <div className="tooltip-weight">{hoveredPoint.peso} kg</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* COMPONENTE PRINCIPAL: PERFIL DO PACIENTE (PROMPT 5)                       */
/* ========================================================================= */
export default function PatientProfile({
  patient,
  user,
  onBack,
  onDelete,
  onPatientUpdated
}) {
  const [activeSection, setActiveSection] = useState('dados'); // 'dados' | 'consultas' | 'planos'
  const [activeDataTab, setActiveDataTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Estados dos dados editáveis do paciente
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',
    peso: '',
    altura: '',
    objetivos_selecionados: [],
    objetivo_outro: '',
    nivel_atividade: 'Moderadamente ativo',
    patologias_selecionadas: [],
    patologia_outra: '',
    restricoes_selecionadas: [],
    restricao_outra: '',
    alergias_selecionadas: [],
    alergia_outra: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_dia: '4',
    horario_acorda: '06:00',
    horario_dorme: '22:30',
    agua_litros: '2.5',
    pratica_exercicio: 'sim',
    exercicio_detalhes: '',
    observacoes: ''
  });

  const [customPatologiaInput, setCustomPatologiaInput] = useState('');
  const [customRestricaoInput, setCustomRestricaoInput] = useState('');
  const [customAlergiaInput, setCustomAlergiaInput] = useState('');

  const [savingData, setSavingData] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados da Seção 2: Consultas
  const [consultas, setConsultas] = useState([]);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [showNovaConsultaModal, setShowNovaConsultaModal] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaFormData, setConsultaFormData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Estados da Seção 3: Planos Alimentares
  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [selectedPlanoModal, setSelectedPlanoModal] = useState(null);
  const [showGerarPlanoModal, setShowGerarPlanoModal] = useState(false);

  // Inicializar formData quando o paciente mudar
  useEffect(() => {
    if (patient) {
      const objList = Array.isArray(patient.objetivos_selecionados)
        ? patient.objetivos_selecionados
        : (patient.objetivo ? patient.objetivo.split(', ') : []);

      const patList = Array.isArray(patient.patologias_selecionadas)
        ? patient.patologias_selecionadas
        : (patient.patologias ? patient.patologias.split(', ') : []);

      const resList = Array.isArray(patient.restricoes_selecionadas)
        ? patient.restricoes_selecionadas
        : (patient.restricoes ? patient.restricoes.split(', ') : []);

      const aleList = Array.isArray(patient.alergias_selecionadas)
        ? patient.alergias_selecionadas
        : (patient.alergias ? patient.alergias.split(', ') : []);

      setFormData({
        nome: patient.nome || '',
        data_nascimento: patient.data_nascimento ? String(patient.data_nascimento).split('T')[0] : '',
        sexo: patient.sexo || 'Feminino',
        telefone: patient.telefone || patient.whatsapp || '',
        whatsapp: patient.whatsapp || patient.telefone || '',
        email: patient.email || '',
        peso: patient.peso ? String(patient.peso) : '',
        altura: patient.altura ? String(patient.altura) : '',
        objetivos_selecionados: objList.filter(o => DEFAULT_OBJECTIVES.includes(o)),
        objetivo_outro: patient.objetivo_outro || objList.find(o => !DEFAULT_OBJECTIVES.includes(o)) || '',
        nivel_atividade: patient.nivel_atividade || 'Moderadamente ativo',
        patologias_selecionadas: patList.filter(p => DEFAULT_PATOLOGIAS.includes(p) || p === 'Nenhum'),
        patologia_outra: patient.patologia_outra || patList.find(p => !DEFAULT_PATOLOGIAS.includes(p) && p !== 'Nenhum') || '',
        restricoes_selecionadas: resList.filter(r => DEFAULT_RESTRICOES.includes(r) || r === 'Nenhum'),
        restricao_outra: patient.restricao_outra || resList.find(r => !DEFAULT_RESTRICOES.includes(r) && r !== 'Nenhum') || '',
        alergias_selecionadas: aleList.filter(a => DEFAULT_ALERGIAS.includes(a) || a === 'Nenhum'),
        alergia_outra: patient.alergia_outra || aleList.find(a => !DEFAULT_ALERGIAS.includes(a) && a !== 'Nenhum') || '',
        medicamentos: patient.medicamentos || '',
        suplementos: patient.suplementos || '',
        refeicoes_dia: patient.refeicoes_dia ? String(patient.refeicoes_dia) : '4',
        horario_acorda: patient.horario_acorda || '06:00',
        horario_dorme: patient.horario_dorme || '22:30',
        agua_litros: patient.agua_litros ? String(patient.agua_litros) : '2.5',
        pratica_exercicio: patient.pratica_exercicio === 'sim' || patient.pratica_exercicio === true ? 'sim' : 'nao',
        exercicio_detalhes: patient.exercicio_detalhes || '',
        observacoes: patient.observacoes || ''
      });

      // Preencher peso padrão no modal de consulta
      if (patient.peso) {
        setConsultaFormData(prev => ({ ...prev, peso: String(patient.peso) }));
      }
    }
  }, [patient]);

  // Carregar Consultas e Planos do Neon em tempo real
  useEffect(() => {
    async function loadNeonData() {
      if (!patient?.id) return;

      try {
        setLoadingConsultas(true);
        const consultasList = await getConsultas(patient.id);
        setConsultas(consultasList);
      } catch (err) {
        console.warn('Aviso ao carregar consultas do Neon:', err);
      } finally {
        setLoadingConsultas(false);
      }

      try {
        setLoadingPlanos(true);
        const planosList = await getPlanosAlimentares(patient.id);
        setPlanos(planosList);
      } catch (err) {
        console.warn('Aviso ao carregar planos alimentares do Neon:', err);
      } finally {
        setLoadingPlanos(false);
      }
    }

    loadNeonData();
  }, [patient?.id]);

  // Multi-select helpers
  const toggleMultiSelect = (fieldKey, item) => {
    setFormData(prev => {
      let current = [...prev[fieldKey]];
      if (item === 'Nenhum') {
        current = current.includes('Nenhum') ? [] : ['Nenhum'];
      } else {
        current = current.filter(i => i !== 'Nenhum');
        if (current.includes(item)) {
          current = current.filter(i => i !== item);
        } else {
          current.push(item);
        }
      }
      return { ...prev, [fieldKey]: current };
    });
  };

  const addCustomOption = (fieldKey, text, setInput) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey].filter(i => i !== 'Nenhum'), text.trim()]
    }));
    setInput('');
  };

  // Salvar Alterações nos Dados do Paciente (Seção 1)
  const handleSavePatientData = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErrorMessage('O nome completo do paciente é obrigatório.');
      return;
    }

    try {
      setSavingData(true);
      setErrorMessage('');

      const objetivosFinal = [
        ...formData.objetivos_selecionados,
        ...(formData.objetivo_outro.trim() ? [formData.objetivo_outro.trim()] : [])
      ].join(', ');

      const patologiasFinal = [
        ...formData.patologias_selecionadas,
        ...(formData.patologia_outra.trim() ? [formData.patologia_outra.trim()] : [])
      ].join(', ');

      const restricoesFinal = [
        ...formData.restricoes_selecionadas,
        ...(formData.restricao_outra.trim() ? [formData.restricao_outra.trim()] : [])
      ].join(', ');

      const alergiasFinal = [
        ...formData.alergias_selecionadas,
        ...(formData.alergia_outra.trim() ? [formData.alergia_outra.trim()] : [])
      ].join(', ');

      const payload = {
        ...formData,
        nome: formData.nome.trim(),
        objetivo: objetivosFinal,
        patologias: patologiasFinal,
        restricoes: restricoesFinal,
        alergias: alergiasFinal
      };

      const updated = await updatePaciente(patient.id, payload, user?.id || 'demo');
      onPatientUpdated?.(updated);
      setSuccessMessage('Dados do paciente atualizados com sucesso no Neon DB!');

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      setErrorMessage(err.message || 'Erro ao salvar alterações no banco Neon.');
    } finally {
      setSavingData(false);
    }
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSaveConsulta = async (e) => {
    e.preventDefault();
    if (!consultaFormData.peso) {
      setErrorMessage('O peso na consulta é obrigatório.');
      return;
    }

    try {
      setSavingConsulta(true);
      setErrorMessage('');

      const newConsulta = await createConsulta(patient.id, consultaFormData);
      
      // Atualizar lista local de consultas
      const updatedConsultas = [newConsulta, ...consultas];
      setConsultas(updatedConsultas);

      // Atualizar peso atual do paciente
      if (consultaFormData.peso) {
        setFormData(prev => ({ ...prev, peso: String(consultaFormData.peso) }));
        await updatePaciente(patient.id, { ...formData, peso: consultaFormData.peso }, user?.id || 'demo');
      }

      setShowNovaConsultaModal(false);
      setSuccessMessage('Consulta registrada com sucesso no Neon!');

      // Reset form de consulta
      setConsultaFormData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: consultaFormData.peso,
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      setErrorMessage(err.message || 'Erro ao registrar consulta.');
    } finally {
      setSavingConsulta(false);
    }
  };

  // Excluir Consulta
  const handleDeleteConsulta = async (consultaId) => {
    if (window.confirm('Tem certeza de que deseja excluir o registro desta consulta?')) {
      try {
        await deleteConsulta(consultaId);
        setConsultas(prev => prev.filter(c => c.id !== consultaId));
        setSuccessMessage('Consulta excluída com sucesso.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setErrorMessage(err.message || 'Erro ao excluir consulta.');
      }
    }
  };

  const calculatedAge = calculateAge(formData.data_nascimento);
  const imcCalc = calculateIMC(formData.peso, formData.altura);

  return (
    <div className="patient-profile-page fade-in">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="toast-notification success-toast fade-in">
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="toast-notification error-toast fade-in">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
          <button type="button" className="close-toast-btn" onClick={() => setErrorMessage('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="profile-top-bar">
        <button type="button" className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Voltar para a lista de pacientes</span>
        </button>

        <div className="profile-top-actions">
          <button
            type="button"
            className="btn-danger-action"
            onClick={() => onDelete(patient.id)}
            title="Excluir paciente"
          >
            <Trash2 size={16} />
            <span>Excluir Paciente</span>
          </button>
        </div>
      </div>

      {/* Hero Header do Paciente */}
      <div className="patient-hero-card">
        <div className="patient-hero-main">
          <div className="patient-avatar-circle">
            {formData.nome ? formData.nome.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="patient-hero-details">
            <div className="patient-hero-title-row">
              <h2>{formData.nome || 'Paciente'}</h2>
              <span className="patient-status-badge">Paciente Ativo</span>
            </div>

            <div className="patient-hero-tags">
              <span className="hero-tag">
                <User size={14} />
                <span>{calculatedAge !== null ? `${calculatedAge} anos` : 'Idade não informada'}</span>
              </span>
              <span className="hero-tag">
                <span>{formData.sexo}</span>
              </span>
              {formData.whatsapp && (
                <span className="hero-tag">
                  <Phone size={14} />
                  <span>{formData.whatsapp}</span>
                </span>
              )}
              {formData.email && (
                <span className="hero-tag">
                  <Mail size={14} />
                  <span>{formData.email}</span>
                </span>
              )}
              <span className="hero-tag tag-objective">
                <Target size={14} />
                <span>{formData.objetivos_selecionados.join(', ') || formData.objetivo_outro || 'Acompanhamento Nutricional'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Resumo Rápido de Métricas Antropométricas */}
        <div className="patient-hero-quick-stats">
          <div className="quick-stat-box">
            <span className="quick-stat-label">Peso Atual</span>
            <span className="quick-stat-value">{formData.peso ? `${formData.peso} kg` : '—'}</span>
          </div>
          <div className="quick-stat-box">
            <span className="quick-stat-label">Altura</span>
            <span className="quick-stat-value">{formData.altura ? `${formData.altura} cm` : '—'}</span>
          </div>
          <div className="quick-stat-box">
            <span className="quick-stat-label">IMC</span>
            <span className="quick-stat-value">{imcCalc.imc || '—'}</span>
            <span className="quick-stat-sub">{imcCalc.classificacao}</span>
          </div>
        </div>
      </div>

      {/* Barra de Navegação das 3 Seções Principais (Prompt 5) */}
      <div className="profile-sections-tabs-bar">
        <button
          type="button"
          className={`section-tab-btn ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={18} />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          className={`section-tab-btn ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <CalendarCheckIcon size={18} />
          <span>2. Consultas & Evolução</span>
          {consultas.length > 0 && <span className="tab-count-badge">{consultas.length}</span>}
        </button>

        <button
          type="button"
          className={`section-tab-btn ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <Utensils size={18} />
          <span>3. Planos Alimentares</span>
          {planos.length > 0 && <span className="tab-count-badge">{planos.length}</span>}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: DADOS DO PACIENTE (EDITÁVEIS IN-PLACE)                            */}
      {/* ========================================================================= */}
      {activeSection === 'dados' && (
        <div className="profile-section-card fade-in">
          <form onSubmit={handleSavePatientData}>
            {/* Sub-abas: Pessoal, Clínico, Hábitos */}
            <div className="form-subtabs-nav">
              <button
                type="button"
                className={`subtab-btn ${activeDataTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveDataTab('pessoal')}
              >
                <User size={16} />
                <span>Pessoal</span>
              </button>

              <button
                type="button"
                className={`subtab-btn ${activeDataTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveDataTab('clinico')}
              >
                <HeartPulse size={16} />
                <span>Clínico & Anamnese</span>
              </button>

              <button
                type="button"
                className={`subtab-btn ${activeDataTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveDataTab('habitos')}
              >
                <Activity size={16} />
                <span>Hábitos & Rotina</span>
              </button>
            </div>

            {/* ABA 1: PESSOAL */}
            {activeDataTab === 'pessoal' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label className="form-label required">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <div className="input-with-badge">
                      <input
                        type="date"
                        className="form-input"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      />
                      {calculatedAge !== null && (
                        <span className="calculated-badge">{calculatedAge} anos</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <div className="radio-group-pills">
                      {['Feminino', 'Masculino', 'Outro'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`pill-btn ${formData.sexo === s ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, sexo: s })}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="(11) 98765-4321"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email do Paciente</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="paciente@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeDataTab === 'clinico' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Peso Atual</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formData.peso}
                        onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        className="form-input"
                        value={formData.altura}
                        onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC Calculado</label>
                    <div className="imc-display-box">
                      <span className="imc-number">{imcCalc.imc || '—'}</span>
                      <span className="imc-desc">{imcCalc.classificacao}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group full-width mt-3">
                  <label className="form-label">Objetivos Principais</label>
                  <div className="multi-select-pills">
                    {DEFAULT_OBJECTIVES.map((obj) => (
                      <button
                        key={obj}
                        type="button"
                        className={`tag-pill-btn ${formData.objetivos_selecionados.includes(obj) ? 'active' : ''}`}
                        onClick={() => toggleMultiSelect('objetivos_selecionados', obj)}
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="form-input mt-2"
                    placeholder="Outro objetivo específico..."
                    value={formData.objetivo_outro}
                    onChange={(e) => setFormData({ ...formData, objetivo_outro: e.target.value })}
                  />
                </div>

                <div className="form-group full-width mt-3">
                  <label className="form-label">Nível de Atividade Física</label>
                  <div className="radio-group-pills wrap">
                    {['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`pill-btn ${formData.nivel_atividade === lvl ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, nivel_atividade: lvl })}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full-width mt-3">
                  <label className="form-label">Patologias ou Condições de Saúde</label>
                  <div className="multi-select-pills">
                    <button
                      type="button"
                      className={`tag-pill-btn ${formData.patologias_selecionadas.includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleMultiSelect('patologias_selecionadas', 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {DEFAULT_PATOLOGIAS.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        className={`tag-pill-btn ${formData.patologias_selecionadas.includes(pat) ? 'active' : ''}`}
                        onClick={() => toggleMultiSelect('patologias_selecionadas', pat)}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                  <div className="add-custom-row mt-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adicionar outra patologia..."
                      value={customPatologiaInput}
                      onChange={(e) => setCustomPatologiaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomOption('patologias_selecionadas', customPatologiaInput, setCustomPatologiaInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => addCustomOption('patologias_selecionadas', customPatologiaInput, setCustomPatologiaInput)}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="form-group full-width mt-3">
                  <label className="form-label">Restrições Alimentares</label>
                  <div className="multi-select-pills">
                    <button
                      type="button"
                      className={`tag-pill-btn ${formData.restricoes_selecionadas.includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleMultiSelect('restricoes_selecionadas', 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {DEFAULT_RESTRICOES.map((res) => (
                      <button
                        key={res}
                        type="button"
                        className={`tag-pill-btn ${formData.restricoes_selecionadas.includes(res) ? 'active' : ''}`}
                        onClick={() => toggleMultiSelect('restricoes_selecionadas', res)}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                  <div className="add-custom-row mt-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adicionar outra restrição..."
                      value={customRestricaoInput}
                      onChange={(e) => setCustomRestricaoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomOption('restricoes_selecionadas', customRestricaoInput, setCustomRestricaoInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => addCustomOption('restricoes_selecionadas', customRestricaoInput, setCustomRestricaoInput)}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="form-group full-width mt-3">
                  <label className="form-label">Alergias Alimentares</label>
                  <div className="multi-select-pills">
                    <button
                      type="button"
                      className={`tag-pill-btn ${formData.alergias_selecionadas.includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleMultiSelect('alergias_selecionadas', 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {DEFAULT_ALERGIAS.map((ale) => (
                      <button
                        key={ale}
                        type="button"
                        className={`tag-pill-btn ${formData.alergias_selecionadas.includes(ale) ? 'active' : ''}`}
                        onClick={() => toggleMultiSelect('alergias_selecionadas', ale)}
                      >
                        {ale}
                      </button>
                    ))}
                  </div>
                  <div className="add-custom-row mt-2">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adicionar outra alergia..."
                      value={customAlergiaInput}
                      onChange={(e) => setCustomAlergiaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomOption('alergias_selecionadas', customAlergiaInput, setCustomAlergiaInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-tag"
                      onClick={() => addCustomOption('alergias_selecionadas', customAlergiaInput, setCustomAlergiaInput)}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>

                <div className="form-grid-2 mt-3">
                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Losartana 50mg, Metformina"
                      value={formData.medicamentos}
                      onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suplementos em Uso</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Creatina 5g, Whey Protein, Vitamina D"
                      value={formData.suplementos}
                      onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeDataTab === 'habitos' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Refeições ao dia</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.refeicoes_dia}
                      onChange={(e) => setFormData({ ...formData, refeicoes_dia: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário que acorda</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.horario_acorda}
                      onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, horario_acorda: formatTimeInput(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário que dorme</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.horario_dorme}
                      onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, horario_dorme: formatTimeInput(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-grid-2 mt-3">
                  <div className="form-group">
                    <label className="form-label">Meta de Hidratação Diária</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={formData.agua_litros}
                        onChange={(e) => setFormData({ ...formData, agua_litros: e.target.value })}
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pratica Atividade Física?</label>
                    <div className="radio-group-pills">
                      <button
                        type="button"
                        className={`pill-btn ${formData.pratica_exercicio === 'sim' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, pratica_exercicio: 'sim' })}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        className={`pill-btn ${formData.pratica_exercicio === 'nao' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, pratica_exercicio: 'nao' })}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>

                {formData.pratica_exercicio === 'sim' && (
                  <div className="form-group full-width mt-3 fade-in">
                    <label className="form-label">Atividade e Frequência Semanal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Musculação 4x na semana, Corrida aos sábados"
                      value={formData.exercicio_detalhes}
                      onChange={(e) => setFormData({ ...formData, exercicio_detalhes: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group full-width mt-3">
                  <label className="form-label">Observações Gerais</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Histórico clínico relevante, preferências ou detalhes extras..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Rodapé com botão Salvar Alterações */}
            <div className="profile-section-footer">
              <button
                type="submit"
                className="btn-primary-save"
                disabled={savingData}
              >
                {savingData ? (
                  <>
                    <span className="spinner"></span>
                    <span>Salvando alterações no Neon...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: CONSULTAS & EVOLUÇÃO (PROMPT 5)                                   */}
      {/* ========================================================================= */}
      {activeSection === 'consultas' && (
        <div className="profile-section-card fade-in">
          {/* Header da Seção de Consultas */}
          <div className="consultas-section-header">
            <div>
              <h3 className="section-title">Acompanhamento Clínico & Consultas</h3>
              <p className="section-subtitle">
                Registre cada atendimento e visualize a evolução corporal do paciente.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowNovaConsultaModal(true)}
            >
              <CalendarPlus size={18} />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Gráfico de Evolução de Peso */}
          <div className="chart-outer-container">
            <WeightEvolutionChart
              consultas={consultas}
              initialWeight={formData.peso}
            />
          </div>

          {/* Histórico / Lista de Consultas */}
          <div className="consultas-list-container mt-4">
            <h4 className="list-title">Histórico de Atendimentos</h4>

            {loadingConsultas ? (
              <div className="loading-state-box">
                <div className="spinner"></div>
                <p>Carregando histórico de consultas do Neon...</p>
              </div>
            ) : consultas.length === 0 ? (
              <div className="empty-consultas-card">
                <Calendar size={36} color="#94a3b8" />
                <p>Nenhuma consulta registrada para este paciente ainda.</p>
                <button
                  type="button"
                  className="btn-primary btn-sm mt-2"
                  onClick={() => setShowNovaConsultaModal(true)}
                >
                  <Plus size={16} />
                  <span>Registrar Primeira Consulta</span>
                </button>
              </div>
            ) : (
              <div className="consultas-grid">
                {consultas.map((c) => (
                  <div key={c.id} className="consulta-card fade-in">
                    <div className="consulta-card-header">
                      <div className="consulta-date-badge">
                        <Calendar size={16} color="#10b981" />
                        <span>{formatDate(c.data_consulta)}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-delete-consulta"
                        onClick={() => handleDeleteConsulta(c.id)}
                        title="Excluir esta consulta"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="consulta-metrics-grid">
                      <div className="consulta-metric-item">
                        <span className="c-label">Peso</span>
                        <span className="c-val highlight">{c.peso} kg</span>
                      </div>

                      {c.cintura && (
                        <div className="consulta-metric-item">
                          <span className="c-label">Cintura</span>
                          <span className="c-val">{c.cintura} cm</span>
                        </div>
                      )}

                      {c.quadril && (
                        <div className="consulta-metric-item">
                          <span className="c-label">Quadril</span>
                          <span className="c-val">{c.quadril} cm</span>
                        </div>
                      )}

                      {c.percentual_gordura && (
                        <div className="consulta-metric-item">
                          <span className="c-label">% Gordura</span>
                          <span className="c-val">{c.percentual_gordura}%</span>
                        </div>
                      )}
                    </div>

                    {c.proximo_retorno && (
                      <div className="consulta-retorno-tag">
                        <Clock size={14} color="#0284c7" />
                        <span>Próximo Retorno: <strong>{formatDate(c.proximo_retorno)}</strong></span>
                      </div>
                    )}

                    {c.observacoes && (
                      <div className="consulta-obs-box">
                        <p>{c.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES (PROMPT 5)                                    */}
      {/* ========================================================================= */}
      {activeSection === 'planos' && (
        <div className="profile-section-card fade-in">
          <div className="planos-section-header">
            <div>
              <h3 className="section-title">Planos Alimentares</h3>
              <p className="section-subtitle">
                Histórico de cardápios e dietas prescritas para {formData.nome}.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary btn-generate-plan"
              onClick={() => setShowGerarPlanoModal(true)}
            >
              <Sparkles size={18} />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          <div className="planos-list-container mt-4">
            {loadingPlanos ? (
              <div className="loading-state-box">
                <div className="spinner"></div>
                <p>Carregando planos alimentares do Neon...</p>
              </div>
            ) : planos.length === 0 ? (
              <div className="empty-planos-card">
                <Utensils size={40} color="#94a3b8" />
                <h4>Nenhum plano alimentar gerado ainda</h4>
                <p>Clique no botão acima para criar ou gerar o primeiro plano alimentar deste paciente.</p>
                <button
                  type="button"
                  className="btn-primary mt-3"
                  onClick={() => setShowGerarPlanoModal(true)}
                >
                  <Sparkles size={16} />
                  <span>Gerar Plano Alimentar</span>
                </button>
              </div>
            ) : (
              <div className="planos-grid">
                {planos.map((plano, idx) => (
                  <div
                    key={plano.id || idx}
                    className="plano-card fade-in"
                    onClick={() => setSelectedPlanoModal(plano)}
                  >
                    <div className="plano-card-header">
                      <div className="plano-icon-badge">
                        <Utensils size={18} color="#10b981" />
                      </div>
                      <span className="plano-date-tag">
                        {formatDate(plano.created_at)}
                      </span>
                    </div>

                    <h4 className="plano-card-title">
                      {plano.conteudo?.titulo || `Plano Alimentar #${planos.length - idx}`}
                    </h4>

                    <p className="plano-card-summary">
                      {plano.conteudo?.descricao || plano.conteudo?.calorias_meta
                        ? `Meta: ${plano.conteudo?.calorias_meta} kcal • ${plano.conteudo?.refeicoes?.length || 4} refeições diárias`
                        : 'Clique para visualizar os detalhes completos do plano alimentar prescrito.'}
                    </p>

                    <div className="plano-card-footer">
                      <span className="view-plano-link">Ver conteúdo completo &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA CONSULTA (PROMPT 5)                                           */}
      {/* ========================================================================= */}
      {showNovaConsultaModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowNovaConsultaModal(false)}>
          <div className="modal-card modal-consulta-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <CalendarPlus size={20} color="#10b981" />
                <h3>Registrar Nova Consulta</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNovaConsultaModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConsulta}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label required">Data da Consulta *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={consultaFormData.data_consulta}
                      onChange={(e) => setConsultaFormData({ ...consultaFormData, data_consulta: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Peso Atual *</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 68.5"
                        className="form-input"
                        value={consultaFormData.peso}
                        onChange={(e) => setConsultaFormData({ ...consultaFormData, peso: e.target.value })}
                        required
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>
                </div>

                <div className="form-grid-3 mt-3">
                  <div className="form-group">
                    <label className="form-label">Cintura (opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="75"
                        className="form-input"
                        value={consultaFormData.cintura}
                        onChange={(e) => setConsultaFormData({ ...consultaFormData, cintura: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quadril (opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="98"
                        className="form-input"
                        value={consultaFormData.quadril}
                        onChange={(e) => setConsultaFormData({ ...consultaFormData, quadril: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">% Gordura (opcional)</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="22.5"
                        className="form-input"
                        value={consultaFormData.percentual_gordura}
                        onChange={(e) => setConsultaFormData({ ...consultaFormData, percentual_gordura: e.target.value })}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Próximo Retorno</label>
                  <input
                    type="date"
                    className="form-input"
                    value={consultaFormData.proximo_retorno}
                    onChange={(e) => setConsultaFormData({ ...consultaFormData, proximo_retorno: e.target.value })}
                  />
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Observações da Consulta</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Evolução do paciente, ajustes no plano alimentar, feedback de aderência..."
                    value={consultaFormData.observacoes}
                    onChange={(e) => setConsultaFormData({ ...consultaFormData, observacoes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNovaConsultaModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingConsulta}
                >
                  {savingConsulta ? (
                    <>
                      <span className="spinner"></span>
                      <span>Salvando consulta...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Consulta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR CONTEÚDO DO PLANO ALIMENTAR                             */}
      {/* ========================================================================= */}
      {selectedPlanoModal && (
        <div className="modal-overlay fade-in" onClick={() => setSelectedPlanoModal(null)}>
          <div className="modal-card modal-plano-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Utensils size={20} color="#10b981" />
                <h3>{selectedPlanoModal.conteudo?.titulo || 'Plano Alimentar'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedPlanoModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="plano-meta-info">
                <span>Registrado em: <strong>{formatDate(selectedPlanoModal.created_at)}</strong></span>
                {selectedPlanoModal.conteudo?.calorias_meta && (
                  <span>Meta Calórica: <strong>{selectedPlanoModal.conteudo.calorias_meta} kcal</strong></span>
                )}
              </div>

              {selectedPlanoModal.conteudo?.refeicoes ? (
                <div className="plano-meals-list">
                  {selectedPlanoModal.conteudo.refeicoes.map((ref, i) => (
                    <div key={i} className="plano-meal-box">
                      <h5 className="meal-title">{ref.nome || `Refeição ${i + 1}`} ({ref.horario || '—'})</h5>
                      <p className="meal-items">{ref.alimentos || ref.descricao}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="raw-plano-content">
                  {typeof selectedPlanoModal.conteudo === 'string'
                    ? selectedPlanoModal.conteudo
                    : JSON.stringify(selectedPlanoModal.conteudo, null, 2)}
                </pre>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedPlanoModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INFO GERAR PLANO ALIMENTAR (PROMPT 5 / PROMPT 6)                   */}
      {/* ========================================================================= */}
      {showGerarPlanoModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowGerarPlanoModal(false)}>
          <div className="modal-card modal-gerar-info" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Sparkles size={20} color="#10b981" />
                <h3>Geração de Plano Alimentar Inteligente</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowGerarPlanoModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-badge-box">
                <Info size={24} color="#10b981" />
                <div>
                  <h4>Módulo de Geração Inteligente</h4>
                  <p>
                    O botão de <strong>Gerar Plano Alimentar</strong> está conectado e ativo para este paciente. No próximo módulo (Prompt 6), o assistente com IA criará planos alimentares personalizados calculando automaticamente macronutrientes, calorias e substituições com base na anamnese de <strong>{formData.nome}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowGerarPlanoModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarCheckIcon(props) {
  return <Calendar {...props} />;
}
