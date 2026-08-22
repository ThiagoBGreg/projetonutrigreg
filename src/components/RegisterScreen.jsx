import React, { useState, useEffect } from 'react';
import HeaderLogo from './HeaderLogo';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Stethoscope, HeartHandshake } from 'lucide-react';
import { signUpUser, getNutricionistasList } from '../lib/neon';

export default function RegisterScreen({ onNavigateLogin, onRegisterSuccess }) {
  const [role, setRole] = useState('nutricionista'); // 'nutricionista' | 'paciente'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nutricionistas, setNutricionistas] = useState([]);
  const [selectedNutriId, setSelectedNutriId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadNutris() {
      try {
        const list = await getNutricionistasList();
        setNutricionistas(list);
        if (list.length > 0) {
          setSelectedNutriId(list[0].id);
        }
      } catch (e) {
        console.warn('Erro ao carregar lista de nutricionistas:', e);
      }
    }
    loadNutris();
  }, []);

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
        role,
        nome,
        email,
        password,
        nutricionistaId: role === 'paciente' ? (selectedNutriId || null) : null
      });
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
          <p className="auth-card-subtitle">Selecione seu perfil e faça seu cadastro</p>
        </div>

        {/* Profile Selector */}
        <div className="role-selector-container">
          <button
            type="button"
            className={`role-tab-btn ${role === 'nutricionista' ? 'active' : ''}`}
            onClick={() => setRole('nutricionista')}
          >
            <Stethoscope size={18} />
            <span>Nutricionista</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${role === 'paciente' ? 'active' : ''}`}
            onClick={() => setRole('paciente')}
          >
            <HeartHandshake size={18} />
            <span>Paciente</span>
          </button>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-nome">
              {role === 'nutricionista' ? 'Nome Completo (Profissional)' : 'Nome Completo'}
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="reg-nome"
                type="text"
                className="form-input"
                placeholder={role === 'nutricionista' ? 'Dr(a). Gregory Rodrigues' : 'Seu nome completo'}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              {role === 'nutricionista' ? 'Email Profissional' : 'Seu Email'}
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="reg-email"
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

          {role === 'paciente' && nutricionistas.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nutri">Seu Nutricionista Responsável</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <Stethoscope size={18} />
                </span>
                <select
                  id="reg-nutri"
                  className="form-input form-select"
                  value={selectedNutriId}
                  onChange={(e) => setSelectedNutriId(e.target.value)}
                >
                  <option value="">Selecione seu nutricionista...</option>
                  {nutricionistas.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nome} ({n.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
                <span>Criando conta de {role}...</span>
              </>
            ) : (
              <span>Cadastrar como {role === 'nutricionista' ? 'Nutricionista' : 'Paciente'}</span>
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
