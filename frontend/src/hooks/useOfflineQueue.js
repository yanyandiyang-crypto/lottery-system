import { useState, useEffect } from 'react';
import offlineQueue from '../utils/offlineQueue';
import api from '../utils/api';

/**
 * Hook to manage offline queue status and sync
 */
export function useOfflineQueue() {
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    failed: 0,
    synced: 0,
    total: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update status on mount
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Back online - syncing queue...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Offline - queue mode enabled');
    };

    // Listen for queue sync events
    const handleQueueSynced = (event) => {
      setQueueStatus(event.detail);
      setIsSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('queueSynced', handleQueueSynced);

    // Setup API client for queue
    window.__apiClient__ = api;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('queueSynced', handleQueueSynced);
    };
  }, []);

  const updateStatus = () => {
    const status = offlineQueue.getStatus();
    setQueueStatus(status);
  };

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      await offlineQueue.manualSync(api);
      updateStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearQueue = () => {
    offlineQueue.clearAll();
    updateStatus();
  };

  const retryFailed = (itemId) => {
    const success = offlineQueue.retryFailed(itemId);
    if (success) {
      updateStatus();
      syncNow();
    }
    return success;
  };

  return {
    queueStatus,
    isOnline,
    isSyncing,
    syncNow,
    clearQueue,
    retryFailed,
    updateStatus
  };
}

export default useOfflineQueue;
