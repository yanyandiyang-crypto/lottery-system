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

// Optimize React re-renders
export const useMemoizedValue = (value, dependencies = []) => {
  // Simple memoization helper
  return React.useMemo(() => value, dependencies);
};

export default {
  isAndroidWebView,
  debounce,
  throttle,
  shouldComponentUpdate,
  cleanupMemory,
  measurePerformance
};
