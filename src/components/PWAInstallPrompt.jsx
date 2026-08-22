import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2 } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem('nutri_pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('nutri_pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || installed) return null;

  return (
    <div className="pwa-install-banner fade-in">
      <div className="pwa-banner-content">
        <div className="pwa-icon-box">
          <Smartphone size={24} color="#10b981" />
        </div>
        <div className="pwa-banner-text">
          <h4>Instalar Nutri Rodrigues</h4>
          <p>Adicione o app na tela inicial do seu dispositivo para acesso rápido e offline!</p>
        </div>
      </div>

      <div className="pwa-banner-actions">
        <button type="button" className="btn-pwa-install" onClick={handleInstallClick}>
          <Download size={16} />
          <span>Instalar App</span>
        </button>
        <button type="button" className="btn-pwa-close" onClick={handleDismiss} title="Fechar">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
