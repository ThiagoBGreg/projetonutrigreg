import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Stethoscope, ArrowRight, Sparkles } from 'lucide-react';
import { signUpUser } from '../lib/neon';

export default function RegisterScreen({ onNavigateLogin, onRegisterSuccess, isEmbedded = false }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um endereço de email válido.');
      return;
    }

    if (password.length < 9) {
      setError('A senha deve conter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    try {
      setLoading(true);
      const session = await signUpUser({
        nome,
        email,
        password
      });
      onRegisterSuccess(session);
    } catch (err) {
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
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
          <Stethoscope size={20} color="#10b981" />
        </div>
        <h2 className="auth-card-title">Cadastro de Nutricionista</h2>
        <p className="auth-card-subtitle">Crie seu consultório digital em instantes</p>
      </div>

      {error && (
        <div className="alert-box alert-error morph-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-body">
        <div className="form-group">
          <label className="form-label" htmlFor="register-nome">Nome Completo</label>
          <div className="input-wrapper morph-input">
            <span className="input-icon">
              <User size={18} />
            </span>
            <input
              id="register-nome"
              type="text"
              className="form-input"
              placeholder="Dr(a). Seu Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email Profissional</label>
          <div className="input-wrapper morph-input">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="seu.email@nutricao.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Senha (mínimo 9 caracteres)</label>
          <div className="input-wrapper morph-input">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={9}
              autoComplete="new-password"
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

        <div className="form-group">
          <label className="form-label" htmlFor="register-confirm-password">Confirmar Senha</label>
          <div className="input-wrapper morph-input">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="•••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={9}
              autoComplete="new-password"
            />
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
              <span>Criando conta...</span>
            </>
          ) : (
            <>
              <span>Criar Conta e Acessar</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Já possui uma conta?</span>
        <button
          type="button"
          className="auth-footer-link morph-link"
          onClick={onNavigateLogin}
        >
          Faça login
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
