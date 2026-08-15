import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { signUpNutricionista } from '../lib/neon';

export default function RegisterScreen({ onNavigateLogin, onRegisterSuccess }) {
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
      const session = await signUpNutricionista({ nome, email, password });
      onRegisterSuccess(session);
    } catch (err) {
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <HeaderLogo />

      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Criar Conta</h2>
          <p className="auth-card-subtitle">Cadastre-se como nutricionista no sistema</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-nome">Nome Completo</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="reg-nome"
                type="text"
                className="form-input"
                placeholder="Dr. Gregory House"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Profissional</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="seu.email@nutrirodrigues.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Senha (mínimo 9 caracteres)</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={9}
                required
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm-password">Confirmar Senha</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={9}
                required
                autoComplete="new-password"
              />
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
                <span>Criando conta...</span>
              </>
            ) : (
              <span>Criar conta</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta?
          <span
            className="auth-footer-link"
            onClick={onNavigateLogin}
            role="button"
            tabIndex={0}
          >
            Faça login
          </span>
        </div>
      </div>
    </div>
  );
}
