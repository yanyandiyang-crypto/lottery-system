/**
 * React Performance Optimizer for Mobile WebView
 * Reduces lag and improves responsiveness in Android POS WebView
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

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
  return useMemo(() => value, dependencies);
};

// Optimized polling hook with adaptive intervals
export const useAdaptivePolling = (queryFn, options = {}) => {
  const {
    enabled = true,
    baseInterval = 60000, // 60s default
    activeInterval = 30000, // 30s when user is active
    inactiveInterval = 120000, // 2min when inactive
    onlyWhenVisible = true
  } = options;

  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsActive(true);
    };

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Check activity every 30s
    const activityCheck = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      setIsActive(timeSinceActivity < 60000); // Active if activity in last 60s
    }, 30000);

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(activityCheck);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calculate dynamic interval
  const interval = useMemo(() => {
    if (!enabled || (onlyWhenVisible && !isVisible)) return false;
    return isActive ? activeInterval : inactiveInterval;
  }, [enabled, isActive, isVisible, activeInterval, inactiveInterval, onlyWhenVisible]);

  return interval;
};

// Virtual list hook for large datasets
export const useVirtualList = (items, options = {}) => {
  const {
    itemHeight = 60,
    overscan = 3,
    containerHeight = 600
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, overscan, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerProps: {
      onScroll: handleScroll,
      style: { height: containerHeight, overflow: 'auto' }
    }
  };
};

// Memoized expensive calculation hook
export const useMemoizedCalculation = (calculationFn, dependencies) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const start = performance.now();
    const result = calculationFn();
    const duration = performance.now() - start;
    
    if (duration > 50) {
      console.warn(`⚠️ Expensive calculation took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, dependencies);
};

// Optimized event handler hook
export const useOptimizedCallback = (callback, dependencies, delay = 0) => {
  const timeoutRef = useRef(null);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    } else {
      callback(...args);
    }
  }, dependencies);
};

// Batch state updates
export const useBatchedUpdates = () => {
  const updatesRef = useRef([]);
  const timeoutRef = useRef(null);

  const batchUpdate = useCallback((updateFn) => {
    updatesRef.current.push(updateFn);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = updatesRef.current;
      updatesRef.current = [];
      updates.forEach(fn => fn());
    }, 16); // Next frame
  }, []);

  return batchUpdate;
};

// Image lazy loading
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, imgRef };
};

const performanceOptimizer = {
  isAndroidWebView,
  debounce,
  throttle,
  shouldComponentUpdate,
  cleanupMemory,
  measurePerformance,
  useAdaptivePolling,
  useVirtualList,
  useMemoizedCalculation,
  useOptimizedCallback,
  useBatchedUpdates,
  useLazyImage
};

export default performanceOptimizer;
