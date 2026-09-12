import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Target,
  Calendar,
  ArrowLeft,
  Activity,
  Scale,
  HeartPulse,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Droplets,
  Utensils,
  Moon,
  Sun,
  Dumbbell,
  Shield,
  FileText,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import {
  getPacientesList,
  createPaciente,
  updatePaciente,
  deletePaciente
} from '../lib/neon';
import PatientProfile from './PatientProfile';

/* Formatação e utilitários */
const generateRandom5DigitKey = () => Math.floor(10000 + Math.random() * 90000).toString();

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

function formatPhone(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
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

function calculateIMC(peso, alturaCm) {
  const p = parseFloat(peso);
  const a = parseFloat(alturaCm);
  if (!p || !a || a <= 0) return { imc: '', classificacao: '' };
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
  if (!dateStr) return 'Não registrada';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
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

export default function PatientsView({ user, selectedPatientId, onBackToDashboard, newPatientTrigger, onViewStateChange }) {
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [viewState, setViewState] = useState('list'); // 'list' | 'form' | 'profile'
  const [activePatient, setActivePatient] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);

  /* Estado do formulário de cadastro/edição */
  const [activeTab, setActiveTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  /* Notificar componente pai sobre mudança de viewState */
  useEffect(() => {
    if (onViewStateChange) {
      onViewStateChange(viewState);
    }
  }, [viewState, onViewStateChange]);

  /* Form Data State */
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',
    chave_acesso: generateRandom5DigitKey(),
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

  /* Carregamento inicial de pacientes */
  useEffect(() => {
    async function loadData() {
      const list = await getPacientesList(user?.id || 'demo');
      setPacientes(list);

      if (selectedPatientId) {
        const found = list.find(p => String(p.id) === String(selectedPatientId));
        if (found) {
          setActivePatient(found);
          setViewState('profile');
        }
      }
    }
    loadData();
  }, [user, selectedPatientId]);

  /* Escutar acionador externo para novo paciente (botão flutuante) */
  useEffect(() => {
    if (newPatientTrigger > 0) {
      handleOpenForm(null);
    }
  }, [newPatientTrigger]);

  /* Copiar chave com feedback */
  const handleCopyKey = (keyToCopy) => {
    if (!keyToCopy) return;
    try {
      navigator.clipboard?.writeText(keyToCopy);
      setSuccessMessage(`Chave de acesso "${keyToCopy}" copiada com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (e) {
      setSuccessMessage(`Chave: ${keyToCopy}`);
    }
  };

  /* Enviar Chave via WhatsApp */
  const handleSendWhatsAppKey = (patientName, key, phone) => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${patientName || 'Paciente'}! Segue sua chave de 5 dígitos para acessar o seu Portal do Paciente Nutri Rodrigues:\n\n` +
      `🔑 *Chave de Acesso:* ${key}\n\n` +
      `Acesse seu cardápio semanal e orientações em:\nhttps://nutristerodrigues.vercel.app/`
    );
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}`
      : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  /* Resetar formulário */
  const resetForm = () => {
    setFormData({
      nome: '',
      data_nascimento: '',
      sexo: 'Feminino',
      telefone: '',
      whatsapp: '',
      email: '',
      chave_acesso: generateRandom5DigitKey(),
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
    setEditingPatientId(null);
    setActiveTab('pessoal');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenForm = (patientToEdit = null) => {
    if (patientToEdit) {
      setEditingPatientId(patientToEdit.id);
      
      // Parse multi-select items
      const objList = patientToEdit.objetivo ? patientToEdit.objetivo.split(', ') : [];
      const patList = patientToEdit.patologias ? patientToEdit.patologias.split(', ') : [];
      const resList = patientToEdit.restricoes ? patientToEdit.restricoes.split(', ') : [];
      const aleList = patientToEdit.alergias ? patientToEdit.alergias.split(', ') : [];

      setFormData({
        nome: patientToEdit.nome || '',
        data_nascimento: patientToEdit.data_nascimento || '',
        sexo: patientToEdit.sexo || 'Feminino',
        telefone: patientToEdit.telefone || '',
        whatsapp: patientToEdit.whatsapp || patientToEdit.telefone || '',
        email: patientToEdit.email || '',
        chave_acesso: patientToEdit.chave_acesso || generateRandom5DigitKey(),
        peso: patientToEdit.peso ? String(patientToEdit.peso) : '',
        altura: patientToEdit.altura ? String(patientToEdit.altura) : '',
        objetivos_selecionados: objList.filter(o => DEFAULT_OBJECTIVES.includes(o)),
        objetivo_outro: objList.find(o => !DEFAULT_OBJECTIVES.includes(o)) || '',
        nivel_atividade: patientToEdit.nivel_atividade || 'Moderadamente ativo',
        patologias_selecionadas: patList.filter(p => DEFAULT_PATOLOGIAS.includes(p) || p === 'Nenhum'),
        patologia_outra: patList.find(p => !DEFAULT_PATOLOGIAS.includes(p) && p !== 'Nenhum') || '',
        restricoes_selecionadas: resList.filter(r => DEFAULT_RESTRICOES.includes(r) || r === 'Nenhum'),
        restricao_outra: resList.find(r => !DEFAULT_RESTRICOES.includes(r) && r !== 'Nenhum') || '',
        alergias_selecionadas: aleList.filter(a => DEFAULT_ALERGIAS.includes(a) || a === 'Nenhum'),
        alergia_outra: aleList.find(a => !DEFAULT_ALERGIAS.includes(a) && a !== 'Nenhum') || '',
        medicamentos: patientToEdit.medicamentos || '',
        suplementos: patientToEdit.suplementos || '',
        refeicoes_dia: patientToEdit.refeicoes_dia ? String(patientToEdit.refeicoes_dia) : '4',
        horario_acorda: patientToEdit.horario_acorda || '06:00',
        horario_dorme: patientToEdit.horario_dorme || '22:30',
        agua_litros: patientToEdit.agua_litros ? String(patientToEdit.agua_litros) : '2.5',
        pratica_exercicio: patientToEdit.pratica_exercicio ? 'sim' : 'nao',
        exercicio_detalhes: patientToEdit.exercicio_detalhes || '',
        observacoes: patientToEdit.observacoes || ''
      });
    } else {
      resetForm();
    }
    setViewState('form');
  };

  /* Manipulação de Seleções Múltiplas com a regra de "Nenhum" */
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

  /* Adicionar opção customizada */
  const addCustomOption = (fieldKey, text, setInput) => {
    if (!text.trim()) return;
    setFormData(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey].filter(i => i !== 'Nenhum'), text.trim()]
    }));
    setInput('');
  };

  /* Salvar Formulário de Cadastro/Edição */
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.nome.trim()) {
      setErrorMessage('O nome completo do paciente é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      // Formatar horários se for passado número puro
      const formattedAcorda = formatTimeInput(formData.horario_acorda);
      const formattedDorme = formatTimeInput(formData.horario_dorme);

      // Calcular IMC
      const { imc } = calculateIMC(formData.peso, formData.altura);

      // Consolidar Objetivos, Patologias, Restrições e Alergias
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

      const cleanChave = String(formData.chave_acesso || generateRandom5DigitKey()).replace(/\D/g, '').slice(0, 5);

      const payload = {
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp || formData.telefone,
        email: formData.email,
        chave_acesso: cleanChave,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        imc: imc ? parseFloat(imc) : null,
        objetivo: objetivosFinal,
        objetivos_selecionados: formData.objetivos_selecionados,
        objetivo_outro: formData.objetivo_outro,
        nivel_atividade: formData.nivel_atividade,
        patologias: patologiasFinal,
        patologias_selecionadas: formData.patologias_selecionadas,
        restricoes: restricoesFinal,
        restricoes_selecionadas: formData.restricoes_selecionadas,
        alergias: alergiasFinal,
        alergias_selecionadas: formData.alergias_selecionadas,
        medicamentos: formData.medicamentos,
        suplementos: formData.suplementos,
        refeicoes_dia: formData.refeicoes_dia ? parseInt(formData.refeicoes_dia, 10) : null,
        horario_acorda: formattedAcorda,
        horario_dorme: formattedDorme,
        agua_litros: formData.agua_litros ? parseFloat(formData.agua_litros) : null,
        pratica_exercicio: formData.pratica_exercicio === 'sim',
        exercicio_detalhes: formData.exercicio_detalhes,
        observacoes: formData.observacoes
      };

      let savedPatient = null;

      if (editingPatientId) {
        savedPatient = await updatePaciente(editingPatientId, payload, user?.id || 'demo');
        setSuccessMessage(`Paciente "${savedPatient.nome}" atualizado com sucesso!`);
      } else {
        savedPatient = await createPaciente(payload, user?.id || 'demo');
        setSuccessMessage(`Paciente "${savedPatient.nome}" cadastrado com sucesso! Chave de acesso: ${savedPatient.chave_acesso}`);
      }

      // Recarregar lista
      const updatedList = await getPacientesList(user?.id || 'demo');
      setPacientes(updatedList);

      // Redirecionar para o perfil do paciente recém-salvo
      setTimeout(() => {
        setActivePatient(savedPatient);
        setViewState('profile');
        setSuccessMessage('');
      }, 1200);

    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o paciente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  /* Excluir paciente */
  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Tem certeza de que deseja excluir este paciente permanentemente?')) {
      await deletePaciente(patientId, user?.id || 'demo');
      const updatedList = await getPacientesList(user?.id || 'demo');
      setPacientes(updatedList);
      setActivePatient(null);
      setViewState('list');
    }
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
    (p.objetivo && p.objetivo.toLowerCase().includes(search.toLowerCase())) ||
    (p.chave_acesso && String(p.chave_acesso).includes(search))
  );

  const calculatedAgeVal = calculateAge(formData.data_nascimento);
  const imcCalculado = calculateIMC(formData.peso, formData.altura);

  return (
    <div className="patients-container">
      {/* Banner de Mensagens de Sucesso / Erro */}
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

      {/* ========================================================================= */}
      {/* VISÃO 1: PERFIL DO PACIENTE (PROMPT 5)                                    */}
      {/* ========================================================================= */}
      {viewState === 'profile' && activePatient ? (
        <PatientProfile
          patient={activePatient}
          user={user}
          onBack={() => setViewState('list')}
          onDelete={handleDeletePatient}
          onPatientUpdated={(updated) => {
            setActivePatient(updated);
            setPacientes(prev => prev.map(p => (String(p.id) === String(updated.id) ? updated : p)));
          }}
        />
      ) : viewState === 'form' ? (

        /* ========================================================================= */
        /* VISÃO 2: FORMULÁRIO DE CADASTRO / EDIÇÃO                                  */
        /* ========================================================================= */
        <div className="patient-form-view fade-in">
          <div className="form-header-bar">
            <div>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setViewState('list')}
              >
                <ArrowLeft size={18} />
                <span>Voltar para a lista de pacientes</span>
              </button>
              <h2 className="form-title">
                {editingPatientId ? 'Editar Cadastro do Paciente' : 'Novo Cadastro de Paciente'}
              </h2>
              <p className="form-subtitle">Preencha os dados do paciente para acompanhamento personalizado</p>
            </div>
          </div>

          <form onSubmit={handleSubmitForm} className="patient-form-card">
            {/* Navegação entre as 3 Abas (Pessoal, Clínico, Hábitos) */}
            <div className="form-tabs-navigation">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveTab('pessoal')}
              >
                <Users size={18} />
                <span>1. Dados Pessoais</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveTab('clinico')}
              >
                <HeartPulse size={18} />
                <span>2. Perfil Clínico</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveTab('habitos')}
              >
                <Activity size={18} />
                <span>3. Hábitos & Rotina</span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1 — PESSOAL */}
            {activeTab === 'pessoal' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label className="form-label required">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Maria Eduarda Santos"
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
                      {calculatedAgeVal !== null && (
                        <span className="calculated-badge">{calculatedAgeVal} anos</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <div className="radio-group-pills">
                      {['Feminino', 'Masculino', 'Outro'].map((sexo) => (
                        <button
                          key={sexo}
                          type="button"
                          className={`pill-btn ${formData.sexo === sexo ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, sexo })}
                        >
                          {sexo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="(11) 99999-8888"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="(11) 99999-8888"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Endereço de Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="paciente@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Campo de Chave de Acesso de 5 Dígitos para o Paciente */}
                  <div className="form-group full-width">
                    <label className="form-label">
                      <KeyRound size={16} color="#06b6d4" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                      Chave de Acesso do Paciente (5 Dígitos para Login) *
                    </label>
                    <div className="patient-access-key-box morph-card-mini">
                      <div className="key-input-main">
                        <input
                          type="text"
                          maxLength={5}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="form-input key-5digit-input"
                          value={formData.chave_acesso}
                          onChange={(e) => {
                            const num = e.target.value.replace(/\D/g, '').slice(0, 5);
                            setFormData({ ...formData, chave_acesso: num });
                          }}
                          placeholder="Ex: 76460"
                          required
                        />
                        <button
                          type="button"
                          className="btn-key-action btn-generate-key"
                          onClick={() => setFormData({ ...formData, chave_acesso: generateRandom5DigitKey() })}
                          title="Gerar nova chave aleatória de 5 dígitos"
                        >
                          <RefreshCw size={15} />
                          <span>Gerar Nova</span>
                        </button>
                        <button
                          type="button"
                          className="btn-key-action btn-copy-key"
                          onClick={() => handleCopyKey(formData.chave_acesso)}
                          title="Copiar chave de acesso"
                        >
                          <Copy size={15} />
                          <span>Copiar</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-key-whatsapp"
                        onClick={() => handleSendWhatsAppKey(formData.nome, formData.chave_acesso, formData.whatsapp || formData.telefone)}
                        title="Enviar chave e link de login diretamente para o WhatsApp do paciente"
                      >
                        <Send size={15} />
                        <span>Enviar Acesso via WhatsApp</span>
                      </button>
                    </div>
                    <span className="field-hint-key-sub">
                      Esta chave numérica de 5 dígitos permite que o paciente acesse exclusivamente o próprio plano alimentar e metas no Portal do Paciente.
                    </span>
                  </div>
                </div>

                <div className="tab-footer">
                  <div></div>
                  <button
                    type="button"
                    className="btn-next-tab"
                    onClick={() => setActiveTab('clinico')}
                  >
                    <span>Próximo: Perfil Clínico &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2 — CLÍNICO */}
            {activeTab === 'clinico' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Peso Atual</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="70"
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
                        placeholder="170"
                        value={formData.altura}
                        onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  {/* Campo IMC (Somente Leitura) */}
                  <div className="form-group full-width">
                    <label className="form-label">IMC (Índice de Massa Corporal — Calculado)</label>
                    <div className="imc-display-box">
                      <Scale size={20} color="#10b981" />
                      <span className="imc-value-text">
                        {imcCalculado.imc ? `${imcCalculado.imc} kg/m²` : 'Preencha peso e altura'}
                      </span>
                      {imcCalculado.classificacao && (
                        <span className="imc-status-badge">{imcCalculado.classificacao}</span>
                      )}
                    </div>
                  </div>

                  {/* Objetivo (Múltipla Escolha + Texto livre) */}
                  <div className="form-group full-width">
                    <label className="form-label">Objetivos Principais</label>
                    <div className="checkbox-pills-grid">
                      {DEFAULT_OBJECTIVES.map((obj) => (
                        <button
                          key={obj}
                          type="button"
                          className={`pill-checkbox ${formData.objetivos_selecionados.includes(obj) ? 'selected' : ''}`}
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

                  {/* Nível de Atividade Física */}
                  <div className="form-group full-width">
                    <label className="form-label">Nível de Atividade Física</label>
                    <div className="radio-group-pills">
                      {[
                        'Sedentário',
                        'Levemente ativo',
                        'Moderadamente ativo',
                        'Muito ativo',
                        'Extremamente ativo'
                      ].map((nivel) => (
                        <button
                          key={nivel}
                          type="button"
                          className={`pill-btn ${formData.nivel_atividade === nivel ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, nivel_atividade: nivel })}
                        >
                          {nivel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patologias */}
                  <div className="form-group full-width">
                    <label className="form-label">Patologias ou Condições de Saúde</label>
                    <div className="checkbox-pills-grid">
                      <button
                        type="button"
                        className={`pill-checkbox ${formData.patologias_selecionadas.includes('Nenhum') ? 'selected' : ''}`}
                        onClick={() => toggleMultiSelect('patologias_selecionadas', 'Nenhum')}
                      >
                        Nenhum
                      </button>
                      {DEFAULT_PATOLOGIAS.map((pat) => (
                        <button
                          key={pat}
                          type="button"
                          className={`pill-checkbox ${formData.patologias_selecionadas.includes(pat) ? 'selected' : ''}`}
                          onClick={() => toggleMultiSelect('patologias_selecionadas', pat)}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                    <div className="custom-add-wrapper mt-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Outra patologia..."
                        value={customPatologiaInput}
                        onChange={(e) => setCustomPatologiaInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-add-custom"
                        onClick={() => addCustomOption('patologias_selecionadas', customPatologiaInput, setCustomPatologiaInput)}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-group full-width">
                    <label className="form-label">Restrições Alimentares</label>
                    <div className="checkbox-pills-grid">
                      <button
                        type="button"
                        className={`pill-checkbox ${formData.restricoes_selecionadas.includes('Nenhum') ? 'selected' : ''}`}
                        onClick={() => toggleMultiSelect('restricoes_selecionadas', 'Nenhum')}
                      >
                        Nenhum
                      </button>
                      {DEFAULT_RESTRICOES.map((res) => (
                        <button
                          key={res}
                          type="button"
                          className={`pill-checkbox ${formData.restricoes_selecionadas.includes(res) ? 'selected' : ''}`}
                          onClick={() => toggleMultiSelect('restricoes_selecionadas', res)}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                    <div className="custom-add-wrapper mt-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Outra restrição..."
                        value={customRestricaoInput}
                        onChange={(e) => setCustomRestricaoInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-add-custom"
                        onClick={() => addCustomOption('restricoes_selecionadas', customRestricaoInput, setCustomRestricaoInput)}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="form-group full-width">
                    <label className="form-label">Alergias Alimentares</label>
                    <div className="checkbox-pills-grid">
                      <button
                        type="button"
                        className={`pill-checkbox ${formData.alergias_selecionadas.includes('Nenhum') ? 'selected' : ''}`}
                        onClick={() => toggleMultiSelect('alergias_selecionadas', 'Nenhum')}
                      >
                        Nenhum
                      </button>
                      {DEFAULT_ALERGIAS.map((ale) => (
                        <button
                          key={ale}
                          type="button"
                          className={`pill-checkbox ${formData.alergias_selecionadas.includes(ale) ? 'selected' : ''}`}
                          onClick={() => toggleMultiSelect('alergias_selecionadas', ale)}
                        >
                          {ale}
                        </button>
                      ))}
                    </div>
                    <div className="custom-add-wrapper mt-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Outra alergia..."
                        value={customAlergiaInput}
                        onChange={(e) => setCustomAlergiaInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-add-custom"
                        onClick={() => addCustomOption('alergias_selecionadas', customAlergiaInput, setCustomAlergiaInput)}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Papanicolau, Anticoncepcional..."
                      rows="2"
                      value={formData.medicamentos}
                      onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suplementos em Uso</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex: Creatina 5g, Whey Protein, Vitamina D..."
                      rows="2"
                      value={formData.suplementos}
                      onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="tab-footer">
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={() => setActiveTab('pessoal')}
                  >
                    &larr; Voltar
                  </button>

                  <button
                    type="button"
                    className="btn-next-tab"
                    onClick={() => setActiveTab('habitos')}
                  >
                    <span>Próximo: Hábitos & Rotina &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 3 — HÁBITOS */}
            {activeTab === 'habitos' && (
              <div className="tab-pane fade-in">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Refeições por dia</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input"
                      placeholder="4"
                      value={formData.refeicoes_dia}
                      onChange={(e) => setFormData({ ...formData, refeicoes_dia: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantidade de Água diária</label>
                    <div className="input-suffix-wrapper">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="2.5"
                        value={formData.agua_litros}
                        onChange={(e) => setFormData({ ...formData, agua_litros: e.target.value })}
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horário que acorda</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 6 → 06:00 ou 630 → 06:30"
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
                      placeholder="Ex: 23 → 23:00 ou 2230 → 22:30"
                      value={formData.horario_dorme}
                      onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, horario_dorme: formatTimeInput(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full-width">
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

                  {formData.pratica_exercicio === 'sim' && (
                    <div className="form-group full-width fade-in">
                      <label className="form-label">Qual atividade e frequência semanal?</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Musculação 4x na semana, Corrida aos sábados"
                        value={formData.exercicio_detalhes}
                        onChange={(e) => setFormData({ ...formData, exercicio_detalhes: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label className="form-label">Observações Gerais</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Anotações adicionais, histórico de dieta, hábitos particulares..."
                      rows="3"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="tab-footer">
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={() => setActiveTab('clinico')}
                  >
                    &larr; Voltar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary-save"
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? 'Salvando Paciente...' : 'Salvar e Ver Perfil'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : (

        /* ========================================================================= */
        /* VISÃO 3: LISTAGEM DE PACIENTES                                             */
        /* ========================================================================= */
        <div className="patients-list-view fade-in">
          <div className="patients-header-bar">
            <div>
              <h2 className="page-title">Gestão de Pacientes</h2>
              <p className="page-subtitle">Listagem de pacientes cadastrados sob sua responsabilidade</p>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenForm(null)}
            >
              <UserPlus size={18} />
              <span>Novo Paciente</span>
            </button>
          </div>

          <div className="patients-filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar paciente por nome, email ou objetivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="patients-table-container">
            {filteredPacientes.length === 0 ? (
              <div className="empty-state">
                <Users size={40} color="#94a3b8" />
                <h3>Nenhum paciente cadastrado ainda</h3>
                <p>Clique em "Novo Paciente" para cadastrar seu primeiro paciente no sistema.</p>
                <button
                  type="button"
                  className="btn-primary mt-3"
                  onClick={() => handleOpenForm(null)}
                >
                  <UserPlus size={18} />
                  <span>Cadastrar Primeiro Paciente</span>
                </button>
              </div>
            ) : (
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Nome do Paciente</th>
                    <th>Chave de Acesso</th>
                    <th>Objetivo</th>
                    <th>Última Consulta</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacientes.map(p => (
                    <tr
                      key={p.id}
                      className="patient-row"
                      onClick={() => {
                        setActivePatient(p);
                        setViewState('profile');
                      }}
                      title="Clique para abrir o perfil do paciente"
                    >
                      <td className="patient-name-cell">
                        <div className="mini-avatar">{p.nome.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className="name-text">{p.nome}</span>
                          <span className="sub-contact-text">{p.email || p.telefone || 'Sem contato extra'}</span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="table-key-wrapper">
                          <span className="table-key-badge" title="Chave de acesso de 5 dígitos para o Portal do Paciente">
                            <KeyRound size={13} color="#06b6d4" />
                            <strong>{p.chave_acesso || '—'}</strong>
                          </span>
                          {p.chave_acesso && (
                            <>
                              <button
                                type="button"
                                className="btn-table-icon-action"
                                onClick={() => handleCopyKey(p.chave_acesso)}
                                title="Copiar Chave de Acesso"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-table-icon-action btn-wa-action"
                                onClick={() => handleSendWhatsAppKey(p.nome, p.chave_acesso, p.whatsapp || p.telefone)}
                                title="Enviar Chave de Acesso via WhatsApp"
                              >
                                <Send size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="objective-badge">{p.objetivo || 'Acompanhamento Geral'}</span>
                      </td>
                      <td className="last-visit-cell">
                        <Calendar size={14} color="#10b981" />
                        <span>{formatDate(p.ultima_consulta)}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePatient(p);
                              setViewState('profile');
                            }}
                          >
                            Ver Perfil
                          </button>

                          <button
                            type="button"
                            className="btn-table-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(p);
                            }}
                            title="Editar este paciente"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
