/**
 * Mobile WebView Performance Optimizations
 * Specifically optimized for Android POS WebView
 */

(function() {
  'use strict';

  // Detect if running in Android WebView
  const isAndroidWebView = typeof window.AndroidPOS !== 'undefined' || 
                           typeof window.AndroidApp !== 'undefined' ||
                           /wv/.test(navigator.userAgent);

  if (!isAndroidWebView) {
    console.log('📱 Not in Android WebView, skipping mobile optimizations');
    return;
  }

  console.log('🚀 Applying Android WebView optimizations...');

  // 1. Disable animations for better performance
  const style = document.createElement('style');
  style.textContent = `
    * {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    
    /* Faster transitions */
    * {
      transition-duration: 0.15s !important;
      animation-duration: 0.15s !important;
    }
    
    /* Disable expensive effects */
    *:not(img):not(video) {
      filter: none !important;
      backdrop-filter: none !important;
    }
    
    /* Hardware acceleration */
    .modal, .dropdown, .tooltip {
      will-change: transform, opacity;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
  `;
  document.head.appendChild(style);

  // 2. Optimize scroll performance
  let ticking = false;
  const optimizeScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', optimizeScroll, { passive: true });
  window.addEventListener('touchmove', optimizeScroll, { passive: true });

  // 3. Preload critical resources
  const preloadCritical = () => {
    // Preload fonts
    const fonts = [
      'Inter',
      'system-ui',
      '-apple-system'
    ];
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    });
  };

  // 4. Optimize images
  const optimizeImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" for off-screen images
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }
      
      // Add decoding="async"
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }
    });
  };

  // 5. Debounce resize events
  let resizeTimeout;
  const optimizeResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      window.dispatchEvent(new Event('optimizedResize'));
    }, 150);
  };
  window.addEventListener('resize', optimizeResize);

  // 6. Reduce memory usage
  const cleanupMemory = () => {
    // Clear old console logs
    if (console.clear && Math.random() > 0.95) {
      console.clear();
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  };

  // 7. Optimize touch events
  const optimizeTouch = () => {
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    document.addEventListener('touchend', function() {}, { passive: true });
  };

  // 8. Disable context menu for better UX
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 9. Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // 10. Optimize network requests
  const optimizeNetwork = () => {
    // Add request timeout
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const options = args[1] || {};
      options.signal = controller.signal;
      
      return originalFetch(args[0], options)
        .finally(() => clearTimeout(timeout));
    };
  };

  // 11. Reduce repaints and reflows
  const optimizeDOM = () => {
    // Batch DOM updates
    window.requestIdleCallback = window.requestIdleCallback || function(cb) {
      const start = Date.now();
      return setTimeout(function() {
        cb({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    };
  };

  // 12. Monitor performance
  const monitorPerformance = () => {
    if (window.performance && window.performance.memory) {
      setInterval(() => {
        const memory = window.performance.memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 90) {
          console.warn('⚠️ High memory usage:', usedPercent.toFixed(2) + '%');
          cleanupMemory();
        }
      }, 30000); // Check every 30 seconds
    }
  };

  // Initialize all optimizations
  const init = () => {
    console.log('✅ Initializing mobile optimizations...');
    
    preloadCritical();
    optimizeTouch();
    optimizeNetwork();
    optimizeDOM();
    monitorPerformance();
    
    // Run image optimization after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeImages);
    } else {
      optimizeImages();
    }
    
    // Periodic cleanup
    setInterval(cleanupMemory, 60000); // Every minute
    
    // Observe DOM changes for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          optimizeImages();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Mobile optimizations applied successfully!');
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose optimization status
  window.mobileOptimizations = {
    enabled: true,
    version: '1.0.0',
    platform: 'android-webview'
  };

})();
