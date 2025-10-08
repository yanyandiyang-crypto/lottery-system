/**
 * API Request Batcher
 * 
 * Batches multiple API requests together to reduce network overhead
 * Particularly useful for low-end devices with limited bandwidth
 */

import PERFORMANCE_CONFIG from '../config/performanceConfig';

class APIBatcher {
  constructor() {
    this.queue = new Map();
    this.timers = new Map();
    this.batchDelay = PERFORMANCE_CONFIG.API.BATCH_DELAY || 50;
  }

  /**
   * Add request to batch queue
   * @param {string} key - Unique identifier for this request type
   * @param {Function} requestFn - Function that returns a promise
   * @param {Object} options - Batching options
   * @returns {Promise} - Resolves with the API response
   */
  batch(key, requestFn, options = {}) {
    const {
      delay = this.batchDelay,
      maxSize = 10,
    } = options;

    return new Promise((resolve, reject) => {
      // Add to queue
      if (!this.queue.has(key)) {
        this.queue.set(key, []);
      }

      const queue = this.queue.get(key);
      queue.push({ requestFn, resolve, reject });

      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Execute immediately if queue is full
      if (queue.length >= maxSize) {
        this.executeBatch(key);
        return;
      }

      // Set timer to execute batch
      const timer = setTimeout(() => {
        this.executeBatch(key);
      }, delay);

      this.timers.set(key, timer);
    });
  }

  /**
   * Execute all requests in batch
   */
  async executeBatch(key) {
    const queue = this.queue.get(key);
    if (!queue || queue.length === 0) return;

    // Clear queue and timer
    this.queue.delete(key);
    this.timers.delete(key);

    // Execute all requests
    const results = await Promise.allSettled(
      queue.map(({ requestFn }) => requestFn())
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const { resolve, reject } = queue[index];
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });
  }

  /**
   * Clear all pending batches
   */
  clearAll() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Reject all pending requests
    this.queue.forEach((queue) => {
      queue.forEach(({ reject }) => {
        reject(new Error('Batch cancelled'));
      });
    });
    this.queue.clear();
  }

  /**
   * Get queue status
   */
  getStatus() {
    const status = {};
    this.queue.forEach((queue, key) => {
      status[key] = {
        pending: queue.length,
        hasTimer: this.timers.has(key),
      };
    });
    return status;
  }
}

// Singleton instance
const batcher = new APIBatcher();

/**
 * Request Deduplicator
 * Prevents duplicate requests from being sent simultaneously
 */
class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }

  /**
   * Execute request with deduplication
   * @param {string} key - Unique identifier for this request
   * @param {Function} requestFn - Function that returns a promise
   * @returns {Promise} - Resolves with the API response
   */
  async dedupe(key, requestFn) {
    // Return existing promise if request is pending
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Execute request
    const promise = requestFn()
      .finally(() => {
        // Remove from pending after completion
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Check if request is pending
   */
  isPending(key) {
    return this.pending.has(key);
  }

  /**
   * Cancel pending request
   */
  cancel(key) {
    this.pending.delete(key);
  }

  /**
   * Get all pending request keys
   */
  getPending() {
    return Array.from(this.pending.keys());
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pending.clear();
  }
}

// Singleton instance
const deduplicator = new RequestDeduplicator();

/**
 * Request Queue Manager
 * Limits concurrent requests for low-end devices
 */
class RequestQueue {
  constructor(maxConcurrent = PERFORMANCE_CONFIG.API.MAX_CONCURRENT) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  /**
   * Add request to queue
   * @param {Function} requestFn - Function that returns a promise
   * @returns {Promise} - Resolves with the API response
   */
  async enqueue(requestFn) {
    // Execute immediately if under limit
    if (this.running < this.maxConcurrent) {
      return this.execute(requestFn);
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Execute request
   */
  async execute(requestFn) {
    this.running++;
    try {
      const result = await requestFn();
      return result;
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    while (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const { requestFn, resolve, reject } = this.queue.shift();
      this.execute(requestFn)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    // Reject all queued requests
    this.queue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Singleton instance
const requestQueue = new RequestQueue();

/**
 * Helper: Batch similar requests
 * @param {string} key - Batch key
 * @param {Function} requestFn - Request function
 * @param {Object} options - Options
 */
export const batchRequest = (key, requestFn, options) => {
  if (!PERFORMANCE_CONFIG.API.ENABLE_BATCHING) {
    return requestFn();
  }
  return batcher.batch(key, requestFn, options);
};

/**
 * Helper: Deduplicate requests
 * @param {string} key - Request key
 * @param {Function} requestFn - Request function
 */
export const dedupeRequest = (key, requestFn) => {
  return deduplicator.dedupe(key, requestFn);
};

/**
 * Helper: Queue request
 * @param {Function} requestFn - Request function
 */
export const queueRequest = (requestFn) => {
  return requestQueue.enqueue(requestFn);
};

/**
 * Helper: Get status of all systems
 */
export const getSystemStatus = () => {
  return {
    batcher: batcher.getStatus(),
    deduplicator: {
      pending: deduplicator.getPending(),
    },
    queue: requestQueue.getStatus(),
  };
};

/**
 * Helper: Clear all systems
 */
export const clearAllSystems = () => {
  batcher.clearAll();
  deduplicator.clearAll();
  requestQueue.clearQueue();
};

// Export instances
export { batcher, deduplicator, requestQueue };

// Example usage:
/*
// Batch similar requests together
const fetchUser = () => batchRequest('user', () => api.get('/user'));
const fetchBalance = () => batchRequest('balance', () => api.get('/balance'));

// Deduplicate identical requests
const loadDashboard = () => dedupeRequest('dashboard', () => api.get('/dashboard'));

// Queue requests to limit concurrency
const saveTicket = (data) => queueRequest(() => api.post('/tickets', data));
*/

export default {
  batch: batchRequest,
  dedupe: dedupeRequest,
  queue: queueRequest,
  getStatus: getSystemStatus,
  clearAll: clearAllSystems,
};

