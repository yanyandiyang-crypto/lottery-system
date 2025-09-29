import React, { useState, useEffect } from 'react';

// Mobile-optimized wrapper component
const MobileOptimized = ({ children, className = '' }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className={`mobile-optimized ${isStandalone ? 'pwa-standalone' : 'pwa-browser'} ${className}`}>
      {/* PWA Install Banner */}
      {showInstallPrompt && !isStandalone && (
        <div className="fixed top-0 left-0 right-0 bg-primary-600 text-white p-3 z-50 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex-1">
              <p className="text-sm font-medium">Install NewBetting App</p>
              <p className="text-xs opacity-90">Get app-like experience on your phone</p>
            </div>
            <div className="flex space-x-2 ml-3">
              <button
                onClick={handleInstallClick}
                className="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${showInstallPrompt && !isStandalone ? 'pt-16' : ''}`}>
        {children}
      </div>

      {/* Mobile-specific styles */}
      <style jsx>{`
        .mobile-optimized {
          min-height: 100vh;
          min-height: 100dvh; /* Dynamic viewport height for mobile */
          touch-action: manipulation; /* Improve touch responsiveness */
          -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
        }

        .pwa-standalone {
          /* Styles for installed PWA */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Improve touch targets */
        .mobile-optimized button,
        .mobile-optimized a,
        .mobile-optimized input,
        .mobile-optimized select {
          min-height: 44px; /* Apple's recommended touch target size */
        }

        /* Prevent zoom on input focus */
        .mobile-optimized input,
        .mobile-optimized select,
        .mobile-optimized textarea {
          font-size: 16px; /* Prevents zoom on iOS */
        }

        /* Smooth scrolling */
        .mobile-optimized {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default MobileOptimized;
