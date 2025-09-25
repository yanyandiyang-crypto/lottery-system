import api from './api';

/**
 * Enhanced API for live data management
 * Supports both real-time and snapshot data modes
 */
export const liveDataAPI = {
  // Sales Data
  sales: {
    // Live sales data
    getLiveSales: (params = {}) => api.get('/sales/live-stats', { params }),
    
    // Snapshot sales data
    getSnapshotSales: (params = {}) => api.get('/sales/snapshot', { params }),
    
    // Daily sales with mode support
    getDailySales: (params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? '/sales/daily-live' : '/sales/daily';
      return api.get(endpoint, { params });
    },
    
    // Per-draw sales with mode support
    getPerDrawSales: (params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? '/sales/per-draw-live' : '/sales/per-draw';
      return api.get(endpoint, { params });
    },
    
    // Agent sales with mode support
    getAgentSales: (agentId, params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? `/sales/agent/${agentId}/live` : `/sales/agent/${agentId}`;
      return api.get(endpoint, { params });
    },
    
    // Operator dashboard with mode support
    getOperatorDashboard: (params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? '/sales/operator-dashboard-live' : '/sales/operator-dashboard';
      return api.get(endpoint, { params });
    }
  },

  // Draw Data
  draws: {
    // Live draw data
    getLiveDraws: (params = {}) => api.get('/draws/live', { params }),
    
    // Snapshot draw data
    getSnapshotDraws: (params = {}) => api.get('/draws/snapshot', { params }),
    
    // Active draws with mode support
    getActiveDraws: (mode = 'live') => {
      const endpoint = mode === 'live' ? '/draws/active-live' : '/draws/current/active';
      return api.get(endpoint);
    },
    
    // Draw statistics with mode support
    getDrawStats: (drawId, mode = 'live') => {
      const endpoint = mode === 'live' ? `/draws/${drawId}/stats-live` : `/draws/${drawId}/statistics`;
      return api.get(endpoint);
    }
  },

  // Ticket Data
  tickets: {
    // Live ticket data
    getLiveTickets: (params = {}) => api.get('/tickets/live', { params }),
    
    // Snapshot ticket data
    getSnapshotTickets: (params = {}) => api.get('/tickets/snapshot', { params }),
    
    // Agent tickets with mode support
    getAgentTickets: (agentId, params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? `/tickets/agent/${agentId}/live` : `/tickets/agent/${agentId}`;
      return api.get(endpoint, { params });
    }
  },

  // Balance Data
  balance: {
    // Live balance data
    getLiveBalance: (userId) => api.get(`/balance/${userId}/live`),
    
    // Snapshot balance data
    getSnapshotBalance: (userId) => api.get(`/balance/${userId}/snapshot`),
    
    // Current balance with mode support
    getCurrentBalance: (mode = 'live') => {
      const endpoint = mode === 'live' ? '/balance/current-live' : '/balance/current';
      return api.get(endpoint);
    }
  },

  // Reports Data
  reports: {
    // Live reports
    getLiveReports: (type, params = {}) => api.get(`/reports/${type}/live`, { params }),
    
    // Snapshot reports
    getSnapshotReports: (type, params = {}) => api.get(`/reports/${type}/snapshot`, { params }),
    
    // Sales reports with mode support
    getSalesReport: (params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? '/reports/sales-live' : '/reports/sales';
      return api.get(endpoint, { params });
    }
  },

  // System Data
  system: {
    // Live system stats
    getLiveSystemStats: () => api.get('/system/live-stats'),
    
    // Snapshot system stats
    getSnapshotSystemStats: () => api.get('/system/snapshot-stats'),
    
    // Dashboard data with mode support
    getDashboardData: (role, params = {}, mode = 'live') => {
      const endpoint = mode === 'live' ? `/dashboard/${role}/live` : `/dashboard/${role}`;
      return api.get(endpoint, { params });
    }
  }
};

/**
 * Generic data fetcher that supports both modes
 */
export const createDataFetcher = (endpoint, options = {}) => {
  const { mode = 'live', params = {}, ...apiOptions } = options;
  
  return async () => {
    try {
      const response = await api.get(endpoint, { params, ...apiOptions });
      return {
        data: response.data,
        timestamp: new Date(),
        mode,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        timestamp: new Date(),
        mode,
        success: false,
        error: error.message
      };
    }
  };
};

/**
 * Batch data fetcher for multiple endpoints
 */
export const createBatchFetcher = (endpoints, options = {}) => {
  const { mode = 'live', params = {} } = options;
  
  return async () => {
    try {
      const promises = endpoints.map(endpoint => 
        api.get(endpoint, { params })
      );
      
      const responses = await Promise.allSettled(promises);
      
      const results = responses.map((response, index) => ({
        endpoint: endpoints[index],
        success: response.status === 'fulfilled',
        data: response.status === 'fulfilled' ? response.value.data : null,
        error: response.status === 'rejected' ? response.reason.message : null
      }));
      
      return {
        results,
        timestamp: new Date(),
        mode,
        success: results.some(r => r.success)
      };
    } catch (error) {
      return {
        results: [],
        timestamp: new Date(),
        mode,
        success: false,
        error: error.message
      };
    }
  };
};

export default liveDataAPI;
