import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInUser } from '../lib/neon';

export default function LoginScreen({ onNavigateRegister, onNavigateForgotPassword, onLoginSuccess }) {
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

  return (
    <div className="auth-container">
      <HeaderLogo />

      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Acesse sua Conta</h2>
          <p className="auth-card-subtitle">Área de acesso para nutricionistas e pacientes</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Seu email cadastrado</label>
            <div className="input-wrapper">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Senha</label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={onNavigateForgotPassword}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="input-wrapper">
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
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Entrando no sistema...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta?
          <span
            className="auth-footer-link"
            onClick={onNavigateRegister}
            role="button"
            tabIndex={0}
          >
            Cadastre-se
          </span>
        </div>
      </div>
    </div>
  );
}
