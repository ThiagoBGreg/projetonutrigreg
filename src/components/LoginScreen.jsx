import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { signInUser } from '../lib/neon';

export default function LoginScreen({ onNavigateRegister, onNavigateForgotPassword, onLoginSuccess, isEmbedded = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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

  const content = (
    <div className={`auth-card ${isEmbedded ? 'auth-card-embedded' : 'morph-card'}`}>
      {!isEmbedded && (
        <div className="auth-card-brand-top">
          <HeaderLogo />
        </div>
      )}

      <div className="auth-card-header">
        <div className="auth-icon-badge morph-circle">
          <Sparkles size={20} color="#10b981" />
        </div>
        <h2 className="auth-card-title">Acesse sua Conta</h2>
        <p className="auth-card-subtitle">Área de gestão clínica e planos nutricionais</p>
      </div>

      {error && (
        <div className="alert-box alert-error morph-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-body">
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
      </form>

      <div className="auth-footer">
        <span>Não tem uma conta cadastrada?</span>
        <button
          type="button"
          className="auth-footer-link morph-link"
          onClick={onNavigateRegister}
        >
          Cadastre-se grátis
        </button>
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
