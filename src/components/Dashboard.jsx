import React, { useState, useEffect } from 'react';
import HeaderLogo from './HeaderLogo';
import { 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  HeartPulse, 
  Users, 
  UserPlus, 
  Utensils, 
  Search, 
  Plus, 
  Check, 
  Calendar, 
  Scale, 
  Ruler, 
  Droplets, 
  Sparkles,
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  signOutNutricionista, 
  getNutriPatients, 
  savePatientRecord, 
  saveMealPlan 
} from '../lib/neon';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('pacientes'); // 'pacientes' | 'novo-paciente' | 'prescrever-dieta' | 'perfil'
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForDiet, setSelectedPatientForDiet] = useState(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    data_nascimento: '',
    sexo: 'Feminino',
    peso_inicial: '',
    altura: '',
    objetivo_texto: 'Reeducação alimentar e melhoria na disposição',
    nivel_atividade: 'Moderado',
    litros_agua: '2.5',
    refeicoes_por_dia: '5',
    horario_acorda: '07:00',
    horario_dorme: '23:00',
    atividade_fisica: true,
    atividade_fisica_descricao: 'Musculação 3x na semana',
    alergias: '',
    restricoes_alimentares: '',
    medicamentos: '',
    suplementos: 'Creatina e Whey Protein',
    observacoes: ''
  });

  // Diet Plan Form State
  const [dietMeals, setDietMeals] = useState([
    { titulo: 'Café da Manhã', horario: '07:30', itens: 'Ovos mexidos (2 unidades) + 1 fatia de pão 100% integral\nCafé preto sem açúcar\n1 porção de mamão picado com sementes de chia' },
    { titulo: 'Lanche da Manhã', horario: '10:00', itens: '1 pote de iogurte natural desnatado\n1 punhado de mix de castanhas (20g)' },
    { titulo: 'Almoço', horario: '12:30', itens: 'Salada de folhas verdes à vontade com azeite de oliva\nArroz integral (3 colheres de sopa) + Feijão carioca (1 concha média)\nFilé de peito de frango grelhado ou filé de peixe (130g)\nLegumes no vapor (brócolis e cenoura)' },
    { titulo: 'Lanche da Tarde', horario: '16:00', itens: '1 maçã ou banana com 1 colher de sopa de pasta de amendoim ou aveia' },
    { titulo: 'Jantar', horario: '19:30', itens: 'Omelete de 2 ovos com espinafre e tomate ou Sopa de legumes com frango\nMix de folhas verdes com sementes de girassol' }
  ]);

  const [formSaving, setFormSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  useEffect(() => {
    loadPatientsList();
  }, [user]);

  async function loadPatientsList() {
    try {
      setLoadingPatients(true);
      const list = await getNutriPatients(user?.id || user?.email);
      setPatients(list);
      if (list.length > 0 && !selectedPatientForDiet) {
        setSelectedPatientForDiet(list[0]);
      }
    } catch (e) {
      console.warn('Erro ao buscar pacientes:', e);
    } finally {
      setLoadingPatients(false);
    }
  }

  const handleLogout = async () => {
    await signOutNutricionista();
    onLogout();
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    setFormFeedback(null);

    try {
      setFormSaving(true);
      const payload = {
        ...newPatient,
        nutricionista_id: user?.id || null,
        alergias: newPatient.alergias ? newPatient.alergias.split(',').map(s => s.trim()).filter(Boolean) : [],
        restricoes_alimentares: newPatient.restricoes_alimentares ? newPatient.restricoes_alimentares.split(',').map(s => s.trim()).filter(Boolean) : [],
        objetivos: [newPatient.objetivo_texto]
      };

      const saved = await savePatientRecord(payload);
      setFormFeedback({ type: 'success', message: `Paciente ${saved.nome} cadastrado(a) com sucesso!` });
      await loadPatientsList();

      // Reset form
      setNewPatient({
        nome: '',
        email: '',
        whatsapp: '',
        data_nascimento: '',
        sexo: 'Feminino',
        peso_inicial: '',
        altura: '',
        objetivo_texto: 'Reeducação alimentar e melhoria na disposição',
        nivel_atividade: 'Moderado',
        litros_agua: '2.5',
        refeicoes_por_dia: '5',
        horario_acorda: '07:00',
        horario_dorme: '23:00',
        atividade_fisica: true,
        atividade_fisica_descricao: 'Musculação 3x na semana',
        alergias: '',
        restricoes_alimentares: '',
        medicamentos: '',
        suplementos: 'Creatina e Whey Protein',
        observacoes: ''
      });

      setTimeout(() => {
        setActiveTab('pacientes');
        setFormFeedback(null);
      }, 1500);
    } catch (err) {
      setFormFeedback({ type: 'error', message: err.message || 'Erro ao salvar paciente.' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleSaveDiet = async (e) => {
    e.preventDefault();
    if (!selectedPatientForDiet) {
      setFormFeedback({ type: 'error', message: 'Selecione um paciente para prescrever o plano alimentar.' });
      return;
    }

    try {
      setFormSaving(true);
      const formattedMeals = dietMeals.map(m => ({
        titulo: m.titulo,
        horario: m.horario,
        itens: typeof m.itens === 'string' ? m.itens.split('\n').map(i => i.trim()).filter(Boolean) : m.itens
      }));

      await saveMealPlan(selectedPatientForDiet.id, { refeicoes: formattedMeals });
      setFormFeedback({ type: 'success', message: `Plano alimentar salvo para ${selectedPatientForDiet.nome}! O paciente já pode visualizá-lo em seu portal.` });
      await loadPatientsList();
    } catch (err) {
      setFormFeedback({ type: 'error', message: err.message || 'Erro ao prescrever dieta.' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleAddMealRow = () => {
    setDietMeals([
      ...dietMeals,
      { titulo: 'Nova Refeição / Ceia', horario: '21:30', itens: 'Chá de camomila + 1 castanha' }
    ]);
  };

  const handleRemoveMealRow = (index) => {
    setDietMeals(dietMeals.filter((_, i) => i !== index));
  };

  const handleUpdateMeal = (index, field, value) => {
    const next = [...dietMeals];
    next[index][field] = value;
    setDietMeals(next);
  };

  const filteredPatients = patients.filter(p => 
    p.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <nav className="dashboard-nav">
        <HeaderLogo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="badge-nutri">
            <ShieldCheck size={16} />
            <span>Nutricionista Responsável</span>
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
        <div className="welcome-banner">
          <div>
            <h2 className="welcome-title">
              Painel Profissional — Dr(a). {user?.name || 'Nutricionista'} 🩺
            </h2>
            <p className="welcome-subtitle">
              Gerencie seus pacientes, prescreva planos alimentares e acompanhe a evolução de cada tratamento.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nutri-nav-tabs">
          <button
            className={`nutri-tab-btn ${activeTab === 'pacientes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pacientes'); setFormFeedback(null); }}
          >
            <Users size={18} />
            <span>Meus Pacientes ({patients.length})</span>
          </button>

          <button
            className={`nutri-tab-btn ${activeTab === 'novo-paciente' ? 'active' : ''}`}
            onClick={() => { setActiveTab('novo-paciente'); setFormFeedback(null); }}
          >
            <UserPlus size={18} />
            <span>Cadastrar Novo Paciente</span>
          </button>

          <button
            className={`nutri-tab-btn ${activeTab === 'prescrever-dieta' ? 'active' : ''}`}
            onClick={() => { setActiveTab('prescrever-dieta'); setFormFeedback(null); }}
          >
            <Utensils size={18} />
            <span>Prescrever Plano Alimentar</span>
          </button>

          <button
            className={`nutri-tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => { setActiveTab('perfil'); setFormFeedback(null); }}
          >
            <UserCheck size={18} />
            <span>Meus Dados</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {formFeedback && (
          <div className={`alert-box ${formFeedback.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
            {formFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{formFeedback.message}</span>
          </div>
        )}

        {/* TAB 1: PACIENTES */}
        {activeTab === 'pacientes' && (
          <div className="patients-view-section">
            <div className="patients-toolbar">
              <div className="search-box-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar paciente por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 20px' }}
                onClick={() => setActiveTab('novo-paciente')}
              >
                <Plus size={16} />
                <span>Adicionar Paciente</span>
              </button>
            </div>

            {loadingPatients ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                <p className="text-muted">Carregando pacientes cadastrados...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="empty-state-card">
                <Users size={48} color="#94a3b8" />
                <h3>Nenhum paciente encontrado</h3>
                <p>
                  {searchQuery 
                    ? 'Nenhum resultado corresponde à sua pesquisa.' 
                    : 'Você ainda não possui pacientes cadastrados. Clique em "Adicionar Paciente" para iniciar.'}
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', marginTop: '12px' }}
                  onClick={() => setActiveTab('novo-paciente')}
                >
                  <Plus size={16} />
                  <span>Cadastrar Primeiro Paciente</span>
                </button>
              </div>
            ) : (
              <div className="patients-cards-grid">
                {filteredPatients.map((p) => (
                  <div key={p.id} className="patient-summary-card">
                    <div className="patient-card-header">
                      <div className="patient-avatar-circle">
                        {p.nome?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div className="patient-meta">
                        <h4 className="patient-card-name">{p.nome}</h4>
                        <span className="patient-card-email">{p.email || 'Email não cadastrado'}</span>
                      </div>
                    </div>

                    <div className="patient-metrics-row">
                      <div className="metric-pill">
                        <Scale size={14} color="#10b981" />
                        <span>{p.peso_inicial ? `${p.peso_inicial} kg` : '--'}</span>
                      </div>
                      <div className="metric-pill">
                        <Ruler size={14} color="#3b82f6" />
                        <span>{p.altura ? `${p.altura} m` : '--'}</span>
                      </div>
                      <div className="metric-pill">
                        <Droplets size={14} color="#0ea5e9" />
                        <span>{p.litros_agua ? `${p.litros_agua}L` : '2.5L'}</span>
                      </div>
                    </div>

                    <p className="patient-objective-tag">
                      <strong>Foco:</strong> {p.objetivo_texto || (Array.isArray(p.objetivos) ? p.objetivos[0] : 'Reeducação')}
                    </p>

                    <div className="patient-card-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedPatientForDiet(p);
                          setActiveTab('prescrever-dieta');
                        }}
                      >
                        <Utensils size={14} />
                        <span>Prescrever Dieta</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CADASTRAR PACIENTE (ANAMNESE) */}
        {activeTab === 'novo-paciente' && (
          <div className="form-card-section">
            <div className="section-header-row" style={{ marginBottom: '24px' }}>
              <div>
                <h3 className="section-title">Ficha de Anamnese & Cadastro do Paciente</h3>
                <p className="section-subtitle">
                  Preencha os dados clínicos e antropométricos. O paciente poderá acessar o portal com o email cadastrado.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePatient}>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Nome Completo do Paciente *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nome completo"
                    value={newPatient.nome}
                    onChange={(e) => setNewPatient({ ...newPatient, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email do Paciente (usado para login)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="paciente@exemplo.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(11) 99999-9999"
                    value={newPatient.whatsapp}
                    onChange={(e) => setNewPatient({ ...newPatient, whatsapp: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPatient.data_nascimento}
                    onChange={(e) => setNewPatient({ ...newPatient, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <select
                    className="form-input form-select"
                    value={newPatient.sexo}
                    onChange={(e) => setNewPatient({ ...newPatient, sexo: e.target.value })}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-row-4">
                <div className="form-group">
                  <label className="form-label">Peso Atual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="Ex: 72.5"
                    value={newPatient.peso_inicial}
                    onChange={(e) => setNewPatient({ ...newPatient, peso_inicial: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 1.70"
                    value={newPatient.altura}
                    onChange={(e) => setNewPatient({ ...newPatient, altura: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Meta de Água (Litros/dia)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="Ex: 2.5"
                    value={newPatient.litros_agua}
                    onChange={(e) => setNewPatient({ ...newPatient, litros_agua: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Refeições/dia</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ex: 5"
                    value={newPatient.refeicoes_por_dia}
                    onChange={(e) => setNewPatient({ ...newPatient, refeicoes_por_dia: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Objetivo Principal do Tratamento</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Emagrecimento, Hipertrofia, Controle de glicemia..."
                  value={newPatient.objetivo_texto}
                  onChange={(e) => setNewPatient({ ...newPatient, objetivo_texto: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Alergias Alimentares (separar por vírgula)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Amendoim, Lactose, Glúten..."
                    value={newPatient.alergias}
                    onChange={(e) => setNewPatient({ ...newPatient, alergias: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Restrições / Intolerâncias (separar por vírgula)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Frutos do mar, Açúcar refinado..."
                    value={newPatient.restricoes_alimentares}
                    onChange={(e) => setNewPatient({ ...newPatient, restricoes_alimentares: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Horário de Acordar / Dormir</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Acorda: 07:00"
                      value={newPatient.horario_acorda}
                      onChange={(e) => setNewPatient({ ...newPatient, horario_acorda: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Dorme: 23:00"
                      value={newPatient.horario_dorme}
                      onChange={(e) => setNewPatient({ ...newPatient, horario_dorme: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Atividade Física Praticada</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Musculação 4x/sem, Corrida..."
                    value={newPatient.atividade_fisica_descricao}
                    onChange={(e) => setNewPatient({ ...newPatient, atividade_fisica_descricao: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações & Recomendações Gerais</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Orientações comportamentais, metas de mastigação, etc."
                  value={newPatient.observacoes}
                  onChange={(e) => setNewPatient({ ...newPatient, observacoes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={formSaving}
                style={{ marginTop: '12px' }}
              >
                {formSaving ? (
                  <>
                    <span className="spinner"></span>
                    <span>Salvando dados do paciente...</span>
                  </>
                ) : (
                  <span>Salvar Ficha do Paciente</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PRESCREVER DIETA */}
        {activeTab === 'prescrever-dieta' && (
          <div className="form-card-section">
            <div className="section-header-row" style={{ marginBottom: '24px' }}>
              <div>
                <h3 className="section-title">Prescrição de Plano Alimentar</h3>
                <p className="section-subtitle">
                  Configure o cardápio e refeições. Ficará disponível imediatamente no portal do paciente.
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Selecione o Paciente</label>
              <select
                className="form-input form-select"
                value={selectedPatientForDiet?.id || ''}
                onChange={(e) => {
                  const p = patients.find(x => x.id === e.target.value);
                  setSelectedPatientForDiet(p || null);
                }}
              >
                <option value="">Selecione um paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.email || 'sem email'})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientForDiet && (
              <form onSubmit={handleSaveDiet}>
                <div className="diet-builder-header">
                  <h4>Refeições do Cardápio ({selectedPatientForDiet.nome})</h4>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleAddMealRow}
                  >
                    <Plus size={14} />
                    <span>Adicionar Refeição</span>
                  </button>
                </div>

                <div className="diet-meals-container">
                  {dietMeals.map((meal, idx) => (
                    <div key={idx} className="diet-meal-edit-card">
                      <div className="diet-meal-edit-header">
                        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            style={{ fontWeight: 600, maxWidth: '240px' }}
                            placeholder="Título da Refeição (ex: Café da Manhã)"
                            value={meal.titulo}
                            onChange={(e) => handleUpdateMeal(idx, 'titulo', e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            className="form-input form-input-sm"
                            style={{ maxWidth: '120px' }}
                            placeholder="08:00"
                            value={meal.horario}
                            onChange={(e) => handleUpdateMeal(idx, 'horario', e.target.value)}
                          />
                        </div>

                        {dietMeals.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon-danger"
                            onClick={() => handleRemoveMealRow(idx)}
                            title="Remover refeição"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.82rem' }}>Alimentos & Porções (um por linha)</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="Digite os itens da refeição (um por linha)..."
                          value={typeof meal.itens === 'string' ? meal.itens : meal.itens.join('\n')}
                          onChange={(e) => handleUpdateMeal(idx, 'itens', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formSaving}
                  style={{ marginTop: '20px' }}
                >
                  {formSaving ? (
                    <>
                      <span className="spinner"></span>
                      <span>Salvando Plano Alimentar...</span>
                    </>
                  ) : (
                    <span>Publicar Plano Alimentar para o Paciente</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: PERFIL */}
        {activeTab === 'perfil' && (
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
        )}
      </main>
    </div>
  );
}
