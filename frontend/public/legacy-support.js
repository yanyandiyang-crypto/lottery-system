/**
 * Legacy Browser Support for Android 6 (Marshmallow)
 * Adds polyfills and fixes for older WebView versions
 */

(function() {
  console.log('🔧 Loading legacy browser support for Android 6...');

  // 1. Polyfill for Promise (Android 6 WebView may have issues)
  if (typeof Promise === 'undefined') {
    console.warn('⚠️ Promise not supported, loading polyfill...');
    window.Promise = function(executor) {
      var callbacks = [];
      var errbacks = [];
      var resolved = false;
      var rejected = false;
      var value;
      
      function resolve(val) {
        if (resolved || rejected) return;
        resolved = true;
        value = val;
        callbacks.forEach(function(cb) { cb(val); });
      }
      
      function reject(err) {
        if (resolved || rejected) return;
        rejected = true;
        value = err;
        errbacks.forEach(function(eb) { eb(err); });
      }
      
      this.then = function(onResolve, onReject) {
        if (resolved) onResolve && onResolve(value);
        else callbacks.push(onResolve);
        if (rejected) onReject && onReject(value);
        else errbacks.push(onReject);
        return this;
      };
      
      this.catch = function(onReject) {
        return this.then(null, onReject);
      };
      
      executor(resolve, reject);
    };
  }

  // 2. Polyfill for fetch (Android 6 may not have it)
  if (typeof fetch === 'undefined') {
    console.warn('⚠️ Fetch not supported, using XMLHttpRequest fallback...');
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        options = options || {};
        
        xhr.open(options.method || 'GET', url);
        
        // Set headers
        if (options.headers) {
          Object.keys(options.headers).forEach(function(key) {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }
        
        xhr.onload = function() {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            json: function() {
              return Promise.resolve(JSON.parse(xhr.responseText));
            },
            text: function() {
              return Promise.resolve(xhr.responseText);
            }
          });
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        xhr.ontimeout = function() {
          reject(new Error('Request timeout'));
        };
        
        xhr.timeout = 30000; // 30 second timeout
        xhr.send(options.body || null);
      });
    };
  }

  // 3. Polyfill for Object.assign (Android 6 may not have it)
  if (typeof Object.assign !== 'function') {
    console.warn('⚠️ Object.assign not supported, adding polyfill...');
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource != null) {
          for (var key in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, key)) {
              to[key] = nextSource[key];
            }
          }
        }
      }
      return to;
    };
  }

  // 4. Polyfill for Array.from (Android 6 may not have it)
  if (!Array.from) {
    console.warn('⚠️ Array.from not supported, adding polyfill...');
    Array.from = function(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    };
  }

  // 5. Polyfill for Array.includes
  if (!Array.prototype.includes) {
    console.warn('⚠️ Array.includes not supported, adding polyfill...');
    Array.prototype.includes = function(searchElement) {
      return this.indexOf(searchElement) !== -1;
    };
  }

  // 6. Polyfill for String.includes
  if (!String.prototype.includes) {
    console.warn('⚠️ String.includes not supported, adding polyfill...');
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') start = 0;
      return this.indexOf(search, start) !== -1;
    };
  }

  // 7. Polyfill for requestAnimationFrame
  if (!window.requestAnimationFrame) {
    console.warn('⚠️ requestAnimationFrame not supported, adding polyfill...');
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 16); // ~60fps
    };
  }

  // 8. Polyfill for requestIdleCallback
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback) {
      var start = Date.now();
      return setTimeout(function() {
        callback({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    };
  }

  // 9. Fix for localStorage issues in Android 6
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch (e) {
    console.error('⚠️ localStorage not available, using memory fallback...');
    var memoryStorage = {};
    window.localStorage = {
      getItem: function(key) { return memoryStorage[key] || null; },
      setItem: function(key, value) { memoryStorage[key] = String(value); },
      removeItem: function(key) { delete memoryStorage[key]; },
      clear: function() { memoryStorage = {}; }
    };
  }

  // 10. Disable expensive CSS features for Android 6-8
  if (androidVersion > 0 && androidVersion < 9) {
    var style = document.createElement('style');
    style.textContent = `
      /* CRITICAL: Disable ALL expensive effects on Android 6 */
      *, *::before, *::after {
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background-image: none !important;
        -webkit-background-clip: border-box !important;
        background-clip: border-box !important;
      }
      
      /* Disable all animations */
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        transform: none !important;
        -webkit-transform: none !important;
      }
      
      /* Replace gradients with solid colors */
      .bg-gradient-to-r,
      .bg-gradient-to-br,
      .bg-gradient-to-l,
      .bg-gradient-to-t,
      .bg-gradient-to-b {
        background: #2563eb !important;
        background-image: none !important;
      }
      
      /* Simplify borders */
      * {
        border-radius: 4px !important;
      }
      
      /* Disable GPU acceleration (causes lag on Android 6) */
      * {
        will-change: auto !important;
        backface-visibility: visible !important;
        -webkit-backface-visibility: visible !important;
        perspective: none !important;
        -webkit-perspective: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ Android 6-8 CSS optimizations applied');
  }

  // 11. Optimize images for Android 6
  document.addEventListener('DOMContentLoaded', function() {
    var images = document.querySelectorAll('img');
    images.forEach(function(img) {
      // Disable lazy loading on Android 6 (may not work properly)
      img.removeAttribute('loading');
      
      // Add error handler
      img.onerror = function() {
        this.style.display = 'none';
      };
    });
  });

  // 12. Reduce memory usage
  setInterval(function() {
    // Clear old console logs
    if (console.clear && Math.random() > 0.8) {
      console.clear();
    }
  }, 60000); // Every minute

  // 13. Faster timeout for slow connections
  var originalSetTimeout = window.setTimeout;
  window.setTimeout = function(callback, delay) {
    // Reduce delays for better perceived performance
    if (delay > 1000) delay = 1000;
    return originalSetTimeout(callback, delay);
  };

  // 14. Optimize form inputs
  document.addEventListener('DOMContentLoaded', function() {
    var inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(function(input) {
      // Disable autocomplete for better performance
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
    });
  });

  // 15. Detect Android version
  var androidVersion = (function() {
    var match = navigator.userAgent.match(/Android\s([0-9\.]*)/);
    return match ? parseFloat(match[1]) : 0;
  })();

  console.log('📱 Android version detected:', androidVersion);

  if (androidVersion > 0 && androidVersion < 9) {
    console.warn('⚠️ Running on Android ' + androidVersion + ' (6-8) - Legacy mode enabled');
    
    // Add warning banner
    window.addEventListener('load', function() {
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff9800;color:#000;padding:8px;text-align:center;font-size:12px;z-index:99999;';
      banner.innerHTML = '⚠️ Android ' + androidVersion + ' detected. Optimizations enabled for better performance.';
      document.body.insertBefore(banner, document.body.firstChild);
      
      // Auto-hide after 5 seconds
      setTimeout(function() {
        banner.style.display = 'none';
      }, 5000);
    });
  }

  // 16. Optimize network requests for slow connections
  var originalFetch = window.fetch;
  window.fetch = function(url, options) {
    options = options || {};
    
    // Shorter timeout for Android 6
    var controller = new AbortController ? new AbortController() : null;
    if (controller) {
      var timeout = setTimeout(function() {
        controller.abort();
      }, 15000); // 15 second timeout (shorter for Android 6)
      
      options.signal = controller.signal;
    }
    
    return originalFetch(url, options)
      .finally(function() {
        if (controller) clearTimeout(timeout);
      });
  };

  console.log('✅ Legacy browser support loaded successfully!');

  // Expose legacy support status
  window.legacySupport = {
    enabled: true,
    androidVersion: androidVersion,
    isLegacy: androidVersion > 0 && androidVersion < 9
  };

})();
