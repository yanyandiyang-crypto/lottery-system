import React, { useState, useEffect } from 'react';
import NetworkUtils from '../../utils/networkUtils';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const NetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    online: true,
    apiReachable: true,
    checking: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await NetworkUtils.checkConnectivity();
      setNetworkStatus(prev => ({ ...prev, ...status, checking: false }));
    };

    // Initial check
    checkStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, online: true }));
      checkStatus();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        online: false, 
        apiReachable: false 
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleRetryConnection = async () => {
    setNetworkStatus(prev => ({ ...prev, checking: true }));
    const status = await NetworkUtils.checkConnectivity();
    setNetworkStatus(prev => ({ ...prev, ...status, checking: false }));
  };

  // Don't show if everything is working
  if (networkStatus.online && networkStatus.apiReachable) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={`px-4 py-2 text-center text-sm font-medium ${
        !networkStatus.online 
          ? 'bg-red-600 text-white' 
          : 'bg-yellow-500 text-white'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          {!networkStatus.online ? (
            <ExclamationTriangleIcon className="h-4 w-4" />
          ) : (
            <WifiIcon className="h-4 w-4" />
          )}
          
          <span>
            {!networkStatus.online 
              ? 'No Internet Connection' 
              : 'Server Connection Issues'
            }
          </span>

          <button
            onClick={handleRetryConnection}
            disabled={networkStatus.checking}
            className="ml-2 p-1 rounded hover:bg-black hover:bg-opacity-20"
          >
            <ArrowPathIcon 
              className={`h-4 w-4 ${networkStatus.checking ? 'animate-spin' : ''}`} 
            />
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2 text-xs underline"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-2 text-xs opacity-90">
            <div>Status: {networkStatus.message}</div>
            {networkStatus.error && (
              <div>Error: {networkStatus.error}</div>
            )}
            <div>
              Connection: {NetworkUtils.getConnectionInfo().type}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
