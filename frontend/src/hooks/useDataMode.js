import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing data modes (Live vs Snapshot)
 * Provides real-time data updates or periodic snapshots
 */
export const useDataMode = (initialMode = 'live', refreshInterval = 30000) => {
  const { user } = useAuth();
  const [dataMode, setDataMode] = useState(initialMode);
  const [isLive, setIsLive] = useState(initialMode === 'live');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh interval for live mode
  useEffect(() => {
    let interval;
    
    if (isLive) {
      interval = setInterval(() => {
        setRefreshCount(prev => prev + 1);
        setLastUpdate(new Date());
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, refreshInterval]);

  const toggleDataMode = useCallback(() => {
    const newMode = dataMode === 'live' ? 'snapshot' : 'live';
    setDataMode(newMode);
    setIsLive(newMode === 'live');
    setLastUpdate(new Date());
  }, [dataMode]);

  const forceRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshCount(prev => prev + 1);
    setLastUpdate(new Date());
    
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const getDataModeConfig = useCallback(() => ({
    mode: dataMode,
    isLive,
    refreshInterval,
    lastUpdate,
    refreshCount,
    isRefreshing,
    toggleMode: toggleDataMode,
    forceRefresh
  }), [dataMode, isLive, refreshInterval, lastUpdate, refreshCount, isRefreshing, toggleDataMode, forceRefresh]);

  return getDataModeConfig();
};

/**
 * Hook for managing data fetching with live/snapshot modes
 */
export const useDataFetcher = (fetchFunction, dependencies = [], options = {}) => {
  const {
    mode = 'live',
    refreshInterval = 30000,
    autoFetch = true,
    onError = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onError]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Auto-refresh for live mode
  useEffect(() => {
    let interval;
    
    if (mode === 'live' && autoFetch) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, refreshInterval, fetchData, autoFetch]);

  // Re-fetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch: fetchData
  };
};

/**
 * Hook for managing multiple data sources with different modes
 */
export const useMultiDataManager = (dataSources = []) => {
  const [globalMode, setGlobalMode] = useState('live');
  const [dataStates, setDataStates] = useState({});

  const updateGlobalMode = useCallback((newMode) => {
    setGlobalMode(newMode);
    // Update all data sources
    dataSources.forEach(source => {
      if (source.updateMode) {
        source.updateMode(newMode);
      }
    });
  }, [dataSources]);

  const refreshAll = useCallback(() => {
    dataSources.forEach(source => {
      if (source.refresh) {
        source.refresh();
      }
    });
  }, [dataSources]);

  const getGlobalStatus = useCallback(() => ({
    mode: globalMode,
    totalSources: dataSources.length,
    lastUpdates: Object.values(dataStates).map(state => state.lastUpdate),
    hasErrors: Object.values(dataStates).some(state => state.error)
  }), [globalMode, dataSources.length, dataStates]);

  return {
    globalMode,
    updateGlobalMode,
    refreshAll,
    getGlobalStatus,
    dataStates,
    setDataStates
  };
};
