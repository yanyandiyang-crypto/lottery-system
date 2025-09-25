import axios from 'axios';

// API Configuration
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE_URL = process.env.REACT_APP_API_URL || (isLocalhost ? 'http://localhost:3001' : 'https://lottery-system-tna9.onrender.com');
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
    'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0'
  },
  // Retry configuration
  retry: 3,
  retryDelay: 1000,
  // Additional axios options
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.metadata = { startTime: new Date() };

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API ${API_VERSION}] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`[API ${API_VERSION}] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }

    // Check for API version warnings
    const deprecationWarning = response.headers['x-api-deprecation-warning'];
    const sunsetWarning = response.headers['x-api-sunset-warning'];

    if (deprecationWarning) {
      console.warn(`[API Warning] ${deprecationWarning}`);
    }

    if (sunsetWarning) {
      console.warn(`[API Warning] ${sunsetWarning}`);
    }

    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Bad Request - Validation failed
          console.error('Validation failed:', data.message || 'Invalid request data');
          if (data.errors && Array.isArray(data.errors)) {
            console.error('Validation errors:', data.errors);
          }
          break;
        case 401:
          // Unauthorized - clear token but don't auto-redirect
          // Let the AuthContext handle the redirect logic
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          console.error('Authentication failed:', data.message);
          break;
        case 403:
          // Forbidden - show permission error
          console.error('Access denied:', data.message);
          break;
        case 429:
          // Rate limited
          console.error('Rate limited:', data.message);
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API error:', data.message || 'Unknown error');
      }
    } else if (error.request) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout:', error.message);
      } else {
        console.error('Network error:', error.message);
      }
    } else {
      // Other error
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  getAccountStats: () => api.get('/auth/stats')
};

export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getHierarchy: () => api.get('/users/hierarchy'),
  getStats: () => api.get('/users/stats')
};

export const ticketsAPI = {
  createTicket: (ticketData) => api.post('/tickets', ticketData),
  getTickets: (params) => api.get('/tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  validateTicket: (ticketNumber) => api.get(`/tickets/validate/${ticketNumber}`),
  getTicketsByAgent: (agentId, params) => api.get(`/tickets/agent/${agentId}`, { params }),
  getTicketsByDraw: (drawId, params) => api.get(`/tickets/draw/${drawId}`, { params }),
  getTicketForReprint: (ticketNumber) => api.get(`/tickets/reprint/search/${ticketNumber}`),
  reprintTicket: (ticketId) => api.post(`/tickets/${ticketId}/reprint`),
  getReprintHistory: (params) => api.get('/tickets/reprint/history', { params })
};

export const drawsAPI = {
  getDraws: (params) => api.get('/draws', { params }),
  getDraw: (id) => api.get(`/draws/${id}`),
  setResult: (id, result) => api.post(`/draws/${id}/result`, result),
  getActiveDraws: () => api.get('/draws/current/active'),
  getDrawStats: (id) => api.get(`/draws/${id}/statistics`),
  getOperatorDashboard: () => api.get('/draws/operator/dashboard')
};

export const salesAPI = {
  getAgentSales: (agentId, params) => api.get(`/sales/agent/${agentId}`, { params }),
  getDrawSales: (drawId) => api.get(`/sales/draw/${drawId}`),
  getDailySales: (params) => api.get('/sales/daily', { params }),
  getRangeSales: (params) => api.get('/sales/range', { params }),
  getPerDrawSales: (params) => api.get('/sales/per-draw', { params }),
  getLiveStats: () => api.get('/sales/live-stats')
};

export const reportsAPI = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getAgentReport: (agentId, params) => api.get(`/reports/agent/${agentId}`, { params }),
  getCoordinatorReport: (coordinatorId, params) => api.get(`/reports/coordinator/${coordinatorId}`, { params }),
  getDrawReport: (drawId) => api.get(`/reports/draw/${drawId}`),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
  exportSalesReport: (params) => api.get('/reports/export/sales', { params, responseType: 'blob' }),
  exportSalesExcel: (params) => api.get('/reports/sales/excel', { 
    params, 
    responseType: 'blob' 
  }),
  exportWinnersExcel: (params) => api.get('/reports/winners/excel', { 
    params, 
    responseType: 'blob' 
  }),
  getHierarchyReport: (params) => api.get('/reports/hierarchy', { params }),
  getDrawTimeSales: (params) => api.get('/reports/draw-time-sales', { params })
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getWinnerNotifications: (params) => api.get('/notifications/winners', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  createNotification: (data) => api.post('/notifications', data),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getStats: () => api.get('/notifications/stats')
};

export const balanceAPI = {
  getBalance: (userId) => api.get(`/balance/${userId}`),
  loadBalance: (userId, data) => api.post(`/balance/${userId}/load`, data),
  getTransactions: (userId, params) => api.get(`/balance/${userId}/transactions`, { params }),
  getSummary: () => api.get('/balance/summary'),
  refundBalance: (userId, data) => api.post(`/balance/${userId}/refund`, data)
};

export const balanceManagementAPI = {
  getUsers: () => api.get('/balance-management/users'),
  loadBalance: (data) => api.post('/balance-management/load', data),
  getTransactions: (userId, params) => api.get(`/balance-management/transactions/${userId}`, { params }),
  deductBalance: (data) => api.post('/balance-management/deduct', data)
};

export const betLimitsAPI = {
  getBetLimits: () => api.get('/bet-limits'),
  setBetLimit: (data) => api.post('/bet-limits', data),
  checkLimit: (drawId, betCombination, betType) => api.get(`/bet-limits/check/${drawId}/${betCombination}/${betType}`),
  updateTotal: (data) => api.post('/bet-limits/update-total', data),
  getSoldOut: (drawId) => api.get(`/bet-limits/sold-out/${drawId}`)
};

export const userAPI = {
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/user-management${queryString ? `?${queryString}` : ''}`);
  },
  
  createUser: (userData) => {
    return api.post('/user-management', userData);
  },
  
  updateUser: (userId, userData) => {
    return api.put(`/user-management/${userId}`, userData);
  },
  
  deleteUser: (userId, options = {}) => {
    const params = new URLSearchParams();
    if (options.force) {
      params.append('force', 'true');
    }
    const queryString = params.toString();
    return api.delete(`/user-management/${userId}${queryString ? `?${queryString}` : ''}`);
  },
  
  getUser: (userId) => {
    return api.get(`/user-management/${userId}`);
  }
};

export const drawResultsAPI = {
  inputResult: (data) => api.post('/draw-results/input', data),
  getResult: (drawId) => api.get(`/draw-results/${drawId}`),
  getAdminDashboard: (params) => api.get('/draw-results/dashboard/admin', { params }),
  getWinnerNotifications: (drawId) => api.get(`/draw-results/winners/${drawId}`),
  getHistory: (params) => api.get('/draw-results/history', { params })
};

// API Version Management
export const versionAPI = {
  getVersions: () => api.get('/versions'),
  getVersionInfo: (version) => api.get(`/${version}/info`),
  getHealth: () => api.get('/health')
};

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;

