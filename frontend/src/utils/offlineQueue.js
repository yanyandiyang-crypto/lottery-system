/**
 * Offline Queue Manager
 * Stores API requests when offline and syncs when online
 */

const QUEUE_KEY = 'offline_queue';
const SYNC_STATUS_KEY = 'sync_status';

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.isSyncing = false;
    this.setupOnlineListener();
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add request to queue
   * @param {Object} request - { url, method, data, timestamp }
   */
  addToQueue(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
      ...request
    };

    this.queue.push(queueItem);
    this.saveQueue();
    
    console.log('📥 Added to offline queue:', queueItem);
    return queueItem.id;
  }

  /**
   * Get all pending items
   */
  getPendingItems() {
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * Get queue status
   */
  getStatus() {
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;
    const synced = this.queue.filter(i => i.status === 'synced').length;

    return { pending, failed, synced, total: this.queue.length };
  }

  /**
   * Sync queue when online
   */
  async syncQueue(apiClient) {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return;
    }

    const pending = this.getPendingItems();
    if (pending.length === 0) {
      console.log('✅ No items to sync');
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Syncing ${pending.length} items...`);

    for (const item of pending) {
      try {
        // Send request to backend
        const response = await apiClient({
          method: item.method || 'POST',
          url: item.url,
          data: item.data
        });

        // Mark as synced
        item.status = 'synced';
        item.syncedAt = new Date().toISOString();
        item.response = response.data;

        console.log('✅ Synced:', item.url);
      } catch (error) {
        item.retries = (item.retries || 0) + 1;
        
        if (item.retries >= 3) {
          item.status = 'failed';
          item.error = error.message;
          console.error('❌ Failed after 3 retries:', item.url);
        } else {
          console.warn(`⚠️ Retry ${item.retries}/3:`, item.url);
        }
      }

      this.saveQueue();
    }

    this.isSyncing = false;
    
    const status = this.getStatus();
    console.log('📊 Sync complete:', status);
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('queueSynced', { detail: status }));
  }

  /**
   * Clear synced items (older than 24 hours)
   */
  clearOldItems() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.queue = this.queue.filter(item => {
      if (item.status === 'synced') {
        const itemTime = new Date(item.syncedAt || item.timestamp).getTime();
        return itemTime > oneDayAgo;
      }
      return true; // Keep pending and failed items
    });

    this.saveQueue();
  }

  /**
   * Setup online/offline listeners
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored');
      
      // Wait a bit for connection to stabilize
      setTimeout(() => {
        const apiClient = window.__apiClient__;
        if (apiClient) {
          this.syncQueue(apiClient);
        }
      }, 2000);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Internet connection lost - Queue mode enabled');
    });
  }

  /**
   * Manually trigger sync
   */
  async manualSync(apiClient) {
    return this.syncQueue(apiClient);
  }

  /**
   * Clear all queue items
   */
  clearAll() {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️ Queue cleared');
  }

  /**
   * Get failed items for retry
   */
  getFailedItems() {
    return this.queue.filter(item => item.status === 'failed');
  }

  /**
   * Retry failed item
   */
  retryFailed(itemId) {
    const item = this.queue.find(i => i.id === itemId);
    if (item && item.status === 'failed') {
      item.status = 'pending';
      item.retries = 0;
      delete item.error;
      this.saveQueue();
      return true;
    }
    return false;
  }
}

// Export singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;
