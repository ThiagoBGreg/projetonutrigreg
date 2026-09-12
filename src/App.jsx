import React, { useState, useEffect } from 'react';
import LandingHeroShowcase from './components/LandingHeroShowcase';
import Dashboard from './components/Dashboard';
import PatientDashboard from './components/PatientDashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { getActiveSession } from './lib/neon';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const activeSession = await getActiveSession();
        if (activeSession && activeSession.user) {
          setSession(activeSession);
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
  };

  const handleRegisterSuccess = (newSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  if (loading) {
    return (
      <div className="global-loader-screen">
        <div className="loader-card-morph morph-shape">
          <div className="spinner-emerald"></div>
          <p className="loader-text">
            Iniciando <strong>Nutri Rodrigues</strong>...
          </p>
          <span className="loader-subtext">Nutrição & Bem-Estar em Tempo Real</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <PWAInstallPrompt />

      {session ? (
        session.role === 'patient' || session.user?.isPatient ? (
          <PatientDashboard user={session.user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={session.user} onLogout={handleLogout} />
        )
      ) : (
        <LandingHeroShowcase
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </>
  );
}
