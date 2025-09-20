import React, { useState, useEffect } from 'react';
import { SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const LiveDataIndicator = ({ 
  isLive = false, 
  lastUpdate = null, 
  className = "" 
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setPulse(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  if (!isLive) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <SignalSlashIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Snapshot Mode</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <SignalIcon 
          className={`h-4 w-4 text-green-500 transition-opacity ${
            pulse ? 'opacity-100' : 'opacity-60'
          }`} 
        />
        {pulse && (
          <div className="absolute inset-0">
            <SignalIcon className="h-4 w-4 text-green-500 animate-ping" />
          </div>
        )}
      </div>
      <span className="text-sm text-green-600 font-medium">Live Data</span>
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Updated {formatLastUpdate(lastUpdate)}
        </span>
      )}
    </div>
  );
};

export default LiveDataIndicator;
