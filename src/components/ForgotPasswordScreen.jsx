import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithToken } from '../lib/neon';

export default function ForgotPasswordScreen({ onNavigateLogin, isEmbedded = false }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request' | 'sent' | 'reset'
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um endereço de email válido.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestPasswordReset({ email });
      setSuccessMessage(res.message);
      setStep('sent');
    } catch (err) {
      setError(err.message || 'Erro ao solicitar recuperação de senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Informe o código ou token recebido.');
      return;
    }

    if (newPassword.length < 9) {
      setError('A nova senha deve conter no mínimo 9 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordWithToken({ token, newPassword });
      setSuccessMessage(res.message);
      setStep('reset_success');
    } catch (err) {
      setError(err.message || 'Código inválido ou expirado. Tente novamente.');
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
          <KeyRound size={20} color="#10b981" />
        </div>
        <h2 className="auth-card-title">Recuperação de Senha</h2>
        <p className="auth-card-subtitle">
          {step === 'request' && 'Informe seu email para receber o link de redefinição'}
          {step === 'sent' && 'Insira o token recebido para criar uma nova senha'}
          {step === 'reset_success' && 'Sua senha foi redefinida com sucesso!'}
        </p>
      </div>

      {error && (
        <div className="alert-box alert-error morph-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && step !== 'reset_success' && (
        <div className="alert-box alert-success morph-alert">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {step === 'request' && (
        <form onSubmit={handleRequestReset} className="auth-form-body">
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">Seu email cadastrado</label>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="forgot-email"
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

          <button
            type="submit"
            className="btn-primary morph-btn glow-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Enviando código...</span>
              </>
            ) : (
              <>
                <span>Enviar Instruções</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      {step === 'sent' && (
        <form onSubmit={handleConfirmReset} className="auth-form-body">
          <div className="form-group">
            <label className="form-label" htmlFor="reset-token">Código / Token Recebido</label>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <KeyRound size={18} />
              </span>
              <input
                id="reset-token"
                type="text"
                className="form-input"
                placeholder="Insira o token de segurança"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">Nova Senha (mín. 9 caracteres)</label>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={9}
              />
              <button
                type="button"
                className="toggle-password-btn morph-btn-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">Confirmar Nova Senha</label>
            <div className="input-wrapper morph-input">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={9}
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
                <span>Salvando nova senha...</span>
              </>
            ) : (
              <span>Redefinir e Salvar Senha</span>
            )}
          </button>
        </form>
      )}

      {step === 'reset_success' && (
        <div className="reset-success-container">
          <div className="success-badge-circle morph-circle">
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <p className="success-text">Sua senha foi redefinida com sucesso! Você já pode entrar no sistema.</p>
          <button
            type="button"
            className="btn-primary morph-btn"
            onClick={onNavigateLogin}
          >
            Ir para Login
          </button>
        </div>
      )}

      <div className="auth-footer">
        <button
          type="button"
          className="back-to-login-link morph-link"
          onClick={onNavigateLogin}
        >
          <ArrowLeft size={16} />
          <span>Voltar para o Login</span>
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
