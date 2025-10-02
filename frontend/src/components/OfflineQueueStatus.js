import React from 'react';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { CloudArrowUpIcon, WifiIcon, SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Offline Queue Status Indicator
 * Shows when there are pending items to sync
 */
export default function OfflineQueueStatus() {
  const { queueStatus, isOnline, isSyncing, syncNow } = useOfflineQueue();

  // Don't show if no pending items
  if (queueStatus.pending === 0 && queueStatus.failed === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 max-w-sm ${
        isOnline ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
      }`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isOnline ? 'bg-blue-100' : 'bg-orange-100'
          }`}>
            {isSyncing ? (
              <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
            ) : isOnline ? (
              <WifiIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <SignalSlashIcon className="w-5 h-5 text-orange-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${
              isOnline ? 'text-blue-900' : 'text-orange-900'
            }`}>
              {isOnline ? 'Syncing Data' : 'Offline Mode'}
            </h4>
            
            <p className={`text-xs mt-1 ${
              isOnline ? 'text-blue-700' : 'text-orange-700'
            }`}>
              {queueStatus.pending > 0 && (
                <span className="block">
                  📥 {queueStatus.pending} pending {queueStatus.pending === 1 ? 'item' : 'items'}
                </span>
              )}
              {queueStatus.failed > 0 && (
                <span className="block text-red-600">
                  ❌ {queueStatus.failed} failed {queueStatus.failed === 1 ? 'item' : 'items'}
                </span>
              )}
            </p>

            {/* Sync Button */}
            {isOnline && queueStatus.pending > 0 && !isSyncing && (
              <button
                onClick={syncNow}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Sync Now
              </button>
            )}

            {/* Syncing Status */}
            {isSyncing && (
              <p className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Syncing...
              </p>
            )}

            {/* Offline Message */}
            {!isOnline && (
              <p className="mt-2 text-xs text-orange-600">
                Data will sync when internet returns
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
