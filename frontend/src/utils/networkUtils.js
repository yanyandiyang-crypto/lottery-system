// Network utilities for mobile connectivity
class NetworkUtils {
  static async checkConnectivity() {
    try {
      // Check if online
      if (!navigator.onLine) {
        return {
          online: false,
          apiReachable: false,
          message: 'Device is offline'
        };
      }

      // Test API connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/v1/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      return {
        online: true,
        apiReachable: response.ok,
        status: response.status,
        message: response.ok ? 'Connected' : 'API unreachable'
      };
    } catch (error) {
      return {
        online: navigator.onLine,
        apiReachable: false,
        error: error.name,
        message: this.getErrorMessage(error)
      };
    }
  }

  static getErrorMessage(error) {
    switch (error.name) {
      case 'AbortError':
        return 'Connection timeout';
      case 'TypeError':
        return 'Network error - check your connection';
      case 'NetworkError':
        return 'Unable to reach server';
      default:
        return error.message || 'Unknown network error';
    }
  }

  static getConnectionInfo() {
    if (!navigator.connection) {
      return { type: 'unknown', speed: 'unknown' };
    }

    const connection = navigator.connection;
    return {
      type: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  static isSlowConnection() {
    const connection = this.getConnectionInfo();
    return connection.type === 'slow-2g' || 
           connection.type === '2g' || 
           connection.downlink < 0.5;
  }

  static async testApiEndpoint(endpoint = '/auth/me') {
    try {
      const response = await fetch(`/api/v1${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default NetworkUtils;
