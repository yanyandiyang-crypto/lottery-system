import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { 
  TicketIcon, 
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const BetHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'winning'
  const [filters, setFilters] = useState({
    startDate: getCurrentDatePH(),
    endDate: getCurrentDatePH(),
    status: 'all',
    drawTime: 'all'
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Prefetch hierarchy lists for non-agent roles
    (async () => {
      try {
        if (['superadmin', 'admin'].includes(user.role)) {
          // Load all coordinators and agents for selection
          const [coorsRes, agentsRes] = await Promise.all([
            api.get('/users?role=coordinator'),
            api.get('/users?role=agent')
          ]);
          setCoordinators(coorsRes.data.data || []);
          setAgents(agentsRes.data.data || []);
        } else if (user.role === 'area_coordinator') {
          const agents = await api.get('/users/agents');
          const coordinators = await api.get('/users/coordinators', { params: { coordinatorId: user.id } });
          const areaCoors = coordinators.data.data || [];
          setCoordinators(areaCoors);
          // Default to first coordinator selected
          if (areaCoors.length > 0 && !selectedCoordinatorId) {
            setSelectedCoordinatorId(String(areaCoors[0].id));
          }
        } else if (user.role === 'coordinator') {
          const agentsRes = await api.get('/users', { params: { role: 'agent', coordinatorId: user.id } });
          const myAgents = agentsRes.data.data || [];
          setAgents(myAgents);
          if (myAgents.length > 0 && !selectedAgentId) {
            setSelectedAgentId(String(myAgents[0].id));
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user.role]);

  useEffect(() => {
    fetchBetHistory();
  }, [filters, pagination.page, activeTab, selectedAgentId, selectedCoordinatorId, user.role]);

  const fetchBetHistory = async () => {
    try {
      setLoading(true);
      const queryFilters = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      // If on winning tickets tab, filter for won status
      if (activeTab === 'winning') {
        queryFilters.status = 'won';
      }
      
      // Determine which agent's tickets to load based on role
      let agentIdToQuery = user.id;
      if (user.role === 'coordinator' && selectedAgentId) {
        agentIdToQuery = parseInt(selectedAgentId);
      }
      if (user.role === 'area_coordinator') {
        // If an agent is chosen, use it. Otherwise, pick first agent under selected coordinator if available
        if (selectedAgentId) {
          agentIdToQuery = parseInt(selectedAgentId);
        } else if (selectedCoordinatorId) {
          try {
            const agentsRes = await api.get('/users', { params: { role: 'agent', coordinatorId: selectedCoordinatorId } });
            const list = agentsRes.data.data || [];
            setAgents(list);
            if (list.length > 0) {
              agentIdToQuery = list[0].id;
              setSelectedAgentId(String(list[0].id));
            }
          } catch (e) {
            // ignore
          }
        }
      }
      if (['superadmin', 'admin'].includes(user.role)) {
        if (selectedAgentId) {
          agentIdToQuery = parseInt(selectedAgentId);
        } else {
          // No agent selected yet: skip fetch to avoid loading unrelated data
          setTickets([]);
          setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
          setLoading(false);
          return;
        }
      }

      const response = await api.get(`/tickets/agent/${agentIdToQuery}`, { params: queryFilters });

      setTickets(response.data.data.tickets || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.totalCount || 0,
        totalPages: response.data.data.pagination?.totalPages || 0
      }));
    } catch (error) {
      toast.error('Failed to fetch bet history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      setSelectedTicket(response.data.data);
      setShowTicketModal(true);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-800',
      'won': 'bg-green-100 text-green-800',
      'lost': 'bg-red-100 text-red-800',
      'settled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'won':
        return <TrophyIcon className="h-4 w-4 text-green-500" />;
      case 'lost':
        return <DocumentTextIcon className="h-4 w-4 text-red-500" />;
      case 'active':
        return <TicketIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Using utility function for draw time formatting

  const calculateTotalStats = () => {
    if (!Array.isArray(tickets)) {
      return {
        totalBets: 0,
        totalAmount: 0,
        totalWinnings: 0,
        winningTickets: 0,
        winRate: 0,
        netResult: 0
      };
    }

    if (activeTab === 'winning') {
      // For winning tickets tab, show stats for winning tickets only
      const totalWinnings = tickets.reduce((sum, ticket) => sum + (ticket.winAmount || 0), 0);
      const totalAmount = tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
      
      return {
        totalBets: tickets.length,
        totalAmount,
        totalWinnings,
        winningTickets: tickets.length,
        winRate: 100, // All tickets are winners in this tab
        netResult: totalWinnings - totalAmount
      };
    }

    // For all tickets tab, show overall stats
    const totalBets = tickets.length;
    const totalAmount = tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
    const totalWinnings = tickets.filter(t => t.status === 'won').reduce((sum, ticket) => sum + (ticket.winAmount || 0), 0);
    const winningTickets = tickets.filter(t => t.status === 'won').length;
    const winRate = totalBets > 0 ? (winningTickets / totalBets) * 100 : 0;

    return {
      totalBets,
      totalAmount,
      totalWinnings,
      winningTickets,
      winRate,
      netResult: totalWinnings - totalAmount
    };
  };

  const stats = calculateTotalStats();

  if (loading && pagination.page === 1) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bet History</h1>
            <p className="text-gray-600">View your betting history and track performance</p>
          </div>
          <div className="text-sm text-gray-500">
            Total {activeTab === 'winning' ? 'Winning ' : ''}Bets: {stats.totalBets}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TicketIcon className="h-5 w-5 mr-2" />
                All Tickets
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('winning');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'winning'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2" />
                Winning Tickets
              </div>
            </button>
          </nav>
        </div>
      </div>


      {/* Role-based scopes */}
      {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user.role) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scope</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['superadmin', 'admin', 'area_coordinator'].includes(user.role) && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Coordinator</label>
                <select
                  value={selectedCoordinatorId}
                  onChange={(e) => {
                    setSelectedCoordinatorId(e.target.value);
                    setSelectedAgentId('');
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All / None</option>
                  {coordinators.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Agent</option>
                {(
                  // For area coordinator, show agents under selected coordinator (if any); for admin show all; for coordinator show own agents
                  user.role === 'area_coordinator' && selectedCoordinatorId
                    ? agents.filter(a => String(a.coordinatorId) === String(selectedCoordinatorId))
                    : agents
                ).map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {activeTab === 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="settled">Settled</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Draw Time</label>
            <select
              value={filters.drawTime}
              onChange={(e) => setFilters(prev => ({ ...prev, drawTime: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Times</option>
              <option value="twoPM">{formatDrawTime('twoPM')}</option>
              <option value="fivePM">{formatDrawTime('fivePM')}</option>
              <option value="ninePM">{formatDrawTime('ninePM')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bet History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'winning' ? 'Winning Tickets' : 'Betting History'}
          </h2>
          {activeTab === 'winning' && (
            <p className="text-sm text-gray-600 mt-1">
              Showing only tickets that have won prizes
            </p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Draw
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combinations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(tickets) && tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <div className="ml-3">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
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
                      {ticket.bets && ticket.bets.length > 0 ? (
                        ticket.bets.map((bet, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-mono font-bold">{bet.betCombination}</span>
                            <span className="text-gray-500 ml-2">({bet.betType})</span>
                            {ticket.bets.length > 1 && (
                              <span className="text-xs text-gray-400 ml-1">₱{bet.betAmount}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No bets</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(ticket.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.derivedStatus || ticket.status)}`}>
                      {(ticket.derivedStatus || ticket.status).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(ticket.derivedStatus || ticket.status) === 'won' ? (
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(ticket.winAmount || 0)}
                      </div>
                    ) : (ticket.derivedStatus || ticket.status) === 'lost' ? (
                      <div className="text-sm text-red-600">-</div>
                    ) : (
                      <div className="text-sm text-gray-500">Pending</div>
                    )}
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
              ))}
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

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {formatCurrency(selectedTicket.totalAmount)}
                  </div>
                </div>

                {selectedTicket.status === 'won' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Winnings</label>
                    <div className="mt-1 text-lg font-bold text-green-600">
                      {formatCurrency(selectedTicket.winAmount || 0)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Bet Combinations</label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTicket.bets?.map((bet, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-lg">{bet.betCombination}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          bet.isWinner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bet.isWinner ? 'WINNER' : bet.betType.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-600">Bet Type: {bet.betType}</span>
                        <span className="font-medium">{formatCurrency(bet.betAmount)}</span>
                      </div>
                      {bet.isWinner && (
                        <div className="mt-2 text-sm font-medium text-green-600">
                          Won: {formatCurrency(bet.winAmount || 0)}
                        </div>
                      )}
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
  );
};

export default BetHistory;
