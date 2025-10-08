/**
 * Performance Configuration for Low-End Devices
 * 
 * This configuration optimizes the app for low-end devices by:
 * - Reducing API call frequency
 * - Implementing aggressive caching
 * - Limiting concurrent requests
 * - Managing memory usage
 */

// Device detection
const isLowEndDevice = () => {
  // Check for Android 6 or below
  const androidVersion = navigator.userAgent.match(/Android\s([0-9\.]*)/);
  if (androidVersion && parseFloat(androidVersion[1]) < 7) {
    return true;
  }

  // Check for low memory (if available)
  if (navigator.deviceMemory && navigator.deviceMemory < 2) {
    return true;
  }

  // Check for slow connection
  if (navigator.connection) {
    const conn = navigator.connection;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      return true;
    }
  }

  return false;
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Device detection
  IS_LOW_END: isLowEndDevice(),
  
  // API Configuration
  API: {
    // Max concurrent requests
    MAX_CONCURRENT: isLowEndDevice() ? 2 : 6,
    
    // Request timeout
    TIMEOUT: isLowEndDevice() ? 15000 : 30000,
    
    // Retry attempts
    MAX_RETRIES: isLowEndDevice() ? 1 : 3,
    
    // Cache duration (ms)
    CACHE_DURATION: isLowEndDevice() ? 60000 : 30000, // 1min vs 30s
    
    // Polling intervals (ms)
    POLL_INTERVAL: {
      FAST: isLowEndDevice() ? 10000 : 5000,    // 10s vs 5s
      NORMAL: isLowEndDevice() ? 30000 : 15000, // 30s vs 15s
      SLOW: isLowEndDevice() ? 60000 : 30000,   // 60s vs 30s
    },
    
    // Batch requests
    ENABLE_BATCHING: true,
    BATCH_DELAY: 50, // Wait 50ms to batch requests
  },

  // UI Configuration
  UI: {
    // Pagination
    PAGE_SIZE: isLowEndDevice() ? 10 : 20,
    
    // Virtual scrolling threshold
    VIRTUAL_SCROLL_THRESHOLD: isLowEndDevice() ? 50 : 100,
    
    // Debounce delays (ms)
    DEBOUNCE: {
      SEARCH: isLowEndDevice() ? 500 : 300,
      INPUT: isLowEndDevice() ? 300 : 150,
      RESIZE: isLowEndDevice() ? 200 : 100,
    },
    
    // Throttle delays (ms)
    THROTTLE: {
      SCROLL: isLowEndDevice() ? 200 : 100,
      RESIZE: isLowEndDevice() ? 300 : 150,
    },
    
    // Animation settings
    ANIMATIONS: {
      ENABLED: !isLowEndDevice(),
      DURATION: isLowEndDevice() ? 100 : 200,
    },
    
    // Image loading
    LAZY_LOAD_IMAGES: true,
    IMAGE_QUALITY: isLowEndDevice() ? 0.7 : 0.9,
  },

  // Memory Management
  MEMORY: {
    // Clear cache when exceeds (items)
    MAX_CACHE_SIZE: isLowEndDevice() ? 50 : 100,
    
    // Clear old data (ms)
    CACHE_EXPIRY: isLowEndDevice() ? 300000 : 600000, // 5min vs 10min
    
    // Limit stored tickets
    MAX_STORED_TICKETS: isLowEndDevice() ? 20 : 50,
    
    // Auto cleanup interval (ms)
    CLEANUP_INTERVAL: 60000, // Every minute
  },

  // Offline Queue
  OFFLINE: {
    // Max queue size
    MAX_QUEUE_SIZE: isLowEndDevice() ? 50 : 100,
    
    // Sync batch size
    SYNC_BATCH_SIZE: isLowEndDevice() ? 5 : 10,
    
    // Sync interval (ms)
    SYNC_INTERVAL: 30000, // 30 seconds
    
    // Auto sync on reconnect
    AUTO_SYNC: true,
  },

  // Network
  NETWORK: {
    // Timeout for connectivity check (ms)
    CHECK_TIMEOUT: 3000,
    
    // Retry delay (ms)
    RETRY_DELAY: isLowEndDevice() ? 2000 : 1000,
    
    // Connection check interval (ms)
    CHECK_INTERVAL: 10000, // 10 seconds
  },

  // Data Loading
  DATA: {
    // Prefetch data
    ENABLE_PREFETCH: !isLowEndDevice(),
    
    // Preload images
    ENABLE_PRELOAD: !isLowEndDevice(),
    
    // Lazy load components
    ENABLE_LAZY_LOAD: true,
  },
};

// Helper functions
export const getPollingInterval = (type = 'NORMAL') => {
  return PERFORMANCE_CONFIG.API.POLL_INTERVAL[type] || PERFORMANCE_CONFIG.API.POLL_INTERVAL.NORMAL;
};

export const shouldAnimationsBeEnabled = () => {
  return PERFORMANCE_CONFIG.UI.ANIMATIONS.ENABLED;
};

export const getDebounceDelay = (type = 'INPUT') => {
  return PERFORMANCE_CONFIG.UI.DEBOUNCE[type] || PERFORMANCE_CONFIG.UI.DEBOUNCE.INPUT;
};

export const getThrottleDelay = (type = 'SCROLL') => {
  return PERFORMANCE_CONFIG.UI.THROTTLE[type] || PERFORMANCE_CONFIG.UI.THROTTLE.SCROLL;
};

export const getPageSize = () => {
  return PERFORMANCE_CONFIG.UI.PAGE_SIZE;
};

export const shouldUseVirtualScroll = (itemCount) => {
  return itemCount > PERFORMANCE_CONFIG.UI.VIRTUAL_SCROLL_THRESHOLD;
};

// Log configuration on startup
console.log('📊 Performance Config:', {
  isLowEnd: PERFORMANCE_CONFIG.IS_LOW_END,
  pageSize: PERFORMANCE_CONFIG.UI.PAGE_SIZE,
  pollInterval: PERFORMANCE_CONFIG.API.POLL_INTERVAL.NORMAL,
  maxConcurrent: PERFORMANCE_CONFIG.API.MAX_CONCURRENT,
  animations: PERFORMANCE_CONFIG.UI.ANIMATIONS.ENABLED,
});

export default PERFORMANCE_CONFIG;

