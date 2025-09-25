import React, { useState, useEffect } from 'react';
import { useDataModeContext } from '../../contexts/DataModeContext';
import { useDataFetcher } from '../../hooks/useDataMode';
import { liveDataAPI } from '../../utils/liveDataAPI';
import DataModeToggle from '../DataMode/DataModeToggle';
import LiveDataIndicator from '../DataMode/LiveDataIndicator';
import LoadingSpinner from '../UI/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TicketIcon,
  UsersIcon,
  SignalIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const LiveDataDashboard = ({ userRole = 'agent' }) => {
  const { globalDataMode, isLive } = useDataModeContext();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Sales data fetcher
  const salesFetcher = useDataFetcher(
    () => liveDataAPI.sales.getDailySales({ date: selectedDate }, globalDataMode),
    [selectedDate, globalDataMode],
    { mode: globalDataMode, refreshInterval: 30000 }
  );

  // Live stats fetcher
  const liveStatsFetcher = useDataFetcher(
    () => liveDataAPI.sales.getLiveSales(),
    [globalDataMode],
    { mode: globalDataMode, refreshInterval: 15000 }
  );

  // Per-draw sales fetcher
  const perDrawFetcher = useDataFetcher(
    () => liveDataAPI.sales.getPerDrawSales({ date: selectedDate }, globalDataMode),
    [selectedDate, globalDataMode],
    { mode: globalDataMode, refreshInterval: 30000 }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDrawTime = (drawTime) => {
    const timeMap = {
      'twoPM': '2:00 PM',
      'fivePM': '5:00 PM',
      'ninePM': '9:00 PM'
    };
    return timeMap[drawTime] || drawTime;
  };

  const getDataStatus = () => {
    const sources = [salesFetcher, liveStatsFetcher, perDrawFetcher];
    const total = sources.length;
    const loading = sources.filter(s => s.loading).length;
    const errors = sources.filter(s => s.error).length;
    const success = sources.filter(s => s.data && !s.error).length;

    return { total, loading, errors, success };
  };

  const status = getDataStatus();

  return (
    <div className="space-y-6">
      {/* Header with Data Mode Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
            </h2>
            <p className="text-gray-600">
              {isLive ? 'Real-time data updates' : 'Snapshot data view'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <LiveDataIndicator 
              isLive={isLive} 
              lastUpdate={salesFetcher.lastFetch}
            />
            <DataModeToggle 
              showRefreshButton={true}
              showIntervalSelector={true}
              showStatus={true}
            />
          </div>
        </div>

        {/* Data Status */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status.loading > 0 ? 'bg-yellow-400' : 
              status.errors > 0 ? 'bg-red-400' : 'bg-green-400'
            }`} />
            <span className="text-gray-600">
              {status.success}/{status.total} data sources active
            </span>
          </div>
          
          {status.errors > 0 && (
            <div className="flex items-center space-x-1 text-red-600">
              <span className="font-medium">{status.errors} errors</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1 text-gray-500">
            <span>Mode:</span>
            <span className="font-medium">{globalDataMode}</span>
          </div>
        </div>
      </div>

      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesFetcher.loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                ) : (
                  formatCurrency(salesFetcher.data?.data?.totalSales)
                )}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
          {salesFetcher.error && (
            <p className="text-xs text-red-500 mt-2">Failed to load</p>
          )}
        </div>

        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesFetcher.loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  salesFetcher.data?.data?.totalTickets || 0
                )}
              </p>
            </div>
            <TicketIcon className="h-8 w-8 text-blue-500" />
          </div>
          {salesFetcher.error && (
            <p className="text-xs text-red-500 mt-2">Failed to load</p>
          )}
        </div>

        {/* Live Active Bets */}
        {isLive && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liveStatsFetcher.loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                  ) : (
                    liveStatsFetcher.data?.data?.activeBets || 0
                  )}
                </p>
              </div>
              <SignalIcon className="h-8 w-8 text-purple-500" />
            </div>
            {liveStatsFetcher.error && (
              <p className="text-xs text-red-500 mt-2">Failed to load</p>
            )}
          </div>
        )}

        {/* Pending Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isLive ? 'Pending Tickets' : 'Total Winnings'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {liveStatsFetcher.loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  isLive 
                    ? (liveStatsFetcher.data?.data?.pendingTickets || 0)
                    : formatCurrency(salesFetcher.data?.data?.totalWinnings)
                )}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-orange-500" />
          </div>
          {liveStatsFetcher.error && (
            <p className="text-xs text-red-500 mt-2">Failed to load</p>
          )}
        </div>
      </div>

      {/* Per-Draw Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Per-Draw Sales</h3>
          <LiveDataIndicator 
            isLive={isLive} 
            lastUpdate={perDrawFetcher.lastFetch}
            className="text-sm"
          />
        </div>

        {perDrawFetcher.loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : perDrawFetcher.error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load per-draw sales data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {perDrawFetcher.data?.data?.draws?.map((draw, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {formatDrawTime(draw.drawTime)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {draw.ticketCount || 0} tickets
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(draw.grossSales)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Net: {formatCurrency(draw.netSales)}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No draw data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Mode Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          {isLive ? (
            <SignalIcon className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <CameraIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium text-gray-900">
              {isLive ? 'Live Data Mode' : 'Snapshot Data Mode'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {isLive 
                ? 'Data is updated automatically every 30 seconds. You can see real-time changes as they happen.'
                : 'Data is captured at a specific point in time. Click refresh to get the latest snapshot.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDataDashboard;
