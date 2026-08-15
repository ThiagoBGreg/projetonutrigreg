import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import Dashboard from './components/Dashboard';
import { getActiveSession } from './lib/neon';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('login'); // 'login' | 'register' | 'dashboard'

  useEffect(() => {
    async function checkAuth() {
      try {
        const activeSession = await getActiveSession();
        if (activeSession && activeSession.user) {
          setSession(activeSession);
          setScreen('dashboard');
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
    setScreen('dashboard');
  };

  const handleRegisterSuccess = (newSession) => {
    setSession(newSession);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    setScreen('login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Carregando <strong>Nutri Rodrigues</strong>...</p>
        </div>
      </div>
    );
  }

  if (screen === 'dashboard' && session) {
    return <Dashboard user={session.user} onLogout={handleLogout} />;
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onNavigateLogin={() => setScreen('login')}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateRegister={() => setScreen('register')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
