/**
 * React Performance Optimizer for Mobile WebView
 * Reduces lag and improves responsiveness in Android POS WebView
 */

// Detect Android WebView
export const isAndroidWebView = () => {
  return typeof window.AndroidPOS !== 'undefined' || 
         typeof window.AndroidApp !== 'undefined' ||
         /wv/.test(navigator.userAgent);
};

// Detect low-spec device (SMART detection for 1GB RAM devices)
export const isLowSpecDevice = () => {
  // PRIORITY 1: Always optimize for POS devices (Android WebView)
  if (typeof window.AndroidPOS !== 'undefined' || typeof window.AndroidApp !== 'undefined') {
    console.log('🔍 Low-spec mode: POS device detected');
    return true;
  }
  
  // PRIORITY 2: Check device memory (most reliable indicator)
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory <= 2) {
      console.log(`🔍 Low-spec mode: Low RAM detected (${navigator.deviceMemory}GB)`);
      return true; // 2GB or less
    } else {
      console.log(`✅ Normal mode: Good RAM (${navigator.deviceMemory}GB)`);
      return false; // Desktop/high-end device
    }
  }
  
  // PRIORITY 3: Check CPU cores (secondary indicator)
  if (navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 2) {
      console.log(`🔍 Low-spec mode: Low CPU cores (${navigator.hardwareConcurrency})`);
      return true;
    } else {
      console.log(`✅ Normal mode: Good CPU (${navigator.hardwareConcurrency} cores)`);
      return false; // Desktop/high-end device
    }
  }
  
  // PRIORITY 4: Check connection speed
  if (navigator.connection) {
    const slowConnections = ['slow-2g', '2g', '3g'];
    if (slowConnections.includes(navigator.connection.effectiveType)) {
      console.log(`🔍 Low-spec mode: Slow connection (${navigator.connection.effectiveType})`);
      return true;
    }
  }
  
  // PRIORITY 5: Mobile detection (but only if no other info available)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    console.log('🔍 Low-spec mode: Mobile device (no memory info)');
    return true; // Assume low-spec for mobile without memory info
  }
  
  // DEFAULT: Desktop without memory info = assume normal mode
  console.log('✅ Normal mode: Desktop device');
  return false;
};

// Get performance mode based on device
export const getPerformanceMode = () => {
  if (isLowSpecDevice()) {
    return 'low-spec'; // Disable animations, reduce features
  }
  return 'normal'; // Full features
};

// Debounce function for expensive operations
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll/resize events
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Optimize component rendering
export const shouldComponentUpdate = (prevProps, nextProps, keys = []) => {
  if (keys.length === 0) {
    return JSON.stringify(prevProps) !== JSON.stringify(nextProps);
  }
  
  return keys.some(key => prevProps[key] !== nextProps[key]);
};

// Memory cleanup
export const cleanupMemory = () => {
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
};

// Performance monitoring
export const measurePerformance = (name, callback) => {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  
  if (end - start > 100) {
    console.warn(`⚠️ Slow operation: ${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

// Export all utilities
const performanceOptimizer = {
  isAndroidWebView,
  isLowSpecDevice,
  getPerformanceMode,
  debounce,
  throttle,
  shouldComponentUpdate,
  cleanupMemory,
  measurePerformance
};

export default performanceOptimizer;
