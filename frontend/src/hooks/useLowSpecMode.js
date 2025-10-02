import { useEffect, useState } from 'react';
import { isLowSpecDevice, getPerformanceMode } from '../utils/performanceOptimizer';

/**
 * Hook to detect and apply low-spec device optimizations
 */
export function useLowSpecMode() {
  const [isLowSpec, setIsLowSpec] = useState(false);
  const [performanceMode, setPerformanceMode] = useState('normal');

  useEffect(() => {
    // Detect device capabilities
    const lowSpec = isLowSpecDevice();
    const mode = getPerformanceMode();
    
    setIsLowSpec(lowSpec);
    setPerformanceMode(mode);

    // Apply low-spec class to body if needed
    if (lowSpec) {
      document.body.classList.add('low-spec-mode');
      console.log('⚡ Low-spec mode enabled - animations disabled');
    } else {
      document.body.classList.remove('low-spec-mode');
      console.log('✅ Normal performance mode');
    }

    // Log device info
    console.log('📱 Device Info:', {
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown',
      performanceMode: mode
    });

    // Cleanup
    return () => {
      document.body.classList.remove('low-spec-mode');
    };
  }, []);

  return {
    isLowSpec,
    performanceMode,
    shouldDisableAnimations: isLowSpec,
    shouldReduceEffects: isLowSpec
  };
}

export default useLowSpecMode;
