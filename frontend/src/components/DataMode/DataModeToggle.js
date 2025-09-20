import React from 'react';
import { 
  SignalIcon, 
  CameraIcon, 
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useDataModeContext } from '../../contexts/DataModeContext';

const DataModeToggle = ({ 
  showRefreshButton = true, 
  showIntervalSelector = false,
  showStatus = true,
  className = "" 
}) => {
  const {
    globalDataMode,
    refreshInterval,
    autoRefresh,
    lastGlobalUpdate,
    toggleGlobalMode,
    updateRefreshInterval,
    toggleAutoRefresh,
    refreshAllData,
    getDataSourceStatus
  } = useDataModeContext();

  const status = getDataSourceStatus();
  const isLive = globalDataMode === 'live';

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const getStatusColor = () => {
    if (status.errors > 0) return 'text-red-500';
    if (isLive) return 'text-green-500';
    return 'text-blue-500';
  };

  const getStatusIcon = () => {
    if (status.errors > 0) return ExclamationTriangleIcon;
    if (isLive) return SignalIcon;
    return CameraIcon;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Data Mode Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleGlobalMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLive ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isLive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div className="flex items-center space-x-1">
          <StatusIcon className={`h-4 w-4 ${getStatusColor()}`} />
          <span className="text-sm font-medium text-gray-700">
            {isLive ? 'Live Data' : 'Snapshot'}
          </span>
        </div>
      </div>

      {/* Auto Refresh Toggle */}
      {isLive && (
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAutoRefresh}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              autoRefresh ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-gray-600">Auto</span>
        </div>
      )}

      {/* Refresh Interval Selector */}
      {isLive && showIntervalSelector && (
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          <select
            value={refreshInterval}
            onChange={(e) => updateRefreshInterval(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
        </div>
      )}

      {/* Refresh Button */}
      {showRefreshButton && (
        <button
          onClick={refreshAllData}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="Refresh all data"
        >
          <ArrowPathIcon className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      )}

      {/* Status Information */}
      {showStatus && (
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span>Sources:</span>
            <span className="font-medium">{status.total}</span>
          </div>
          
          {status.errors > 0 && (
            <div className="flex items-center space-x-1 text-red-500">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span>{status.errors} errors</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <span>Last update:</span>
            <span className="font-medium">{formatLastUpdate(lastGlobalUpdate)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataModeToggle;
