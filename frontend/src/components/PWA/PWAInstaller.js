import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success('NewBetting app installed successfully! 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing NewBetting app...');
      } else {
        toast.info('App installation cancelled');
      }
      
      // Clean up
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Failed to install app');
    }
  };

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast.success('New version available! Refresh to update.', {
                  duration: 5000,
                  action: {
                    label: 'Refresh',
                    onClick: () => window.location.reload()
                  }
                });
              }
            });
          });
        } catch (error) {
          console.log('SW registration failed: ', error);
        }
      });
    }
  }, []);

  // Don't render if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-lg shadow-lg z-50 mx-auto max-w-md">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            📱
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">Install NewBetting App</h3>
          <p className="text-xs opacity-90 mt-1">
            Get faster access, offline support, and app-like experience
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstall}
              className="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setIsInstallable(false)}
              className="text-white opacity-75 hover:opacity-100 text-sm"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;
