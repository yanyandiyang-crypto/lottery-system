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

// Detect low-spec device (optimized for 1GB RAM devices)
export const isLowSpecDevice = () => {
  // AGGRESSIVE: Assume low-spec for mobile devices (most POS are 1-2GB)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check device memory (if available)
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory <= 2) {
      return true; // 2GB or less (includes 1GB devices)
    }
  }
  
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return true; // 2 cores or less
  }
  
  // Check connection speed
  if (navigator.connection) {
    const slowConnections = ['slow-2g', '2g', '3g'];
    if (slowConnections.includes(navigator.connection.effectiveType)) {
      return true; // Slow internet
    }
  }
  
  // Default to low-spec for mobile WebView (POS devices)
  if (typeof window.AndroidPOS !== 'undefined' || typeof window.AndroidApp !== 'undefined') {
    return true; // Always optimize for POS devices
  }
  
  // Default to low-spec for all mobile devices
  return isMobile;
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
