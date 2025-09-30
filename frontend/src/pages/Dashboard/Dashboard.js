import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../utils/api';
import WinnerNotifications from '../../components/Notifications/WinnerNotifications';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { getCurrentDatePH, getTodayRange } from '../../utils/dateUtils';
import {
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  CurrencyDollarIcon,
  TicketIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowUpIcon,
  EyeIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [showWinnerNotifications, setShowWinnerNotifications] = useState(false);

  // Check if user is an agent (only agents get the betting interface)
  const isAgent = user?.role === 'agent';

  // Fetch dashboard data - Use Philippines timezone
  const [dateRange, setDateRange] = useState(() => getTodayRange());

  const isTodayRange = dateRange.startDate === dateRange.endDate && dateRange.startDate === getCurrentDatePH();

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await api.get('/dashboard', { params: dateRange });
      return response.data.data; // unwrap { success, data }
    },
    refetchInterval: isTodayRange ? 60000 : false, // Reduced from 30s to 60s
    staleTime: 30000, // Consider data fresh for 30s
    gcTime: 300000, // Keep in cache for 5 minutes (renamed from cacheTime in v5)
  });

  // Live dashboard data polling disabled to reduce server load
  // Main dashboard query with 60s interval is sufficient for real-time updates

  // Fetch active draws
  const { data: activeDraws, isLoading: drawsLoading, error: drawsError } = useQuery({
    queryKey: ['activeDraws'],
    queryFn: async () => {
      const response = await api.get('/draws/current/active');
      return response.data.data || [];
    },
    refetchInterval: 60000, // Reduced from 30s to 60s
    staleTime: 30000, // Consider data fresh for 30s
  });

  // Create all three draws with proper status
  const createDrawCard = (drawTime, hour, label) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const drawDateTime = new Date(today);
    drawDateTime.setHours(hour, 0, 0, 0);
    
    // Find existing draw from API data
    const existingDraw = Array.isArray(activeDraws) ? 
      activeDraws.find(draw => draw.drawTime === drawTime) : null;
    
    // Draw card creation logic
    
    let status, color, description, icon;
    
    // Calculate cutoff time (5 minutes before draw)
    const cutoffTime = new Date(drawDateTime.getTime() - 5 * 60 * 1000);
    
    if (existingDraw) {
      // Use the isAvailable property from the API with enhanced logic
      if (existingDraw.isAvailable && now < cutoffTime) {
        // Normal betting period
        status = 'betting';
        color = 'green';
        description = 'Betting Open';
      } else if (existingDraw.isAvailable && now >= cutoffTime && now < drawDateTime) {
        // Cutoff period (last 5 minutes)
        status = 'cutoff';
        color = 'orange';
        description = 'Closing Soon';
      } else if (now >= drawDateTime) {
        // Draw has started or completed
        if (existingDraw.result) {
          status = 'completed';
          color = 'blue';
          description = 'Draw Completed';
        } else {
          status = 'closed';
          color = 'red';
          description = 'Betting Closed';
        }
      } else {
        // Draw exists but not available yet
        status = 'upcoming';
        color = 'gray';
        description = 'Upcoming Draw';
      }
    } else {
      // No draw exists yet
      if (now < drawDateTime - 30 * 60 * 1000) { // 30 minutes before
        status = 'upcoming';
        color = 'gray';
        description = 'Upcoming Draw';
      } else if (now >= drawDateTime) {
        status = 'unavailable';
        color = 'gray';
        description = 'Draw Unavailable';
      } else {
        status = 'pending';
        color = 'yellow';
        description = 'Draw Pending';
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

  // Calculate accurate sales metrics
  const salesMetrics = useMemo(() => {
    // Check if we have dashboard data
    if (!dashboardData) {
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

    // Return calculated metrics

    return {
      grossSales,
      totalWinnings,
      netSales,
      totalTickets,
      averageTicket,
      profitMargin
    };
  }, [dashboardData]);

  // Dashboard ready

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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent animate-fade-in" style={{animationDelay: '100ms'}}>
                  Today's Draws
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  Select a draw time to place your bets
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-gray-600 font-medium">
                    {connected ? 'Live Updates' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Draw Selection */}
          <div className="space-y-4 mb-6">
            {drawsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-200 border-t-sky-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 font-medium">Loading draws...</p>
                </div>
              </div>
            ) : drawsError ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-sm mx-auto">
                  <div className="p-2 bg-red-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-red-800 mb-2">Unable to Load Draws</h3>
                  <p className="text-red-600 text-sm mb-3">{drawsError.message}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Ultra Compact Draw Cards */}
                <div className="space-y-2">
                  {drawTimes.map((draw, index) => (
                    <div
                      key={draw.id}
                      className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                        (draw.status === 'betting' || draw.status === 'cutoff')
                          ? 'cursor-pointer hover:shadow-md' 
                          : 'cursor-default'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        if (draw.status === 'betting' || draw.status === 'cutoff') {
                          window.location.href = `/betting?draw=${draw.id}&time=${encodeURIComponent(draw.time)}`;
                        }
                      }}
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 ${
                        draw.status === 'betting' 
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                          : draw.status === 'cutoff'
                          ? 'bg-gradient-to-r from-orange-400 to-red-500 animate-pulse'
                          : draw.status === 'completed'
                          ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                          : draw.status === 'closed'
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                          : 'bg-gradient-to-r from-slate-300 to-gray-400'
                      } opacity-90`} />
                      
                      {/* Shimmer Effect */}
                      {(draw.status === 'betting' || draw.status === 'cutoff') && (
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-shimmer" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="relative p-3 text-white">
                        <div className="flex items-center justify-between">
                          {/* Left Side - Draw Info */}
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold shadow-md backdrop-blur-sm ${
                              draw.status === 'betting' 
                                ? 'bg-white/25 border border-white/40' 
                                : 'bg-white/15 border border-white/25'
                            }`}>
                              {draw.label}
                            </div>
                            <div>
                              <h3 className="text-base font-bold">3D LOTTO</h3>
                              <p className="text-white/90 text-xs">{draw.time} • {draw.description}</p>
                            </div>
                          </div>
                          
                          {/* Center - Prize */}
                          <div className="text-center">
                            <div className="text-xl font-bold">{draw.prize}</div>
                            <p className="text-white/80 text-xs">Prize</p>
                          </div>
                          
                          {/* Right Side - Action */}
                          <div className="flex items-center">
                            {draw.status === 'betting' && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium hover:bg-white/30 transition-all duration-300">
                                <PlayIcon className="w-3 h-3 mr-1" />
                                Bet
                              </div>
                            )}
                            
                            {draw.status === 'cutoff' && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-400/90 text-yellow-900 text-xs font-medium animate-pulse">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                Last Call!
                              </div>
                            )}

                            {draw.status === 'upcoming' && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/15 backdrop-blur-sm border border-white/25 text-white/70 text-xs font-medium">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                Soon
                              </div>
                            )}

                            {draw.status === 'closed' && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/15 backdrop-blur-sm border border-white/25 text-white/70 text-xs font-medium">
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Closed
                              </div>
                            )}

                            {draw.status === 'completed' && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium">
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Done
                              </div>
                            )}

                            {(draw.status === 'pending' || draw.status === 'unavailable') && (
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-white/50 text-xs font-medium">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {draw.status === 'pending' ? 'Wait' : 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Indicator */}
                      {(draw.status === 'betting' || draw.status === 'cutoff') && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-3 h-3 rounded-full ${
                            draw.status === 'betting' ? 'bg-green-300 animate-pulse' : 'bg-orange-300 animate-ping'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Compact Stats */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-4 shadow-md">
                  <div className="flex items-center justify-around text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-1">
                        <PlayIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {drawTimes.filter(d => d.status === 'betting').length}
                      </div>
                      <div className="text-xs text-gray-600">Open</div>
                    </div>
                    
                    <div className="w-px h-8 bg-gray-200"></div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-1">
                        <TrophyIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">₱4,500</div>
                      <div className="text-xs text-gray-600">Prize</div>
                    </div>
                    
                    <div className="w-px h-8 bg-gray-200"></div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-1">
                        <ClockIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">3</div>
                      <div className="text-xs text-gray-600">Daily</div>
                    </div>
                  </div>
                </div>
              </>
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${user?.firstName} ${user?.lastName}`}
          icon={ChartBarIcon}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${connected && isTodayRange ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600 font-medium">
                  {isTodayRange ? (connected ? 'Live Updates' : 'Disconnected') : 'Historical Data'}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
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
            
            <ModernCard className="p-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
                <div className="flex flex-wrap gap-1">
                  <ModernButton
                    onClick={() => {
                      const t = getCurrentDatePH();
                      setDateRange({ startDate: t, endDate: t });
                    }}
                    variant={isTodayRange ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    Today
                  </ModernButton>
                  <ModernButton
                    onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() - 1);
                      const y = d.toISOString().split('T')[0];
                      setDateRange({ startDate: y, endDate: y });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Yesterday
                  </ModernButton>
                  <ModernButton
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(); start.setDate(start.getDate() - 6);
                      setDateRange({ 
                        startDate: start.toISOString().split('T')[0], 
                        endDate: end.toISOString().split('T')[0] 
                      });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Last 7 days
                  </ModernButton>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <ModernButton
                    onClick={() => refetch()}
                    variant="primary"
                    size="sm"
                  >
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </div>
        </PageHeader>

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


            {/* Modern Sales Metrics Cards */}
            {!isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                  title="Gross Sales"
                  value={`₱${salesMetrics.grossSales.toLocaleString()}`}
                  icon={CurrencyDollarIcon}
                  color="primary"
                  trend={salesMetrics.grossSales === 0 ? 'No Revenue' : 'Total Revenue'}
                />

                <StatCard
                  title="Winnings Paid"
                  value={`₱${salesMetrics.totalWinnings.toLocaleString()}`}
                  icon={TrophyIcon}
                  color="danger"
                  trend="Payouts"
                  subtitle={
                    (dashboardData?.pendingWinnings || dashboardData?.approvedWinnings) ? (
                      <div className="text-xs text-gray-500 mt-2">
                        <div className="flex justify-between">
                          <span className="text-orange-600">
                            Pending: ₱{(dashboardData.pendingWinnings || 0).toLocaleString()}
                          </span>
                          <span className="text-green-600">
                            Paid: ₱{(dashboardData.approvedWinnings || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          *Only paid winnings deducted from net sales
                        </div>
                      </div>
                    ) : null
                  }
                />

                <StatCard
                  title="Net Sales"
                  value={`₱${salesMetrics.netSales.toLocaleString()}`}
                  icon={ChartBarIcon}
                  color="success"
                  trend={`${salesMetrics.profitMargin.toFixed(1)}% Profit Margin`}
                />

                <StatCard
                  title="Total Tickets"
                  value={salesMetrics.totalTickets.toLocaleString()}
                  icon={TicketIcon}
                  color="primary"
                  trend={`₱${salesMetrics.averageTicket.toFixed(0)} Avg`}
                />
              </div>
            )}
          </>
        )}

        {/* Role-Based Performance Breakdown */}
        {!isAgent && (
          <ModernCard className="mb-8">
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {user?.role === 'superadmin' || user?.role === 'admin' ? 'System Overview' :
                   user?.role === 'area_coordinator' ? 'My Coordinators' :
                   user?.role === 'coordinator' ? 'My Agents' : 'Performance'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <EyeIcon className="h-4 w-4" />
                  <span className="font-medium">{user?.role?.replace('_', ' ').toUpperCase()} View</span>
                </div>
              </div>
            </div>
            <div className="p-6">

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
          </ModernCard>
        )}

        {/* Recent Activity Section */}
        {(user?.role !== 'coordinator' && user?.role !== 'area_coordinator') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModernCard>
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Recent Draw Results</h3>
                <p className="text-sm text-gray-600 mt-1">Latest lottery draw outcomes</p>
              </div>
              <div className="p-6">
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
            </ModernCard>

            {/* Recent Activity */}
            <ModernCard>
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Latest ticket transactions</p>
              </div>
              <div className="p-6">
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
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

