import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
// import { useSocket } from '../../contexts/SocketContext'; // Socket.IO disabled
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
  // const { connected } = useSocket(); // Socket.IO disabled - not needed
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Today's Draws
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Select a draw to place your bets
                </p>
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
                {/* Simple Clean Draw Cards */}
                <div className="space-y-3">
                  {drawTimes.map((draw, index) => (
                    <div
                      key={draw.id}
                      className={`relative rounded-2xl transition-all duration-200 ${
                        (draw.status === 'betting' || draw.status === 'cutoff')
                          ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
                          : 'cursor-default opacity-75'
                      }`}
                      onClick={() => {
                        if (draw.status === 'betting' || draw.status === 'cutoff') {
                          window.location.href = `/betting?draw=${draw.id}&time=${encodeURIComponent(draw.time)}`;
                        }
                      }}
                    >
                      {/* Simple Gradient Background */}
                      <div className={`rounded-2xl p-4 ${
                        draw.status === 'betting' 
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/30' 
                          : draw.status === 'cutoff'
                          ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 animate-pulse'
                          : draw.status === 'completed'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-sm'
                      }`}>
                        
                        <div className="flex items-center justify-between text-white">
                          {/* Left - Time Badge & Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                              <span className="text-2xl font-bold">{draw.label}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">3D LOTTO</h3>
                              <p className="text-sm text-white/90">{draw.time}</p>
                            </div>
                          </div>
                          
                          {/* Right - Prize & Status */}
                          <div className="text-right">
                            <div className="text-2xl font-bold mb-1">{draw.prize}</div>
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              draw.status === 'betting' 
                                ? 'bg-white/25 text-white' 
                                : draw.status === 'cutoff'
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-white/15 text-white/80'
                            }`}>
                              {draw.status === 'betting' && <><PlayIcon className="w-3 h-3" /> OPEN</>}
                              {draw.status === 'cutoff' && <><ClockIcon className="w-3 h-3" /> CLOSING</>}
                              {draw.status === 'completed' && <><CheckCircleIcon className="w-3 h-3" /> DONE</>}
                              {draw.status === 'closed' && <><CheckCircleIcon className="w-3 h-3" /> CLOSED</>}
                              {draw.status === 'upcoming' && <><ClockIcon className="w-3 h-3" /> SOON</>}
                              {(draw.status === 'pending' || draw.status === 'unavailable') && <><ClockIcon className="w-3 h-3" /> WAIT</>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  ))}
                </div>
                
                {/* Quick Stats */}
                <div className="bg-white rounded-2xl shadow-md p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {drawTimes.filter(d => d.status === 'betting').length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Open Now</div>
                    </div>
                    
                    <div className="text-center border-x border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">₱4.5K</div>
                      <div className="text-xs text-gray-500 mt-1">Prize</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">3</div>
                      <div className="text-xs text-gray-500 mt-1">Daily Draws</div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title={<span className="text-[clamp(18px,3.5vw,24px)]">Dashboard</span>}
          icon={ChartBarIcon}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <CalendarDaysIcon className="h-4 w-4 text-green-600" />
                <span>{new Date(dateRange.startDate).toLocaleDateString()}</span>
                {dateRange.startDate !== dateRange.endDate && (
                  <>
                    <span>-</span>
                    <span>{new Date(dateRange.endDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            
            <ModernCard className="p-2">
              <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
                <div className="flex flex-wrap gap-1">
                  <ModernButton
                    onClick={() => {
                      const t = getCurrentDatePH();
                      setDateRange({ startDate: t, endDate: t });
                    }}
                    variant={isTodayRange ? 'success' : 'secondary'}
                    size="xs"
                    className="px-3 py-1.5 text-[clamp(10px,2.4vw,12px)]"
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
                    size="xs"
                    className="px-3 py-1.5 text-[clamp(10px,2.4vw,12px)]"
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
                    size="xs"
                    className="px-3 py-1.5 text-[clamp(10px,2.4vw,12px)]"
                  >
                    Last 7 days
                  </ModernButton>
                  <ModernButton
                    onClick={() => refetch()}
                    variant="success"
                    size="xs"
                    className="px-3 py-1.5 text-[clamp(10px,2.4vw,12px)]"
                  >
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Refresh</span>
                  </ModernButton>
                </div>
                
                <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-auto min-w-[120px]"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-auto min-w-[120px]"
                  />
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {user?.role === 'superadmin' || user?.role === 'admin' ? 'System Overview' :
                   user?.role === 'area_coordinator' ? 'My Coordinators' :
                   user?.role === 'coordinator' ? 'My Agents' : 'Performance'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <EyeIcon className="h-4 w-4 text-green-600" />
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 text-sm">
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 text-sm">
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Recent Draw Results</h3>
                <p className="text-sm text-gray-600 mt-1">Latest results</p>
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Latest tickets</p>
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

