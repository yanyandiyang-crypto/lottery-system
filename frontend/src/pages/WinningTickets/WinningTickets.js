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
  UserGroupIcon
} from '@heroicons/react/24/outline';

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
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'draws'
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

  useEffect(() => {
    // Prefetch hierarchy lists for non-agent roles
    if (['superadmin', 'admin', 'area_coordinator'].includes(user.role)) {
      fetchHierarchyData();
    }
  }, [user.role]);

  useEffect(() => {
    fetchWinningTickets();
  }, [filters, pagination.page, selectedAgentId, selectedCoordinatorId, user.role]);

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
      console.error('Error fetching hierarchy data:', error);
    }
  };

  const fetchWinningTickets = async () => {
    try {
      setLoading(true);
      const queryFilters = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        status: 'won' // Only fetch winning tickets
      };

      let response;
      
      if (['superadmin', 'admin'].includes(user.role)) {
        // For superadmin and admin: get ALL winning tickets from ALL agents
        // Add cache-busting parameter to ensure fresh data
        const cacheBust = Date.now();
        response = await api.get('/tickets', { params: { ...queryFilters, _t: cacheBust } });
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

      const ticketsData = response.data.data.tickets || [];
      console.log('Fetched winning tickets:', ticketsData.length);
      ticketsData.forEach(ticket => {
        console.log('Ticket:', ticket.ticketNumber, 'Win Amount:', ticket.winAmount, 'Bets:', ticket.bets?.length);
        if (ticket.bets) {
          ticket.bets.forEach(bet => {
            if (bet.isWinner) {
              console.log('  Winning bet:', bet.betCombination, 'Amount:', bet.winAmount);
            }
          });
        }
      });
      
      setTickets(ticketsData);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.totalCount || 0,
        totalPages: response.data.data.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching winning tickets:', error);
      toast.error('Failed to fetch winning tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
    // Use the ticket data from the list instead of making a separate API call
    // This ensures we have the correct winAmount and betting data
    const ticket = tickets.find(t => t.id === ticketId);
    console.log('Viewing ticket from list:', ticket);
    console.log('Ticket winAmount:', ticket?.winAmount);
    console.log('Ticket bets:', ticket?.bets);
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const getWinningAmount = (ticket) => {
    return ticket.winAmount || 0;
  };

  const getWinningBets = (ticket) => {
    if (!ticket.bets) return [];
    return ticket.bets.filter(bet => bet.isWinner);
  };

  const calculateTotalWinnings = () => {
    return tickets.reduce((sum, ticket) => sum + getWinningAmount(ticket), 0);
  };

  const calculateTotalTickets = () => {
    return tickets.length;
  };

  const calculateWinningsPerDraw = () => {
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

  if (loading && pagination.page === 1) return <LoadingSpinner />;

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-2 sm:mr-3" />
                {user.role === 'agent' ? 'My Winning Tickets' : 'Winning Tickets'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {user.role === 'agent' 
                  ? 'View all your winning lottery tickets and prize details'
                  : 'View winning lottery tickets and prize details for agents under your supervision'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrophyIcon className="h-4 w-4 inline mr-2" />
                Winning Tickets
              </button>
              <button
                onClick={() => setActiveTab('draws')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'draws'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                Total Winning per Draw
              </button>
            </nav>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-800">Total Winners</p>
                  <p className="text-lg sm:text-xl font-bold text-green-900">{calculateTotalTickets()}</p>
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
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Filter Winning Tickets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Draw Time</label>
                <select
                  value={filters.drawTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, drawTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            console.error('Error fetching agents:', error);
                            setAgents([]);
                          }
                        } else {
                          setAgents([]);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
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
                        <div className="text-sm font-bold text-green-600">
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
                        <div className="text-sm font-medium text-gray-900">
                          {winningBets.map(bet => bet.betCombination).join(', ')}
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
                          {winningBets.map((bet, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-mono font-bold text-green-600">{bet.betCombination}</span>
                              <span className="text-gray-500 ml-2">({bet.betType})</span>
                            </div>
                          ))}
                          {winningBets.length === 0 && (
                            <div className="text-sm text-gray-500">No winning numbers</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(getWinningAmount(ticket))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {winningBets.length} of {ticket.bets?.length || 0} won
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewTicket(ticket.id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
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

        {/* Empty State */}
        {filteredTickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No winning tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {['superadmin', 'admin'].includes(user.role)
                ? 'No winning tickets found for the selected date range. Try adjusting your filters to see more results.'
                : filters.search || filters.startDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || filters.endDate !== new Date().toISOString().split('T')[0]
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t won any tickets yet. Keep playing!'
              }
            </p>
          </div>
        )}
          </>
        )}

        {/* Total Winning per Draw Tab */}
        {activeTab === 'draws' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                Total Winning per Draw ({calculateWinningsPerDraw().length})
              </h2>
            </div>
            
            {calculateWinningsPerDraw().length > 0 ? (
              <div className="divide-y divide-gray-200">
                {calculateWinningsPerDraw().map((draw, index) => (
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
                              Winning Number: <span className="font-mono font-bold text-green-600">{draw.winningNumber}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                        <div className="text-center sm:text-right">
                          <div className="text-sm text-gray-500">Total Winnings</div>
                          <div className="text-xl font-bold text-green-600">
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
                    <div className="mt-1 text-2xl font-bold text-green-600">
                      {formatCurrency(getWinningAmount(selectedTicket))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      WINNER
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Winning Combinations</label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getWinningBets(selectedTicket).map((bet, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-lg text-green-800">{bet.betCombination}</span>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            WINNER
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-600">Bet Type: {bet.betType}</span>
                          <span className="font-medium">{formatCurrency(bet.betAmount)}</span>
                        </div>
                        <div className="mt-2 text-sm font-medium text-green-600">
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

