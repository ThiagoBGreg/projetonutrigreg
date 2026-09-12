import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, KeyRound, User, Stethoscope } from 'lucide-react';
import { signInUser, signInPatientWithKey } from '../lib/neon';

export default function LoginScreen({ onNavigateRegister, onNavigateForgotPassword, onLoginSuccess, isEmbedded = false }) {
  const [loginType, setLoginType] = useState('nutri'); // 'nutri' | 'paciente'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [patientKey, setPatientKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitNutri = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor, preencha o email e a senha.');
      return;
    }

    try {
      setLoading(true);
      const session = await signInUser({ email, password });
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Erro ao efetuar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    setError(null);

    const clean = patientKey.replace(/\D/g, '').trim();
    if (clean.length !== 5) {
      setError('Informe a chave de acesso de 5 dígitos fornecida pelo seu nutricionista.');
      return;
    }

    try {
      setLoading(true);
      const session = await signInPatientWithKey(clean);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Chave de acesso inválida ou não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={`auth-card ${isEmbedded ? 'auth-card-embedded' : 'morph-card'}`}>
      {!isEmbedded && (
        <div className="auth-card-brand-top">
          <HeaderLogo />
        </div>
      )}

      {/* Tabs de Seleção de Perfil: Nutricionista vs Paciente */}
      <div className="auth-type-tabs">
        <button
          type="button"
          className={`auth-type-tab-btn ${loginType === 'nutri' ? 'active' : ''}`}
          onClick={() => {
            setLoginType('nutri');
            setError(null);
          }}
        >
          <Stethoscope size={16} />
          <span>Nutricionista</span>
        </button>

        <button
          type="button"
          className={`auth-type-tab-btn ${loginType === 'paciente' ? 'active' : ''}`}
          onClick={() => {
            setLoginType('paciente');
            setError(null);
          }}
        >
          <KeyRound size={16} />
          <span>Área do Paciente (5 Dígitos)</span>
        </button>
      </div>

      <div className="auth-card-header">
        <div className="auth-icon-badge morph-circle">
          {loginType === 'nutri' ? (
            <Sparkles size={20} color="#10b981" />
          ) : (
            <KeyRound size={20} color="#06b6d4" className="sparkle-spin" />
          )}
        </div>
        <h2 className="auth-card-title">
          {loginType === 'nutri' ? 'Acesso do Profissional' : 'Portal Exclusivo do Paciente'}
        </h2>
        <p className="auth-card-subtitle">
          {loginType === 'nutri'
            ? 'Área de gestão clínica e prescrições nutricionais'
            : 'Consulte seu cardápio semanal, metas e orientações com sua chave'}
        </p>
      </div>

      {error && (
        <div className="alert-box alert-error morph-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loginType === 'nutri' ? (
        /* Formulário Nutricionista */
        <form onSubmit={handleSubmitNutri} className="auth-form-body">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Seu email cadastrado</label>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">Senha de acesso</label>
              <button
                type="button"
                className="forgot-password-link morph-link"
                onClick={onNavigateForgotPassword}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password-btn morph-btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary morph-btn glow-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Consultório</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="demo-access-divider">
            <span>ou acesse rapidamente</span>
          </div>

          <button
            type="button"
            className="btn-secondary btn-demo-quick-login morph-btn"
            onClick={() => {
              const demoSession = {
                user: {
                  id: '2fbe80cf-4b31-49ce-956a-b3aaac6f1da0',
                  name: 'Dra. Ana Maria (Nutricionista)',
                  email: 'nutri@nutrigreg.com'
                },
                token: 'demo_session_active'
              };
              localStorage.setItem('nutri_rodrigues_session', JSON.stringify(demoSession));
              onLoginSuccess(demoSession);
            }}
          >
            <Sparkles size={16} color="#10b981" />
            <span>⚡ Acesso Rápido ao Consultório</span>
          </button>
        </form>
      ) : (
        /* Formulário Paciente - Chave de 5 Dígitos */
        <form onSubmit={handleSubmitPatient} className="auth-form-body patient-key-form">
          <div className="form-group">
            <label className="form-label" htmlFor="patient-key">
              Digite sua Chave de Acesso (5 Dígitos)
            </label>
            <div className="input-wrapper morph-input patient-key-input-wrapper">
              <span className="input-icon">
                <KeyRound size={20} color="#06b6d4" />
              </span>
              <input
                id="patient-key"
                type="text"
                maxLength={5}
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input patient-key-input"
                placeholder="1 2 3 4 5"
                value={patientKey}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setPatientKey(val);
                }}
                required
                autoFocus
              />
            </div>
            <span className="field-hint-key">
              Exemplo de chaves cadastradas: <strong>16194</strong> ou <strong>76460</strong>
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary morph-btn glow-btn btn-patient-submit"
            disabled={loading || patientKey.length !== 5}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Acessando seu Plano...</span>
              </>
            ) : (
              <>
                <span>Acessar Meu Plano Alimentar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      <div className="auth-footer">
        {loginType === 'nutri' ? (
          <>
            <span>Não tem uma conta cadastrada?</span>
            <button
              type="button"
              className="auth-footer-link morph-link"
              onClick={onNavigateRegister}
            >
              Cadastre-se grátis
            </button>
          </>
        ) : (
          <span className="patient-footer-info">
            A chave é gerada pelo nutricionista durante o seu cadastro na clínica.
          </span>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="auth-container standalone-auth">
      {content}
    </div>
  );
}
