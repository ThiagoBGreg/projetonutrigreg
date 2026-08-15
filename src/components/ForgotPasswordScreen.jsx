import React, { useState } from 'react';
import HeaderLogo from './HeaderLogo';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithToken } from '../lib/neon';

export default function ForgotPasswordScreen({ onNavigateLogin }) {
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
      setStep('finished');
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha. Verifique o código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <HeaderLogo />

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-circle">
            <KeyRound size={26} color="#10b981" />
          </div>
          <h2 className="auth-card-title">Recuperar Senha</h2>
          <p className="auth-card-subtitle">
            {step === 'request' && 'Informe o seu email cadastrado para redefinir sua senha'}
            {step === 'sent' && 'Verifique seu email para prosseguir com a redefinição'}
            {step === 'reset' && 'Digite o código recebido e sua nova senha'}
            {step === 'finished' && 'Sua senha foi redefinida com sucesso!'}
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email cadastrado</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
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
                  <span>Enviando solicitação...</span>
                </>
              ) : (
                <span>Enviar Link de Recuperação</span>
              )}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div className="reset-confirmation">
            <div className="alert-box alert-success">
              <CheckCircle2 size={20} />
              <span>{successMessage}</span>
            </div>

            <p className="text-muted" style={{ fontSize: '0.88rem', margin: '16px 0', lineHeight: 1.5 }}>
              Enviamos um link seguro de recuperação para <strong>{email}</strong>. Caso já possua um código de redefinição, você pode informá-lo abaixo:
            </p>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '12px' }}
              onClick={() => setStep('reset')}
            >
              <KeyRound size={16} />
              <span>Já possuo o código de redefinição</span>
            </button>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleConfirmReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-token">Código ou Token de Verificação</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <KeyRound size={18} />
                </span>
                <input
                  id="reset-token"
                  type="text"
                  className="form-input"
                  placeholder="Cole aqui o código recebido"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">Nova Senha (mínimo 9 caracteres)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="•••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={9}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-password">Confirmar Nova Senha</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="•••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={9}
                  required
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
                  <span>Redefinindo senha...</span>
                </>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </button>
          </form>
        )}

        {step === 'finished' && (
          <div className="reset-confirmation">
            <div className="alert-box alert-success">
              <CheckCircle2 size={20} />
              <span>{successMessage}</span>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '16px', width: '100%' }}
              onClick={onNavigateLogin}
            >
              <span>Acessar Conta com Nova Senha</span>
            </button>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="back-link-btn"
            onClick={onNavigateLogin}
          >
            <ArrowLeft size={16} />
            <span>Voltar para o Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
