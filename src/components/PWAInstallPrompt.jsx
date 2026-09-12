import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  WifiOff,
  Wifi,
  Sparkles
} from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // 2. Detect iOS / Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    setIsIOS(isIosDevice);

    // 3. Android/Chrome native prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('nutri_pwa_dismissed_time');
      const now = Date.now();
      // Show prompt if not dismissed in the last 24h
      if (!dismissed || now - Number(dismissed) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('nutri_pwa_installed', 'true');
    });

    // 4. Online/Offline network listeners
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setShowOfflineToast(false);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If iOS and not standalone and not dismissed recently, show subtle prompt
    if (isIosDevice && isSafari && !isStandaloneMode) {
      const dismissed = localStorage.getItem('nutri_pwa_dismissed_time');
      const now = Date.now();
      if (!dismissed || now - Number(dismissed) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Para instalar, abra o menu do seu navegador e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('nutri_pwa_dismissed_time', String(Date.now()));
  };

  return (
    <>
      {/* Toast de Offline / Conexão */}
      {showOfflineToast && (
        <div className="network-status-toast toast-offline fade-in">
          <WifiOff size={18} />
          <div className="network-toast-text">
            <strong>Modo Offline Ativo</strong>
            <span>Você está desconectado. Seus dados e planos salvos continuam acessíveis no cache.</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setShowOfflineToast(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {showOnlineToast && (
        <div className="network-status-toast toast-online fade-in">
          <Wifi size={18} />
          <div className="network-toast-text">
            <strong>Conexão Restabelecida!</strong>
            <span>Sincronizando suas prescrições e dados biométricos em tempo real.</span>
          </div>
          <button type="button" className="toast-close" onClick={() => setShowOnlineToast(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Banner de Instalação Mobile PWA */}
      {showPrompt && !isStandalone && (
        <aside aria-label="Instalação do Aplicativo" className="pwa-install-banner fade-in">
          <div className="pwa-banner-content">
            <div className="pwa-icon-box morph-shape">
              <Smartphone size={24} color="#10b981" />
            </div>
            <div className="pwa-banner-text">
              <h4>Instalar Nutri Rodrigues</h4>
              <p>Adicione o app à sua tela inicial para acesso instantâneo, offline e notificações!</p>
            </div>
          </div>

          <div className="pwa-banner-actions">
            <button type="button" className="btn-pwa-install morph-btn" onClick={handleInstallClick}>
              <Download size={16} />
              <span>{isIOS ? 'Como Instalar no iPhone' : 'Instalar App'}</span>
            </button>
            <button type="button" className="btn-pwa-close" onClick={handleDismiss} title="Fechar">
              <X size={18} />
            </button>
          </div>
        </aside>
      )}

      {/* Modal / Sheet com Guia de Instalação no iOS Safari */}
      {showIOSGuide && (
        <div className="modal-overlay fade-in" onClick={() => setShowIOSGuide(false)}>
          <div className="modal-card modal-ios-guide fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Smartphone size={22} color="#10b981" />
                <h3>Instalar no iPhone / iPad</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowIOSGuide(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body ios-instructions-body">
              <div className="ios-step-card">
                <div className="step-num">1</div>
                <div className="step-desc">
                  <p>
                    No menu inferior do Safari, toque no botão <strong>Compartilhar</strong>:
                  </p>
                  <div className="step-icon-highlight">
                    <Share2 size={24} color="#0284c7" />
                    <span>Ícone de Compartilhamento</span>
                  </div>
                </div>
              </div>

              <div className="ios-step-card">
                <div className="step-num">2</div>
                <div className="step-desc">
                  <p>
                    Role a lista para baixo e selecione <strong>Adicionar à Tela de Início</strong>:
                  </p>
                  <div className="step-icon-highlight">
                    <PlusSquare size={24} color="#10b981" />
                    <span>Adicionar à Tela de Início</span>
                  </div>
                </div>
              </div>

              <div className="ios-step-card">
                <div className="step-num">3</div>
                <div className="step-desc">
                  <p>
                    Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O app aparecerá como um aplicativo nativo.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowIOSGuide(false)}
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
