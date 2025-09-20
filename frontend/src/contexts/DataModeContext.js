import React, { createContext, useContext, useState, useCallback } from 'react';

const DataModeContext = createContext();

export const useDataModeContext = () => {
  const context = useContext(DataModeContext);
  if (!context) {
    throw new Error('useDataModeContext must be used within a DataModeProvider');
  }
  return context;
};

export const DataModeProvider = ({ children }) => {
  const [globalDataMode, setGlobalDataMode] = useState('live');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastGlobalUpdate, setLastGlobalUpdate] = useState(new Date());
  const [dataSources, setDataSources] = useState(new Map());

  const toggleGlobalMode = useCallback(() => {
    const newMode = globalDataMode === 'live' ? 'snapshot' : 'live';
    setGlobalDataMode(newMode);
    setLastGlobalUpdate(new Date());
    
    // Notify all registered data sources
    dataSources.forEach(source => {
      if (source.onModeChange) {
        source.onModeChange(newMode);
      }
    });
  }, [globalDataMode, dataSources]);

  const updateRefreshInterval = useCallback((newInterval) => {
    setRefreshInterval(newInterval);
    
    // Notify all registered data sources
    dataSources.forEach(source => {
      if (source.onIntervalChange) {
        source.onIntervalChange(newInterval);
      }
    });
  }, [dataSources]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const registerDataSource = useCallback((id, source) => {
    setDataSources(prev => new Map(prev.set(id, source)));
  }, []);

  const unregisterDataSource = useCallback((id) => {
    setDataSources(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const refreshAllData = useCallback(() => {
    setLastGlobalUpdate(new Date());
    
    // Trigger refresh for all registered data sources
    dataSources.forEach(source => {
      if (source.refresh) {
        source.refresh();
      }
    });
  }, [dataSources]);

  const getDataSourceStatus = useCallback(() => {
    const status = {
      total: dataSources.size,
      live: 0,
      snapshot: 0,
      errors: 0,
      lastUpdates: []
    };

    dataSources.forEach(source => {
      if (source.mode === 'live') status.live++;
      else status.snapshot++;
      
      if (source.error) status.errors++;
      if (source.lastUpdate) status.lastUpdates.push(source.lastUpdate);
    });

    return status;
  }, [dataSources]);

  const value = {
    // Global state
    globalDataMode,
    refreshInterval,
    autoRefresh,
    lastGlobalUpdate,
    
    // Actions
    toggleGlobalMode,
    updateRefreshInterval,
    toggleAutoRefresh,
    refreshAllData,
    
    // Data source management
    registerDataSource,
    unregisterDataSource,
    getDataSourceStatus,
    
    // Computed values
    isLive: globalDataMode === 'live',
    isSnapshot: globalDataMode === 'snapshot'
  };

  return (
    <DataModeContext.Provider value={value}>
      {children}
    </DataModeContext.Provider>
  );
};
