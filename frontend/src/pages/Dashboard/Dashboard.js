import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../utils/api';
import WinnerNotifications from '../../components/Notifications/WinnerNotifications';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  CurrencyDollarIcon,
  TicketIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [showWinnerNotifications, setShowWinnerNotifications] = useState(false);

  // Check if user is an agent (only agents get the betting interface)
  const isAgent = user?.role === 'agent';

  // Fetch dashboard data
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const isTodayRange = dateRange.startDate === dateRange.endDate && dateRange.startDate === new Date().toISOString().split('T')[0];

  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['dashboard', dateRange.startDate, dateRange.endDate],
    async () => {
      console.log('🔍 Fetching dashboard data...');
      const response = await api.get('/dashboard', { params: dateRange });
      console.log('📊 Dashboard API Response:', response.data);
      return response.data.data; // unwrap { success, data }
    },
    {
      refetchInterval: isTodayRange ? 30000 : false,
      onError: (error) => {
        console.error('❌ Dashboard API Error:', error);
      }
    }
  );

  // Fetch live dashboard data for real-time updates
  const { data: liveData } = useQuery(
    'dashboard-live',
    async () => {
      const response = await api.get('/dashboard/live');
      return response.data;
    },
    {
      refetchInterval: isTodayRange && !isAgent ? 5000 : false, // live only for today and non-agent
      enabled: !isAgent && isTodayRange, // Only for management roles on today range
    }
  );

  // Fetch active draws
  const { data: activeDraws, isLoading: drawsLoading, error: drawsError } = useQuery(
    'activeDraws',
    async () => {
      console.log('🔍 Fetching draws from API...');
      const response = await api.get('/draws/current/active');
      console.log('📊 API Response:', response.data);
      // The API returns { success: true, data: [...] }, so we need response.data.data
      return response.data.data || [];
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Create all three draws with proper status
  const createDrawCard = (drawTime, hour, label) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const drawDateTime = new Date(today);
    drawDateTime.setHours(hour, 0, 0, 0);
    
    // Find existing draw from API data
    const existingDraw = Array.isArray(activeDraws) ? 
      activeDraws.find(draw => draw.drawTime === drawTime) : null;
    
    console.log(`🎯 Creating draw card for ${drawTime}:`, {
      activeDrawsLength: activeDraws?.length || 0,
      existingDraw: existingDraw ? { id: existingDraw.id, isAvailable: existingDraw.isAvailable } : null
    });
    
    let status, color, description, icon;
    
    if (existingDraw) {
      // Use the isAvailable property from the API
      if (existingDraw.isAvailable) {
        status = 'betting';
        color = 'green';
        description = 'Betting Open';
      } else {
        // Check if it's upcoming or closed based on time
        if (now < drawDateTime) {
          status = 'upcoming';
          color = 'gray';
          description = 'Upcoming Draw';
        } else {
          status = 'closed';
          color = 'yellow';
          description = 'Betting Closed';
        }
      }
    } else {
      // No draw exists yet
      if (now < drawDateTime) {
        status = 'upcoming';
        color = 'gray';
        description = 'Upcoming Draw';
      } else {
        status = 'closed';
        color = 'gray';
        description = 'Draw not available';
      }
    }
    
    icon = status === 'betting' ? PlayIcon : 
           status === 'upcoming' ? ClockIcon : CheckCircleIcon;
    
    return {
      id: existingDraw?.id || `temp-${drawTime}`,
      time: formatDrawTime(drawTime),
      label: label,
      status: status,
      prize: '₱4,500',
      subtitle: 'Prize Amount',
      description: description,
      color: color,
      icon: icon,
      bettingWindow: existingDraw?.bettingWindow,
      drawTime: drawTime
    };
  };

  const drawTimes = [
    createDrawCard('twoPM', 14, '2P'),
    createDrawCard('fivePM', 17, '5P'),
    createDrawCard('ninePM', 21, '9P')
  ];

  // Use live data if available, otherwise fall back to regular dashboard data
  // currentData aggregation removed with simplified layout

  // Primary stats grid removed; keep computed values directly in sections if needed


  const recentDraws = dashboardData?.recentDraws || [];
  const recentTickets = dashboardData?.recentTickets || [];

  // Calculate accurate sales metrics with debugging
  const salesMetrics = useMemo(() => {
    console.log('🔍 Dashboard Data Debug:', {
      dashboardData,
      hierarchicalPerformance: dashboardData?.hierarchicalPerformance,
      summary: dashboardData?.hierarchicalPerformance?.summary,
      rootLevelData: {
        todaySales: dashboardData?.todaySales,
        grossSales: dashboardData?.grossSales,
        winningAmount: dashboardData?.winningAmount,
        netSales: dashboardData?.netSales
      },
      isLoading,
      error: error?.message
    });

    // Check if we have dashboard data
    if (!dashboardData) {
      console.log('⚠️ No dashboard data found');
      return {
        grossSales: 0,
        totalWinnings: 0,
        netSales: 0,
        totalTickets: 0,
        averageTicket: 0,
        profitMargin: 0
      };
    }

    // Use root level data from Dashboard API (the correct data source)
    const grossSales = dashboardData.grossSales || dashboardData.todaySales || 0;
    const totalWinnings = dashboardData.winningAmount || 0;
    const netSales = dashboardData.netSales || (grossSales - totalWinnings);
    
    // Get ticket count from recent tickets or active tickets
    const totalTickets = dashboardData.recentTickets?.length || dashboardData.activeTickets || 0;
    const averageTicket = totalTickets > 0 ? grossSales / totalTickets : 0;
    const profitMargin = grossSales > 0 ? (netSales / grossSales) * 100 : 0;

    // If all values are 0, show sample data for demonstration
    // Comment out this block to show real 0 values instead of sample data
    /*
    if (grossSales === 0 && totalWinnings === 0 && totalTickets === 0) {
      console.log('📊 Using sample data for demonstration (all API values are 0)');
      const sampleGross = 150000;
      const sampleWinnings = 45000;
      const sampleNet = sampleGross - sampleWinnings;
      const sampleTickets = 1500;
      const sampleAvg = sampleTickets > 0 ? sampleGross / sampleTickets : 0;
      const sampleMargin = sampleGross > 0 ? (sampleNet / sampleGross) * 100 : 0;
      
      return {
        grossSales: sampleGross,
        totalWinnings: sampleWinnings,
        netSales: sampleNet,
        totalTickets: sampleTickets,
        averageTicket: sampleAvg,
        profitMargin: sampleMargin
      };
    }
    */

    console.log('📊 Calculated Sales Metrics:', {
      grossSales,
      totalWinnings,
      netSales,
      totalTickets,
      averageTicket,
      profitMargin
    });

    return {
      grossSales,
      totalWinnings,
      netSales,
      totalTickets,
      averageTicket,
      profitMargin
    };
  }, [dashboardData, liveData, isLoading, error]);

  // Debug logging
  console.log('🔍 Dashboard Debug Info:', {
    isLoading,
    error: error?.message,
    dashboardData,
    liveData,
    user: user?.role,
    isAgent
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error loading dashboard</div>
          <div className="text-gray-500 text-sm mt-2">{error.message}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Agent Dashboard - Modern Betting Interface
  if (isAgent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8 py-2 sm:py-4 lg:py-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  Today Draw
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                  Select a draw time to place your bets
                </p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  {connected ? 'Live Updates' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Draw Selection Cards */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-6 sm:mb-8">
            {drawsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading draws...</span>
              </div>
            ) : drawsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-600">
                  <p>Error loading draws: {drawsError.message}</p>
                  <p className="text-sm text-gray-500 mt-2">Check console for details</p>
                </div>
              </div>
            ) : (
              drawTimes.map((draw) => (
              <div
                key={draw.id}
                onClick={() => {
                  if (draw.status === 'betting') {
                    window.location.href = `/betting?draw=${draw.id}&time=${encodeURIComponent(draw.time)}`;
                  }
                }}
                className={`
                  relative bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 lg:p-6 transition-all duration-200 
                  ${draw.status === 'betting' 
                    ? draw.color === 'green' 
                      ? 'border-green-200 hover:border-green-300 hover:shadow-lg cursor-pointer'
                      : 'border-yellow-200 hover:border-yellow-300 hover:shadow-lg cursor-pointer'
                    : draw.status === 'upcoming'
                    ? 'border-gray-200 cursor-default opacity-60'
                    : draw.status === 'cutoff' || draw.status === 'closed'
                    ? 'border-yellow-200 cursor-default opacity-75'
                    : 'border-gray-200 cursor-default opacity-60'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg lg:text-xl
                      ${draw.color === 'green' ? 'bg-green-500' : 
                        draw.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-400'}
                    `}>
                      {draw.label.substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                        3D LOTTO
                      </h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 truncate">
                        {draw.time} • {draw.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {draw.prize}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {draw.subtitle}
                    </p>
                    {draw.status === 'betting' && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          draw.color === 'green' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <PlayIcon className="w-3 h-3 mr-1" />
                          {draw.color === 'green' ? 'Betting Open' : 'Closing Soon'}
                        </span>
                      </div>
                    )}
                    {draw.status === 'upcoming' && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {draw.description}
                        </span>
                      </div>
                    )}
                    {(draw.status === 'cutoff' || draw.status === 'closed') && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Betting Closed
                        </span>
                      </div>
                    )}
                    {draw.status === 'completed' && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Draw Completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {draw.status === 'betting' && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      draw.color === 'green' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>

          {/* Winner Notifications Modal */}
          <WinnerNotifications 
            isOpen={showWinnerNotifications}
            onClose={() => setShowWinnerNotifications(false)}
          />
        </div>
      </div>
    );
  }

  // Admin/Coordinator Dashboard - Modern Sales Statistics
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Welcome back, <span className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</span>
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${connected && isTodayRange ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">
                    {isTodayRange ? (connected ? 'Live Updates' : 'Disconnected') : 'Historical Data'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>{new Date(dateRange.startDate).toLocaleDateString()}</span>
                  {dateRange.startDate !== dateRange.endDate && (
                    <>
                      <span>-</span>
                      <span>{new Date(dateRange.endDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modern Date Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      const t = new Date().toISOString().split('T')[0];
                      setDateRange({ startDate: t, endDate: t });
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isTodayRange 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() - 1);
                      const y = d.toISOString().split('T')[0];
                      setDateRange({ startDate: y, endDate: y });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(); start.setDate(start.getDate() - 6);
                      setDateRange({ 
                        startDate: start.toISOString().split('T')[0], 
                        endDate: end.toISOString().split('T')[0] 
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Last 7 days
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Sales Metrics Cards */}
        {!isAgent && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard Data</h3>
                    <p className="text-red-600 mt-1">{error.message}</p>
                    <button
                      onClick={() => refetch()}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Sales Metrics Cards - Show even if no hierarchical data */}
            {!isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {/* Gross Sales Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gross Sales</div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        ₱{salesMetrics.grossSales.toLocaleString()}
                      </div>
                      {salesMetrics.grossSales === 0 && (
                        <div className="text-xs text-gray-400 mt-1">No sales data for selected date</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">
                      {salesMetrics.grossSales === 0 ? 'No Revenue' : 'Total Revenue'}
                    </span>
                  </div>
                </div>

                {/* Total Winnings Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <TrophyIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Winnings Paid</div>
                      <div className="text-2xl sm:text-3xl font-bold text-red-600">
                        ₱{salesMetrics.totalWinnings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">Payouts</span>
                  </div>
                  {/* Pending/Approved Breakdown */}
                  {(dashboardData?.pendingWinnings || dashboardData?.approvedWinnings) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-orange-600">
                          Pending: ₱{(dashboardData.pendingWinnings || 0).toLocaleString()}
                        </span>
                        <span className="text-green-600">
                          Approved: ₱{(dashboardData.approvedWinnings || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Sales Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Sales</div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">
                        ₱{salesMetrics.netSales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-medium">
                      {salesMetrics.profitMargin.toFixed(1)}% Profit Margin
                    </span>
                  </div>
                </div>

                {/* Total Tickets Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <TicketIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Tickets</div>
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                        {salesMetrics.totalTickets.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-purple-600 font-medium">
                      ₱{salesMetrics.averageTicket.toFixed(0)} Avg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Role-Based Performance Breakdown */}
        {!isAgent && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {user?.role === 'superadmin' || user?.role === 'admin' ? 'System Overview' :
                   user?.role === 'area_coordinator' ? 'My Coordinators' :
                   user?.role === 'coordinator' ? 'My Agents' : 'Performance'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <EyeIcon className="h-4 w-4" />
                  <span>{user?.role?.replace('_', ' ').toUpperCase()} View</span>
                </div>
              </div>

              {/* SuperAdmin & Admin - See All Regions */}
              {(user?.role === 'superadmin' || user?.role === 'admin') && (
                <div className="space-y-6">
                  {/* Regions Overview */}
                  {dashboardData.hierarchicalPerformance?.regions?.length > 0 ? (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">All Regions</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.hierarchicalPerformance.regions.map((region) => {
                          // Use actual sales data if hierarchical data is empty
                          const regionSales = region.sales || (region.name === 'test' ? salesMetrics.grossSales : 0);
                          const regionNet = region.netSales || (region.name === 'test' ? salesMetrics.netSales : 0);
                          const regionTickets = region.tickets || (region.name === 'test' ? salesMetrics.totalTickets : 0);
                          
                          return (
                            <div key={region.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-blue-200 rounded-lg">
                                  <UsersIcon className="h-5 w-5 text-blue-700" />
                                </div>
                                <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                                  Region
                                </span>
                              </div>
                              <h5 className="font-semibold text-gray-900 mb-1">{region.name}</h5>
                              {regionSales === 0 && regionNet === 0 && regionTickets === 0 && (
                                <div className="text-xs text-orange-600 mb-2 bg-orange-50 px-2 py-1 rounded">
                                  ⚠️ Hierarchical data not populated yet
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Sales:</span>
                                  <span className="font-semibold text-gray-900">₱{regionSales.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Net:</span>
                                  <span className={`font-semibold ${regionNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₱{regionNet.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Tickets:</span>
                                  <span className="font-semibold text-gray-900">{regionTickets}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Show fallback when no hierarchical regions but we have sales data
                    salesMetrics.grossSales > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">System Sales (No Regional Breakdown)</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <p className="text-blue-800 text-sm mb-3">
                            <strong>Note:</strong> Regional hierarchy not configured yet. Showing total system sales.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="p-2 bg-blue-200 rounded-lg">
                                <UsersIcon className="h-5 w-5 text-blue-700" />
                              </div>
                              <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                                System Total
                              </span>
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">All Sales</h5>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sales:</span>
                                <span className="font-semibold text-gray-900">₱{salesMetrics.grossSales.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Net:</span>
                                <span className={`font-semibold ${salesMetrics.netSales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₱{salesMetrics.netSales.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tickets:</span>
                                <span className="font-semibold text-gray-900">{salesMetrics.totalTickets}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* All Coordinators */}
                  {dashboardData.hierarchicalPerformance?.coordinators?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">All Coordinators</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardData.hierarchicalPerformance.coordinators.map((coordinator) => (
                          <div key={coordinator.id} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="p-2 bg-green-200 rounded-lg">
                                <UsersIcon className="h-5 w-5 text-green-700" />
                              </div>
                              <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                                Coordinator
                              </span>
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">{coordinator.name}</h5>
                            <p className="text-xs text-gray-600 mb-2">{coordinator.agentCount || 0} agents</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sales:</span>
                                <span className="font-semibold text-gray-900">₱{coordinator.sales?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Net:</span>
                                <span className="font-semibold text-green-600">₱{coordinator.netSales?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Area Coordinator - See Only Their Coordinators */}
              {user?.role === 'area_coordinator' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Area Coordinator View:</strong> You can see all coordinators under your region.
                    </p>
                  </div>
                  {dashboardData.hierarchicalPerformance?.coordinators?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboardData.hierarchicalPerformance.coordinators.map((coordinator) => (
                        <div key={coordinator.id} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-green-200 rounded-lg">
                              <UsersIcon className="h-5 w-5 text-green-700" />
                            </div>
                            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                              My Coordinator
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-1">{coordinator.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">{coordinator.agentCount || 0} agents</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Sales:</span>
                              <span className="font-semibold text-gray-900">₱{coordinator.sales?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Net:</span>
                              <span className="font-semibold text-green-600">₱{coordinator.netSales?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No coordinators assigned to your region yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Coordinator - See Only Their Agents */}
              {user?.role === 'coordinator' && (
                <div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-purple-800 text-sm">
                      <strong>Coordinator View:</strong> You can see all agents under your supervision.
                    </p>
                  </div>
                  {dashboardData.hierarchicalPerformance?.agents?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboardData.hierarchicalPerformance.agents.map((agent) => (
                        <div key={agent.id} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-purple-200 rounded-lg">
                              <UsersIcon className="h-5 w-5 text-purple-700" />
                            </div>
                            <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                              My Agent
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-2 truncate">{agent.name}</h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Sales:</span>
                              <span className="font-semibold text-gray-900">₱{agent.sales?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Net:</span>
                              <span className="font-semibold text-green-600">₱{agent.netSales?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Avg:</span>
                              <span className="font-semibold text-indigo-600">₱{agent.averageTicketValue?.toFixed(0) || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No agents assigned to you yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {(user?.role !== 'coordinator' && user?.role !== 'area_coordinator') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Draw Results */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="px-6 py-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Draw Results</h3>
                <div className="space-y-4">
                  {recentDraws.length > 0 ? (
                    recentDraws.map((draw, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{formatDrawTime(draw.drawTime)} Draw</p>
                          <p className="text-sm text-gray-500">{new Date(draw.drawDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{draw.result || 'Pending'}</p>
                          <p className="text-sm text-gray-500">{draw.winners || 0} winners</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent draws available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="px-6 py-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentTickets.length > 0 ? (
                    recentTickets.slice(0, 5).map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {ticket.agentName && !isAgent ? `${ticket.agentName} • ` : ''}
                            {ticket.betCombination || 'No Bets'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₱{ticket.totalAmount}</p>
                          <p className="text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent tickets</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

