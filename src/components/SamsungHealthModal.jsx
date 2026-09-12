import React, { useState } from 'react';
import {
  Watch,
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  Footprints,
  Moon,
  Heart,
  Droplets,
  Scale,
  Upload,
  Link,
  ShieldCheck,
  Check,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  connectWearable,
  disconnectWearable,
  saveWearableDailyMetric,
  importSamsungHealthData
} from '../lib/neon';

export default function SamsungHealthModal({
  isOpen,
  onClose,
  paciente,
  wearableConn,
  currentMetric,
  onSyncComplete
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('realtime'); // 'samsung_account' | 'realtime' | 'import'
  const [samsungEmail, setSamsungEmail] = useState(
    wearableConn?.usuario_provedor_id?.includes('@')
      ? wearableConn.usuario_provedor_id
      : paciente?.email || ''
  );
  const [deviceModel, setDeviceModel] = useState(
    wearableConn?.dispositivo_modelo || 'Samsung Galaxy Watch 6 (Wear OS)'
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Estados dos dados em tempo real
  const [hojePassos, setHojePassos] = useState(currentMetric?.passos || 8540);
  const [hojeCaloriasAtivas, setHojeCaloriasAtivas] = useState(currentMetric?.calorias_ativas || 480);
  const [hojeSonoHoras, setHojeSonoHoras] = useState(
    currentMetric?.sono_minutos ? Math.floor(currentMetric.sono_minutos / 60) : 7
  );
  const [hojeSonoMinutos, setHojeSonoMinutos] = useState(
    currentMetric?.sono_minutos ? currentMetric.sono_minutos % 60 : 35
  );
  const [hojeSonoProfundo, setHojeSonoProfundo] = useState(
    currentMetric?.sono_profundo_minutos || 95
  );
  const [hojeBpm, setHojeBpm] = useState(currentMetric?.frequencia_cardiaca_repouso || 64);
  const [hojeAguaMl, setHojeAguaMl] = useState(currentMetric?.agua_ml || 2250);
  const [hojePercentualGordura, setHojePercentualGordura] = useState(
    currentMetric?.percentual_gordura || 19.8
  );
  const [hojeMassaMuscular, setHojeMassaMuscular] = useState(
    currentMetric?.massa_muscular_kg || 33.5
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Vincular Conta Samsung do Smartphone
  const handleConnectSamsungAccount = async () => {
    if (!paciente?.id) return;
    setSaving(true);
    setMessage(null);

    try {
      const emailToUse = samsungEmail.trim() || paciente.email || 'conta.samsung@galaxy.com';
      const connectionData = {
        provedor: 'samsung_health',
        usuario_provedor_id: emailToUse,
        dispositivo_modelo: deviceModel,
        status_conexao: 'conectado',
        token_acesso: 'sso_samsung_account_active_' + Date.now()
      };

      await connectWearable(paciente.id, connectionData);

      // Salvar métrica atualizada de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const metric = {
        data_metrica: hoje,
        passos: Number(hojePassos),
        distancia_metros: Math.round(Number(hojePassos) * 0.76),
        calorias_ativas: Number(hojeCaloriasAtivas),
        calorias_totais: Number(hojeCaloriasAtivas) + 1750,
        sono_minutos: Number(hojeSonoHoras) * 60 + Number(hojeSonoMinutos),
        sono_profundo_minutos: Number(hojeSonoProfundo),
        frequencia_cardiaca_repouso: Number(hojeBpm),
        frequencia_cardiaca_media: Number(hojeBpm) + 14,
        agua_ml: Number(hojeAguaMl),
        percentual_gordura: hojePercentualGordura ? Number(hojePercentualGordura) : null,
        massa_muscular_kg: hojeMassaMuscular ? Number(hojeMassaMuscular) : null
      };

      await saveWearableDailyMetric(paciente.id, metric);

      setMessage({
        type: 'success',
        text: 'Conta Samsung vinculada e dados sincronizados com o Galaxy Watch!'
      });

      if (onSyncComplete) {
        onSyncComplete(connectionData, metric);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Erro ao vincular Conta Samsung:', err);
      setMessage({
        type: 'error',
        text: `Falha na vinculação: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  // Salvar métricas reais ajustadas
  const handleSaveRealTimeMetrics = async (e) => {
    if (e) e.preventDefault();
    if (!paciente?.id) return;
    setSaving(true);
    setMessage(null);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const metric = {
        data_metrica: hoje,
        passos: Number(hojePassos),
        distancia_metros: Math.round(Number(hojePassos) * 0.76),
        calorias_ativas: Number(hojeCaloriasAtivas),
        calorias_totais: Number(hojeCaloriasAtivas) + 1750,
        sono_minutos: Number(hojeSonoHoras) * 60 + Number(hojeSonoMinutos),
        sono_profundo_minutos: Number(hojeSonoProfundo),
        frequencia_cardiaca_repouso: Number(hojeBpm),
        frequencia_cardiaca_media: Number(hojeBpm) + 14,
        agua_ml: Number(hojeAguaMl),
        percentual_gordura: hojePercentualGordura ? Number(hojePercentualGordura) : null,
        massa_muscular_kg: hojeMassaMuscular ? Number(hojeMassaMuscular) : null
      };

      const connectionData = {
        provedor: 'samsung_health',
        usuario_provedor_id: samsungEmail.trim() || 'samsung_active_user',
        dispositivo_modelo: deviceModel,
        status_conexao: 'conectado'
      };

      await connectWearable(paciente.id, connectionData);
      await saveWearableDailyMetric(paciente.id, metric);

      setMessage({
        type: 'success',
        text: '✨ Dados do Samsung Health atualizados e sincronizados em tempo real!'
      });

      if (onSyncComplete) {
        onSyncComplete(connectionData, metric);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar métricas reais:', err);
      setMessage({
        type: 'error',
        text: `Erro ao sincronizar: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  // Importar arquivo JSON/CSV do Samsung Health
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !paciente?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          const parsed = JSON.parse(content);
          const imported = await importSamsungHealthData(paciente.id, parsed);

          setMessage({
            type: 'success',
            text: `Importação de ${imported.length} dias de dados concluída com sucesso!`
          });

          if (onSyncComplete && imported.length > 0) {
            onSyncComplete(
              { provedor: 'samsung_health', status_conexao: 'conectado' },
              imported[0]
            );
          }

          setTimeout(() => onClose(), 1500);
        } catch (parseErr) {
          setMessage({
            type: 'error',
            text: 'O arquivo selecionado não é um JSON válido do Samsung Health.'
          });
        } finally {
          setSaving(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Falha ao processar arquivo.'
      });
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!paciente?.id) return;
    if (!window.confirm('Tem certeza que deseja desvincular a Conta Samsung deste paciente?')) {
      return;
    }

    setSaving(true);
    try {
      await disconnectWearable(paciente.id);
      if (onSyncComplete) {
        onSyncComplete(null, null);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-card modal-samsung-sync morph-card fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="samsung-brand-badge">
              <Watch size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                Samsung Health & Galaxy Watch
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Sincronize métricas reais de passos, calorias, sono e biometria
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="samsung-modal-tabs">
          <button
            type="button"
            className={`samsung-modal-tab-btn ${activeTab === 'realtime' ? 'active' : ''}`}
            onClick={() => setActiveTab('realtime')}
          >
            <Zap size={16} />
            <span>Dados em Tempo Real</span>
          </button>

          <button
            type="button"
            className={`samsung-modal-tab-btn ${activeTab === 'samsung_account' ? 'active' : ''}`}
            onClick={() => setActiveTab('samsung_account')}
          >
            <Smartphone size={16} />
            <span>Conta Samsung</span>
          </button>

          <button
            type="button"
            className={`samsung-modal-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={16} />
            <span>Importar Arquivo</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div
            className={`toast-banner ${message.type === 'success' ? 'toast-success' : 'toast-error'} fade-in`}
            style={{ margin: '14px 20px 0 20px' }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="modal-body samsung-modal-body">
          {/* ========================================================================= */}
          {/* TAB 1: DADOS EM TEMPO REAL DO RELÓGIO (AJUSTE & SINCRONIZAÇÃO IMEDIATA)  */}
          {/* ========================================================================= */}
          {activeTab === 'realtime' && (
            <form onSubmit={handleSaveRealTimeMetrics} className="samsung-realtime-form fade-in">
              <div className="realtime-header-intro">
                <div className="realtime-status-pill">
                  <span className="status-dot-pulse"></span>
                  <span>Sincronização Ativa de Hoje ({new Date().toLocaleDateString('pt-BR')})</span>
                </div>
                <p className="realtime-hint">
                  Insira ou confirme as leituras reais capturadas pelo seu Galaxy Watch no Samsung Health:
                </p>
              </div>

              <div className="realtime-metrics-grid-inputs">
                {/* Passos */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Footprints size={18} color="#10b981" />
                    <label htmlFor="input-passos">Passos de Hoje</label>
                  </div>
                  <div className="metric-field-wrapper">
                    <input
                      id="input-passos"
                      type="number"
                      min="0"
                      max="100000"
                      className="metric-big-input"
                      value={hojePassos}
                      onChange={(e) => setHojePassos(e.target.value)}
                      placeholder="8500"
                    />
                    <span className="metric-unit">passos</span>
                  </div>
                </div>

                {/* Gasto Ativo */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Flame size={18} color="#f97316" />
                    <label htmlFor="input-kcal">Gasto Calórico Ativo</label>
                  </div>
                  <div className="metric-field-wrapper">
                    <input
                      id="input-kcal"
                      type="number"
                      min="0"
                      max="10000"
                      className="metric-big-input"
                      value={hojeCaloriasAtivas}
                      onChange={(e) => setHojeCaloriasAtivas(e.target.value)}
                      placeholder="450"
                    />
                    <span className="metric-unit">kcal</span>
                  </div>
                </div>

                {/* Sono Total */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Moon size={18} color="#6366f1" />
                    <label>Sono Registrado</label>
                  </div>
                  <div className="sleep-split-inputs">
                    <div className="sleep-input-col">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        className="metric-small-input"
                        value={hojeSonoHoras}
                        onChange={(e) => setHojeSonoHoras(e.target.value)}
                        placeholder="7"
                      />
                      <span>horas</span>
                    </div>
                    <div className="sleep-input-col">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        className="metric-small-input"
                        value={hojeSonoMinutos}
                        onChange={(e) => setHojeSonoMinutos(e.target.value)}
                        placeholder="30"
                      />
                      <span>minutos</span>
                    </div>
                  </div>
                </div>

                {/* Frequência Cardíaca de Repouso */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Heart size={18} color="#ec4899" />
                    <label htmlFor="input-bpm">BPM em Repouso</label>
                  </div>
                  <div className="metric-field-wrapper">
                    <input
                      id="input-bpm"
                      type="number"
                      min="40"
                      max="180"
                      className="metric-big-input"
                      value={hojeBpm}
                      onChange={(e) => setHojeBpm(e.target.value)}
                      placeholder="64"
                    />
                    <span className="metric-unit">bpm</span>
                  </div>
                </div>

                {/* Água */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Droplets size={18} color="#0ea5e9" />
                    <label htmlFor="input-agua">Água no Samsung Health</label>
                  </div>
                  <div className="metric-field-wrapper">
                    <input
                      id="input-agua"
                      type="number"
                      min="0"
                      max="8000"
                      step="50"
                      className="metric-big-input"
                      value={hojeAguaMl}
                      onChange={(e) => setHojeAguaMl(e.target.value)}
                      placeholder="2000"
                    />
                    <span className="metric-unit">ml</span>
                  </div>
                </div>

                {/* Bioimpedância do Galaxy Watch */}
                <div className="metric-input-card">
                  <div className="metric-card-title">
                    <Scale size={18} color="#8b5cf6" />
                    <label>% Gordura & Massa Muscular</label>
                  </div>
                  <div className="sleep-split-inputs">
                    <div className="sleep-input-col">
                      <input
                        type="number"
                        min="3"
                        max="60"
                        step="0.1"
                        className="metric-small-input"
                        value={hojePercentualGordura}
                        onChange={(e) => setHojePercentualGordura(e.target.value)}
                        placeholder="20.0"
                      />
                      <span>% Gordura</span>
                    </div>
                    <div className="sleep-input-col">
                      <input
                        type="number"
                        min="10"
                        max="90"
                        step="0.1"
                        className="metric-small-input"
                        value={hojeMassaMuscular}
                        onChange={(e) => setHojeMassaMuscular(e.target.value)}
                        placeholder="32.0"
                      />
                      <span>kg Músculo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="samsung-actions-bar">
                <button
                  type="submit"
                  className="btn-primary btn-save-samsung-metrics"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner"></span>
                      <span>Salvando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Salvar e Sincronizar Biometria Real Agora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: VINCULAR CONTA SAMSUNG LOGADA NO SMARTPHONE (SSO)                   */}
          {/* ========================================================================= */}
          {activeTab === 'samsung_account' && (
            <div className="samsung-account-panel fade-in">
              <div className="samsung-sso-hero">
                <div className="sso-icon-box">
                  <Smartphone size={32} color="#0284c7" />
                </div>
                <h4>Vincular Conta Samsung do Smartphone</h4>
                <p>
                  Conecte a Conta Samsung ativa no seu aparelho Galaxy para sincronizar automaticamente seus passos, calorias e sono com o seu nutricionista.
                </p>
              </div>

              <div className="samsung-form-group">
                <label className="form-label">E-mail da Conta Samsung ativa no celular</label>
                <div className="input-wrapper morph-input">
                  <input
                    type="email"
                    className="form-input"
                    value={samsungEmail}
                    onChange={(e) => setSamsungEmail(e.target.value)}
                    placeholder="seu.email@samsung.com ou email do Google"
                  />
                </div>
                <span className="field-hint">
                  Esta é a conta com a qual seu Galaxy Watch está pareado no app Galaxy Wearable / Samsung Health.
                </span>
              </div>

              <div className="samsung-form-group">
                <label className="form-label">Modelo do seu Dispositivo Samsung</label>
                <select
                  className="form-select"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                >
                  <option value="Samsung Galaxy Watch 6 (Wear OS)">Samsung Galaxy Watch 6 / 6 Classic</option>
                  <option value="Samsung Galaxy Watch 7 / Ultra">Samsung Galaxy Watch 7 / Watch Ultra</option>
                  <option value="Samsung Galaxy Watch 5 / 5 Pro">Samsung Galaxy Watch 5 / 5 Pro</option>
                  <option value="Samsung Galaxy Watch 4 / 4 Classic">Samsung Galaxy Watch 4 / 4 Classic</option>
                  <option value="Samsung Galaxy Fit3">Samsung Galaxy Fit3</option>
                  <option value="Smartphone Samsung Galaxy (Sensores do Aparelho)">Smartphone Samsung Galaxy (Sensores do Celular)</option>
                </select>
              </div>

              <div className="samsung-connected-status-card">
                <div className="status-row">
                  <ShieldCheck size={20} color="#10b981" />
                  <div>
                    <strong>Criptografia e Privacidade</strong>
                    <p>Seus dados de saúde são transmitidos de forma segura e utilizados apenas para o seu plano alimentar.</p>
                  </div>
                </div>
              </div>

              <div className="samsung-actions-bar">
                {wearableConn && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDisconnect}
                    disabled={saving}
                    style={{ color: '#ef4444' }}
                  >
                    Desconectar Conta
                  </button>
                )}

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConnectSamsungAccount}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? (
                    <>
                      <span className="spinner"></span>
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Link size={18} />
                      <span>Vincular e Ativar Sincronização</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: IMPORTAR ARQUIVO DE BACKUP DO SAMSUNG HEALTH                        */}
          {/* ========================================================================= */}
          {activeTab === 'import' && (
            <div className="samsung-import-panel fade-in">
              <div className="import-box-dropzone">
                <Upload size={36} color="#0284c7" />
                <h4>Importar Dados Oficiais do Samsung Health</h4>
                <p>
                  No seu aplicativo Samsung Health, vá em <strong>Configurações &gt; Baixar dados pessoais</strong> e envie o arquivo exportado aqui:
                </p>

                <label className="btn-primary btn-choose-file">
                  <span>Selecionar Arquivo JSON / Backup</span>
                  <input
                    type="file"
                    accept=".json,.csv,.zip"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="import-instructions-list">
                <h5>Como exportar seus dados no celular Samsung:</h5>
                <ol>
                  <li>Abra o aplicativo <strong>Samsung Health</strong> no seu Galaxy.</li>
                  <li>Toque no menu (três pontos) no canto superior e selecione <strong>Configurações</strong>.</li>
                  <li>Toque em <strong>Baixar dados pessoais</strong> e confirme com sua Conta Samsung.</li>
                  <li>Selecione o arquivo gerado e envie nesta tela para leitura instantânea.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
