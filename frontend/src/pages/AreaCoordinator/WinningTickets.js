import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { 
  TrophyIcon, 
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';

const WinningTickets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'draws', 'analytics', 'agents'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    startDate: getCurrentDatePH(),
    endDate: getCurrentDatePH(),
    drawTime: 'all',
    search: ''
  });
  
  // Analytics data from WinningDashboard
  const [reportData, setReportData] = useState(null);
  const [agentSummary, setAgentSummary] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Prize configuration data
  const [prizeConfig, setPrizeConfig] = useState({
    standard: 450,      // default fallback
    rambolito: 75,      // default fallback for unique numbers
    rambolito_double: 150  // default fallback for double numbers (e.g., 223)
  });

  useEffect(() => {
    // Prefetch hierarchy lists for non-agent roles
    if (['superadmin', 'admin', 'area_coordinator'].includes(user.role)) {
      fetchHierarchyData();
    }
    // Fetch prize configuration
    fetchPrizeConfiguration();
  }, [user.role]);

  useEffect(() => {
    fetchWinningTickets();
  }, [filters, pagination.page, selectedAgentId, selectedCoordinatorId, user.role]);

  const fetchPrizeConfiguration = async () => {
    try {
      const response = await api.get('/prize-configuration');
      const configurations = response.data.data || [];
      
      // Create a mapping of bet types to multipliers
      const configMap = {};
      configurations.forEach(config => {
        if (config.betType && config.multiplier) {
          configMap[config.betType.toLowerCase()] = config.multiplier;
        }
      });
      
      // Update prize config with actual values from database
      setPrizeConfig({
        standard: configMap.standard || configMap.straight || 450,                    // fallback to 450
        rambolito: configMap.rambolito || configMap.rambol || 75,                     // fallback to 75
        rambolito_double: configMap.rambolito_double || configMap.rambol_double || 150 // fallback to 150
      });
    } catch (error) {
      // Keep default values if API fails (403 errors are expected for agents)
    }
  };

  const fetchHierarchyData = async () => {
    try {
      if (user.role === 'area_coordinator') {
        const coordinatorsRes = await api.get('/users', { params: { role: 'coordinator' } });
        setCoordinators(coordinatorsRes.data.data || []);
      } else if (['superadmin', 'admin'].includes(user.role)) {
        // Fetch all agents for superadmin and admin
        const agentsRes = await api.get('/users', { params: { role: 'agent' } });
        setAgents(agentsRes.data.data || []);
      }
    } catch (error) {
      // Silently handle hierarchy fetch errors
    }
  };

  // Analytics functions from WinningDashboard
  const loadWinningReports = async () => {
    setAnalyticsLoading(true);
    try {
      const dateRange = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };

      // Load main summary
      const summaryResponse = await api.get('/winning-reports/summary?' + new URLSearchParams(dateRange));
      if (summaryResponse.data.success) {
        setReportData(summaryResponse.data.report);
      }

      // Load agent summary
      const agentResponse = await api.get('/winning-reports/agent-summary?' + new URLSearchParams(dateRange));
      if (agentResponse.data.success) {
        setAgentSummary(agentResponse.data);
      }

      // Load daily data
      const dailyResponse = await api.get('/winning-reports/daily-summary?days=7');
      if (dailyResponse.data.success) {
        setDailyData(dailyResponse.data);
      }

    } catch (err) {
      toast.error('Error loading winning reports');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchWinningTickets = async () => {
    try {
      setLoading(true);
      const queryFilters = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
        // Remove status filter - we'll filter on frontend for winning tickets
      };
      
      let response;
      
      if (['superadmin', 'admin'].includes(user.role)) {
        // For superadmin and admin: get ALL tickets from ALL agents
        const cacheBust = Date.now();
        response = await api.get('/tickets', { params: { ...queryFilters, _t: cacheBust } });
      } else if (user.role === 'agent') {
        // For agents: use the main tickets API (backend will automatically filter by agent's own tickets)
        response = await api.get('/tickets', { params: queryFilters });
      } else {
        // For other roles: use the existing per-agent logic
        let agentIdToQuery = user.id;
        if (user.role === 'coordinator' && selectedAgentId) {
          agentIdToQuery = parseInt(selectedAgentId);
        }
        if (user.role === 'area_coordinator') {
          // For area coordinator: get ALL winning tickets from ALL agents under selected coordinator
          if (selectedCoordinatorId) {
            // Get all agents under the selected coordinator
            try {
              const agentsRes = await api.get('/users', { params: { role: 'agent', coordinatorId: selectedCoordinatorId } });
              const agentList = agentsRes.data.data || [];
              setAgents(agentList);
            } catch (e) {
              // ignore
            }
          }
          // Use the main tickets API which will filter by region automatically
          response = await api.get('/tickets', { params: queryFilters });
        } else {
          response = await api.get(`/tickets/agent/${agentIdToQuery}`, { params: queryFilters });
        }
      }

      
      // Handle different possible response structures - ensure we always get an array
      let ticketsData = [];
      if (response.data.data?.items && Array.isArray(response.data.data.items)) {
        ticketsData = response.data.data.items;
      } else if (response.data.data?.tickets && Array.isArray(response.data.data.tickets)) {
        ticketsData = response.data.data.tickets;
      } else if (Array.isArray(response.data.data)) {
        ticketsData = response.data.data;
      } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
        ticketsData = response.data.tickets;
      } else {
        ticketsData = []; // Fallback to empty array
      }
      
      
      // Filter to only show tickets that are actual winners
      const actualWinningTickets = ticketsData.filter(ticket => {
        // Must have draw results to determine if winning
        if (!ticket.draw || !ticket.draw.winningNumber) {
          return false;
        }
        
        // Check if ticket has winAmount already calculated
        const hasWinAmount = ticket.winAmount && ticket.winAmount > 0;
        
        // Check if any bets are winning based on draw results
        const winningBets = getWinningBets(ticket);
        const hasWinningBets = winningBets.length > 0;
        
        // Include tickets with winning-related statuses that have actual winnings
        const hasWinningStatus = ['validated', 'claimed', 'pending_approval'].includes(ticket.status) && (hasWinAmount || hasWinningBets);
        
        const isWinner = hasWinAmount || hasWinningBets || hasWinningStatus;
        
        return isWinner;
      });
      
      
      // Ensure we always set an array
      let finalTickets = [];
      
      // Always show actual winning tickets (don't fall back to all tickets)
      finalTickets = Array.isArray(actualWinningTickets) ? actualWinningTickets : [];
      
      
      setTickets(finalTickets);
      
      setPagination(prev => ({
        ...prev,
        total: response.data.data?.pagination?.totalCount || response.data.data?.pagination?.total || 0,
        totalPages: response.data.data?.pagination?.totalPages || response.data.data?.pagination?.pages || 0
      }));
    } catch (error) {
      toast.error('Failed to fetch winning tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const calculateActualPrizeAmount = (ticket) => {
    if (!ticket.bets || !ticket.draw?.winningNumber) {
      return 0;
    }
    
    let totalPrize = 0;
    const winningBets = getWinningBets(ticket);
    
    winningBets.forEach((bet, index) => {
      const betAmount = parseFloat(bet.betAmount) || 0;
      let multiplier = 0;
      let prizeForThisBet = 0;
      
      if (bet.betType === 'standard' || bet.betType === 'straight') {
        // Use actual standard multiplier from configuration
        multiplier = prizeConfig.standard;
        prizeForThisBet = betAmount * multiplier;
        totalPrize += prizeForThisBet;
      } else if (bet.betType === 'rambolito' || bet.betType === 'rambol') {
        // Use correct rambolito multiplier based on double digits
        multiplier = getRambolitoMultiplier(bet.betCombination);
        prizeForThisBet = betAmount * multiplier;
        totalPrize += prizeForThisBet;
      }
      
    });
    
    return totalPrize;
  };

  const getWinningAmount = (ticket) => {
    // Always calculate from bets for accurate display (ignore pre-calculated winAmount)
    return calculateActualPrizeAmount(ticket);
  };

  // Helper function to check if a number has double digits (e.g., 223, 112, 334)
  const hasDoubleDigits = (numberString) => {
    if (!numberString || numberString.length !== 3) return false;
    const digits = numberString.split('');
    return digits[0] === digits[1] || digits[1] === digits[2] || digits[0] === digits[2];
  };

  // Function to get the correct rambolito multiplier based on double digits
  const getRambolitoMultiplier = (betNumber) => {
    return hasDoubleDigits(betNumber) ? prizeConfig.rambolito_double : prizeConfig.rambolito;
  };

  // Function to check if a bet is winning based on draw results
  const checkIfBetIsWinning = (bet, drawWinningNumber) => {
    if (!bet || !drawWinningNumber) return false;
    
    const betNumber = bet.betCombination;
    const winningNumber = drawWinningNumber;
    
    if (bet.betType === 'standard' || bet.betType === 'straight') {
      // Standard/Straight: exact match required
      return betNumber === winningNumber;
    } else if (bet.betType === 'rambolito' || bet.betType === 'rambol') {
      // Rambolito: any order match (sort both numbers and compare)
      const sortedBet = betNumber.split('').sort().join('');
      const sortedWinning = winningNumber.split('').sort().join('');
      return sortedBet === sortedWinning;
    }
    
    return false;
  };

  const getWinningBets = (ticket) => {
    if (!ticket.bets || !ticket.draw?.winningNumber) {
      return [];
    }
    
    const winningBets = ticket.bets.filter(bet => {
      // First check if bet.isWinner is already set
      if (bet.isWinner === true) return true;
      
      // If not set, calculate based on draw results
      const isWinning = checkIfBetIsWinning(bet, ticket.draw.winningNumber);
      
      return isWinning;
    });
    
    return winningBets;
  };

  const calculateTotalWinnings = () => {
    return tickets.reduce((sum, ticket) => sum + getWinningAmount(ticket), 0);
  };

  const calculateTotalTickets = () => {
    return tickets.length;
  };


  // Apply search filter to tickets
  const filteredTickets = tickets.filter(ticket => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
      (ticket.bets && ticket.bets.some(bet => 
        bet.betCombination.toLowerCase().includes(searchTerm)
      ))
    );
  });

  // Calculate statistics using filtered tickets
  const filteredWinningsPerDraw = () => {
    const drawTotals = {};
    
    filteredTickets.forEach(ticket => {
      if (ticket.draw && ticket.draw.drawTime) {
        const drawKey = `${ticket.draw.drawDate}_${ticket.draw.drawTime}`;
        const drawLabel = `${formatDrawTime(ticket.draw.drawTime)} - ${new Date(ticket.draw.drawDate).toLocaleDateString()}`;
        
        if (!drawTotals[drawKey]) {
          drawTotals[drawKey] = {
            label: drawLabel,
            drawTime: ticket.draw.drawTime,
            drawDate: ticket.draw.drawDate,
            totalWinnings: 0,
            ticketCount: 0,
            winningNumber: ticket.draw.winningNumber
          };
        }
        
        drawTotals[drawKey].totalWinnings += getWinningAmount(ticket);
        drawTotals[drawKey].ticketCount += 1;
      }
    });
    
    return Object.values(drawTotals).sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate));
  };

  if (loading && pagination.page === 1) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title={user.role === 'agent' ? 'My Winning Tickets' : 'Winning Tickets'}
          subtitle={user.role === 'agent' 
          }
          icon={TrophyIcon}
        >
          <div className="flex gap-2">
            <ModernButton
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Toggle Filters</span>
              <span className="sm:hidden">Filters</span>
            </ModernButton>
          </div>
        </PageHeader>

        <ModernCard>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'tickets'
                    ? 'border-purple-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrophyIcon className="h-4 w-4 inline mr-2" />
                Winning Tickets
              </button>
              <button
                onClick={() => setActiveTab('draws')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'draws'
                    ? 'border-purple-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                Per Draw Summary
              </button>
              {['superadmin', 'admin'].includes(user.role) && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('analytics');
                      if (!reportData) loadWinningReports();
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'analytics'
                        ? 'border-purple-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ChartBarIcon className="h-4 w-4 inline mr-2" />
                    Analytics Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('agents');
                      if (!agentSummary) loadWinningReports();
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'agents'
                        ? 'border-purple-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <UserGroupIcon className="h-4 w-4 inline mr-2" />
                    Agent Performance
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Summary Stats */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-800">Total Winners</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-900">{calculateTotalTickets()}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-800">Total Winnings</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-900">{formatCurrency(calculateTotalWinnings())}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-800">Average Prize</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-900">
                    {calculateTotalTickets() > 0 ? formatCurrency(calculateTotalWinnings() / calculateTotalTickets()) : '₱0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Filters */}
        {showFilters && (
          <ModernCard className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <FunnelIcon className="h-6 w-6 mr-3 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filter Winning Tickets</h3>
              </div>
            </div>
            <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Draw Time</label>
                <select
                  value={filters.drawTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, drawTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Times</option>
                  <option value="twoPM">{formatDrawTime('twoPM')}</option>
                  <option value="fivePM">{formatDrawTime('fivePM')}</option>
                  <option value="ninePM">{formatDrawTime('ninePM')}</option>
                </select>
              </div>
            </div>
            {/* Agent Selection for Management Roles */}
            {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user.role) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.role === 'area_coordinator' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Coordinator</label>
                    <select
                      value={selectedCoordinatorId}
                      onChange={async (e) => {
                        const coordinatorId = e.target.value;
                        setSelectedCoordinatorId(coordinatorId);
                        setSelectedAgentId('');
                        if (coordinatorId) {
                          try {
                            const agentsRes = await api.get('/users', { params: { role: 'agent', coordinatorId: parseInt(coordinatorId) } });
                            setAgents(agentsRes.data.data || []);
                          } catch (error) {
                            setAgents([]);
                          }
                        } else {
                          setAgents([]);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Coordinator</option>
                      {coordinators.map((coordinator) => (
                        <option key={coordinator.id} value={coordinator.id}>
                          {coordinator.fullName || coordinator.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!['superadmin', 'admin', 'area_coordinator'].includes(user.role) && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Agent</label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.fullName || agent.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ticket number or combination..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            </div>
          </ModernCard>
        )}

        {/* Tab Content */}
        {activeTab === 'tickets' && (
          <>
            {/* Winning Tickets List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">
              Winning Tickets ({filteredTickets.length})
            </h2>
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => {
                const winningBets = getWinningBets(ticket);
                return (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <TrophyIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-mono font-medium text-gray-900 truncate">
                            {ticket.ticketNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600">
                          {formatCurrency(getWinningAmount(ticket))}
                        </div>
                        <div className="text-xs text-gray-500">Prize</div>
                      </div>
                    </div>

                    <div className={`grid gap-3 mb-3 ${['superadmin', 'admin'].includes(user.role) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Draw</div>
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDrawTime(ticket.draw?.drawTime)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(ticket.draw?.drawDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      {['superadmin', 'admin'].includes(user.role) && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Agent</div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-3 w-3 text-gray-400 mr-1" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ticket.agent?.fullName || ticket.agent?.username || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {ticket.agent?.id || ticket.userId}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Winning Numbers</div>
                        <div className="space-y-1">
                          {winningBets.map((bet, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center">
                                <span className="font-mono font-bold text-purple-600">{bet.betCombination}</span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded ml-2">
                                  ✅
                                </span>
                              </div>
                            </div>
                          ))}
                          {winningBets.length === 0 && (
                            <div className="text-sm text-gray-500">No winners</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Winning Combinations</div>
                        <div className="text-sm text-gray-900">
                          {winningBets.length} of {ticket.bets?.length || 0} won
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewTicket(ticket.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  {['superadmin', 'admin'].includes(user.role) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winning Numbers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prize Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  const winningBets = getWinningBets(ticket);
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-3" />
                          <div>
                            <div className="text-sm font-mono font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      {['superadmin', 'admin'].includes(user.role) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ticket.agent?.fullName || ticket.agent?.username || 'Unknown Agent'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {ticket.agent?.id || ticket.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDrawTime(ticket.draw?.drawTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(ticket.draw?.drawDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {winningBets.map((bet, index) => {
                            const betAmount = parseFloat(bet.betAmount) || 0;
                            let multiplier;
                            if (bet.betType === 'standard' || bet.betType === 'straight') {
                              multiplier = prizeConfig.standard;
                            } else if (bet.betType === 'rambolito' || bet.betType === 'rambol') {
                              multiplier = getRambolitoMultiplier(bet.betCombination);
                            }
                            const prize = betAmount * multiplier;
                            
                            return (
                              <div key={index} className="text-sm">
                                <div className="flex items-center">
                                  <span className="font-mono font-bold text-purple-600">{bet.betCombination}</span>
                                  <span className="text-gray-500 ml-2">
                                    ({bet.betType}
                                    {(bet.betType === 'rambolito' || bet.betType === 'rambol') && hasDoubleDigits(bet.betCombination) && ' - Double'})
                                  </span>
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    ✅ WINNER
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  ₱{betAmount} × {multiplier} = {formatCurrency(prize)}
                                </div>
                              </div>
                            );
                          })}
                          {winningBets.length === 0 && (
                            <div className="text-sm text-gray-500">No winning combinations</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-purple-600">
                          {formatCurrency(getWinningAmount(ticket))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {winningBets.length} of {ticket.bets?.length || 0} won
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewTicket(ticket.id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-primary-50 border-purple-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty state removed per request */}
          </>
        )}

        {/* Total Winning per Draw Tab */}
        {activeTab === 'draws' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                Total Winning per Draw ({filteredWinningsPerDraw().length})
              </h2>
            </div>
            
            {filteredWinningsPerDraw().length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredWinningsPerDraw().map((draw, index) => (
                  <div key={index} className="p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {draw.label}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Winning Number: <span className="font-mono font-bold text-purple-600">{draw.winningNumber}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                        <div className="text-center sm:text-right">
                          <div className="text-sm text-gray-500">Total Winnings</div>
                          <div className="text-xl font-bold text-purple-600">
                            {formatCurrency(draw.totalWinnings)}
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="text-sm text-gray-500">Winning Tickets</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {draw.ticketCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No draws with winning tickets found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No winning tickets found for the selected date range. Try adjusting your filters to see more results.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Dashboard Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            ) : reportData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Gross Sales</p>
                        <p className="text-xl font-bold text-blue-900">{formatCurrency(reportData.summary.grossSales)}</p>
                        <p className="text-xs text-blue-600">Total tickets: {reportData.summary.totalTickets}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Expected Winnings</p>
                        <p className="text-xl font-bold text-yellow-900">{formatCurrency(reportData.summary.expectedWinnings)}</p>
                        <p className="text-xs text-yellow-600">Pending: {formatCurrency(reportData.summary.pendingClaims)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Claimed Winnings</p>
                        <p className="text-xl font-bold text-red-900">{formatCurrency(reportData.summary.claimedWinnings)}</p>
                        <p className="text-xs text-red-600">Claimed tickets: {reportData.summary.claimedTickets}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">Net Sales</p>
                        <p className="text-xl font-bold text-purple-900">{formatCurrency(reportData.summary.netSales)}</p>
                        <p className="text-xs text-purple-600">Profit margin: {((reportData.metrics.profitMargin || 0)).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Key Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{((reportData.metrics.claimRate || 0)).toFixed(2)}%</div>
                      <div className="text-sm text-gray-600">Claim Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{((reportData.metrics.profitMargin || 0)).toFixed(2)}%</div>
                      <div className="text-sm text-gray-600">Profit Margin</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{((reportData.metrics.winRate || 0)).toFixed(2)}%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">Analytics data will appear here when available.</p>
              </div>
            )}
          </div>
        )}

        {/* Agent Performance Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading agent performance...</p>
              </div>
            ) : agentSummary ? (
              <div className="bg-white rounded-lg overflow-hidden shadow">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">👥 Agent Performance Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Sales</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed Winnings</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Sales</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Profit %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agentSummary.agentSummaries.map((agent, index) => (
                        <tr key={agent.agentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{agent.agentName}</div>
                            <div className="text-sm text-gray-500">ID: {agent.agentId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(agent.grossSales)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                            {formatCurrency(agent.claimedWinnings)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {formatCurrency(agent.netSales)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {agent.totalTickets} / {agent.claimedTickets}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-center text-sm font-medium ${
                            agent.profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'
                          }`}>
                            {((agent.profitMargin || 0)).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agent performance data</h3>
                <p className="mt-1 text-sm text-gray-500">Agent performance data will appear here when available.</p>
              </div>
            )}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  Winning Ticket Details
                </h3>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ticket Number</label>
                    <div className="mt-1 text-lg font-mono font-bold text-gray-900">
                      {selectedTicket.ticketNumber}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Draw Information</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDrawTime(selectedTicket.draw?.drawTime)} - {new Date(selectedTicket.draw?.drawDate).toLocaleDateString()}
                    </div>
                    {selectedTicket.draw?.result && (
                      <div className="mt-1 text-lg font-bold text-primary-600">
                        Winning Number: {selectedTicket.draw.result}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Prize Amount</label>
                    <div className="mt-1 text-2xl font-bold text-purple-600">
                      {formatCurrency(getWinningAmount(selectedTicket))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      WINNER
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Winning Combinations</label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getWinningBets(selectedTicket).map((bet, index) => (
                      <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-lg text-purple-800">{bet.betCombination}</span>
                          <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                            WINNER
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-600">Bet Type: {bet.betType}</span>
                          <span className="font-medium">{formatCurrency(bet.betAmount)}</span>
                        </div>
                        <div className="mt-2 text-sm font-medium text-purple-600">
                          Prize: {formatCurrency(bet.winAmount || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinningTickets;

