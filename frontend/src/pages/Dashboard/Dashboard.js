import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../utils/api';
import WinnerNotifications from '../../components/Notifications/WinnerNotifications';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [showWinnerNotifications, setShowWinnerNotifications] = useState(false);

  // Check if user is an agent (only agents get the betting interface)
  const isAgent = user?.role === 'agent';

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    async () => {
      console.log('🔍 Fetching dashboard data...');
      const response = await api.get('/dashboard');
      console.log('📊 Dashboard API Response:', response.data);
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
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
      refetchInterval: 5000, // Refetch every 5 seconds for live updates
      enabled: !isAgent, // Only for management roles
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
  const currentData = liveData?.data || dashboardData;
  const isLiveData = !!liveData?.data;

  const stats = [
    {
      name: 'Gross Sales',
      value: currentData?.grossSales || 0,
      change: dashboardData?.salesGrowth ? `${dashboardData.salesGrowth >= 0 ? '+' : ''}${dashboardData.salesGrowth.toFixed(1)}%` : '+0%',
      changeType: (dashboardData?.salesGrowth || 0) >= 0 ? 'positive' : 'negative',
      icon: CurrencyDollarIcon,
      format: 'currency',
      isLive: isLiveData
    },
    {
      name: 'Net Sales',
      value: currentData?.netSales || 0,
      change: `${currentData?.netMargin?.toFixed(1) || 0}% margin`,
      changeType: 'positive',
      icon: ChartBarIcon,
      format: 'currency',
      isLive: isLiveData
    },
    {
      name: 'Winners Today',
      value: currentData?.totalWinners || 0,
      change: `${currentData?.totalTickets > 0 ? (currentData.totalWinners / currentData.totalTickets * 100).toFixed(1) : 0}% win rate`,
      changeType: 'positive',
      icon: TrophyIcon,
      format: 'number',
      isLive: isLiveData
    },
    {
      name: 'Active Agents Today',
      value: currentData?.activeAgents || dashboardData?.activeAgents || 0,
      change: `${currentData?.totalAgents > 0 ? ((currentData.activeAgents || 0) / currentData.totalAgents * 100).toFixed(1) : 0}% active`,
      changeType: 'positive',
      icon: UserGroupIcon,
      format: 'number',
      isLive: isLiveData
    },
  ];


  const recentDraws = dashboardData?.recentDraws || [];
  const recentTickets = dashboardData?.recentTickets || [];

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

  // Admin/Coordinator Dashboard - Sales Statistics
  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8 py-2 sm:py-4 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Welcome back, {user?.firstName} {user?.lastName}
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

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3 sm:ml-4 lg:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate flex items-center">
                      {item.name}
                      {item.isLive && (
                        <div className="ml-2 flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="ml-1 text-xs text-green-600">LIVE</span>
                        </div>
                      )}
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                        {item.format === 'currency' 
                          ? `₱${item.value.toLocaleString()}` 
                          : item.value.toLocaleString()
                        }
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-3 sm:px-4 lg:px-5 py-2 sm:py-3">
              <div className="text-xs sm:text-sm">
                <span className={`font-medium ${
                  item.changeType === 'positive' ? 'text-green-600' : 
                  item.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {item.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Enhanced Sales Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
              Financial Summary
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Gross Sales:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₱{currentData?.grossSales?.toLocaleString() || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Winning Amount:</span>
                <span className="text-xs sm:text-sm font-medium text-red-600">
                  ₱{currentData?.winningAmount?.toLocaleString() || '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Yesterday's Sales:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  ₱{dashboardData?.yesterdaySales?.toLocaleString() || '0.00'}
                </span>
              </div>
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base font-medium text-gray-900">Net Sales:</span>
                  <span className="text-sm sm:text-base font-bold text-green-600">
                    ₱{currentData?.netSales?.toLocaleString() || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Net Margin:</span>
                  <span className="text-xs font-medium text-green-600">
                    {currentData?.netMargin?.toFixed(1) || '0.0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
              Per Draw Sales
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">2:00 PM Draw:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₱{(currentData?.drawSales?.['2PM'] || dashboardData?.drawSales?.['2PM'] || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">5:00 PM Draw:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₱{(currentData?.drawSales?.['5PM'] || dashboardData?.drawSales?.['5PM'] || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">9:00 PM Draw:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₱{(currentData?.drawSales?.['9PM'] || dashboardData?.drawSales?.['9PM'] || 0).toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₱{((currentData?.drawSales?.['2PM'] || dashboardData?.drawSales?.['2PM'] || 0) + 
                       (currentData?.drawSales?.['5PM'] || dashboardData?.drawSales?.['5PM'] || 0) + 
                       (currentData?.drawSales?.['9PM'] || dashboardData?.drawSales?.['9PM'] || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical Performance (for management roles) */}
      {!isAgent && dashboardData?.hierarchicalPerformance && (
        <div className="bg-white shadow rounded-lg mb-6 sm:mb-8">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
              Hierarchical Performance
            </h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  ₱{dashboardData.hierarchicalPerformance.summary.totalSales.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  ₱{dashboardData.hierarchicalPerformance.summary.totalWinnings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Winnings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₱{dashboardData.hierarchicalPerformance.summary.totalNetSales.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Net Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.hierarchicalPerformance.summary.totalTickets}
                </p>
                <p className="text-xs text-gray-500">Total Tickets</p>
              </div>
            </div>

            {/* Regions Performance (Superadmin/Admin) */}
            {dashboardData.hierarchicalPerformance.regions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Regions Performance</h4>
                <div className="space-y-3">
                  {dashboardData.hierarchicalPerformance.regions.map((region) => (
                    <div key={region.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{region.name}</p>
                          <p className="text-xs text-gray-500">Region</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₱{region.sales.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Sales</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500">Net Sales</p>
                          <p className="font-medium text-green-600">₱{region.netSales.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tickets</p>
                          <p className="font-medium">{region.tickets}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Margin</p>
                          <p className="font-medium">{region.netMargin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coordinators Performance (Area Coordinator) */}
            {dashboardData.hierarchicalPerformance.coordinators.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Coordinators Performance</h4>
                <div className="space-y-3">
                  {dashboardData.hierarchicalPerformance.coordinators.map((coordinator) => (
                    <div key={coordinator.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{coordinator.name}</p>
                          <p className="text-xs text-gray-500">Coordinator • {coordinator.agentCount} agents</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₱{coordinator.sales.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Sales</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500">Net Sales</p>
                          <p className="font-medium text-green-600">₱{coordinator.netSales.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tickets</p>
                          <p className="font-medium">{coordinator.tickets}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Margin</p>
                          <p className="font-medium">{coordinator.netMargin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agents Performance (Coordinator) */}
            {dashboardData.hierarchicalPerformance.agents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Agents Performance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.hierarchicalPerformance.agents.map((agent) => (
                    <div key={agent.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                          <p className="text-xs text-gray-500">Agent</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₱{agent.sales.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Sales</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Net Sales:</span>
                          <span className="font-medium text-green-600">₱{agent.netSales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tickets:</span>
                          <span className="font-medium">{agent.tickets}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Value:</span>
                          <span className="font-medium">₱{agent.averageTicketValue.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Margin:</span>
                          <span className="font-medium">{agent.netMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Draws and Results - Hidden for coordinators and area coordinators */}
      {(user?.role !== 'coordinator' && user?.role !== 'area_coordinator') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
                Recent Draw Results
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {recentDraws.length > 0 ? (
                  recentDraws.map((draw, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{formatDrawTime(draw.drawTime)} Draw</p>
                        <p className="text-xs text-gray-500">{new Date(draw.drawDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-primary-600">{draw.result || 'Pending'}</p>
                        <p className="text-xs text-gray-500">{draw.winners || 0} winners</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No recent draws available</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {recentTickets.length > 0 ? (
                  recentTickets.slice(0, 5).map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Ticket #{ticket.ticketNumber}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {ticket.agentName && !isAgent ? `${ticket.agentName} • ` : ''}
                          {ticket.betCombination || 'No Bets'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">₱{ticket.totalAmount}</p>
                        <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No recent tickets</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

