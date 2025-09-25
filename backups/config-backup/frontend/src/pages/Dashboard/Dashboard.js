import React, { useState } from 'react';
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
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  const t = new Date().toISOString().split('T')[0];
                  setDateRange({ startDate: t, endDate: t });
                }}
                className={`px-2 py-1 text-xs ${isTodayRange ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >Today</button>
              <button
                onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - 1);
                  const y = d.toISOString().split('T')[0];
                  setDateRange({ startDate: y, endDate: y });
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >Yesterday</button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date(); start.setDate(start.getDate() - 6);
                  setDateRange({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] });
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >Last 7 days</button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm"
              />
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
              >Refresh</button>
            </div>
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
              <div className={`h-2 w-2 rounded-full ${connected && isTodayRange ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className="text-xs sm:text-sm text-gray-500">
                {isTodayRange ? (connected ? 'Live Updates' : 'Disconnected') : 'History'}
                  </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid removed as requested */}


      {/* Enhanced Sales Analysis removed as requested */}

      {/* Hierarchical Performance (for management roles) */}
      {!isAgent && dashboardData?.hierarchicalPerformance && (
        <div className="bg-white shadow rounded-lg mb-6 sm:mb-8">
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
            <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
              Daily Sales
            </h3>
            
            {/* Modern Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="rounded-lg border border-gray-100 bg-gradient-to-b from-white to-gray-50 px-3 py-3 text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Total Sales</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">₱{dashboardData.hierarchicalPerformance.summary.totalSales.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-red-100 bg-gradient-to-b from-white to-red-50 px-3 py-3 text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-wide text-red-600 mb-1">Total Winnings</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">₱{dashboardData.hierarchicalPerformance.summary.totalWinnings.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-green-100 bg-gradient-to-b from-white to-green-50 px-3 py-3 text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-wide text-green-700 mb-1">Net Sales</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700">₱{dashboardData.hierarchicalPerformance.summary.totalNetSales.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50 px-3 py-3 text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-wide text-blue-700 mb-1">Total Tickets</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700">{dashboardData.hierarchicalPerformance.summary.totalTickets}</div>
              </div>
            </div>

            {/* Regions Performance (Superadmin/Admin) */}
            {dashboardData.hierarchicalPerformance.regions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Regions Performance</h4>
                <div className="space-y-3">
                  {dashboardData.hierarchicalPerformance.regions.map((region) => (
                    <div key={region.id} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{region.name}</p>
                          <p className="text-xs text-gray-500">Region</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">₱{region.sales.toLocaleString()} Sales</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 font-medium">Net ₱{region.netSales.toLocaleString()}</span>
                        <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-2 py-0.5 font-medium">{region.tickets} tickets</span>
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
                    <div key={coordinator.id} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{coordinator.name}</p>
                          <p className="text-xs text-gray-500">Coordinator • {coordinator.agentCount} agents</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">₱{coordinator.sales.toLocaleString()} Sales</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 font-medium">Net ₱{coordinator.netSales.toLocaleString()}</span>
                        <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-2 py-0.5 font-medium">{coordinator.tickets} tickets</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {dashboardData.hierarchicalPerformance.agents.map((agent) => (
                    <div key={agent.id} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                          <p className="text-xs text-gray-500">Agent</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">₱{agent.sales.toLocaleString()} Sales</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 font-medium">Net ₱{agent.netSales.toLocaleString()}</span>
                        <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 px-2 py-0.5 font-medium">{agent.tickets} tickets</span>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 font-medium">Avg ₱{agent.averageTicketValue.toFixed(0)}</span>
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

