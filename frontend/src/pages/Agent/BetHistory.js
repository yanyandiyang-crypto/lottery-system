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
  DocumentTextIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

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
      
      if (user.role === 'agent') {
        // For agents, always use their own ID
        agentIdToQuery = user.id;
      } else if (user.role === 'coordinator' && selectedAgentId) {
        agentIdToQuery = parseInt(selectedAgentId);
      } else if (user.role === 'area_coordinator') {
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
      } else if (['superadmin', 'admin'].includes(user.role)) {
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

      console.log('Fetching tickets for agent:', agentIdToQuery, 'with filters:', queryFilters);
      
      let response;
      try {
        // Try the agent-specific endpoint first
        response = await api.get(`/tickets/agent/${agentIdToQuery}`, { params: queryFilters });
      } catch (agentEndpointError) {
        console.log('Agent endpoint failed, trying main tickets endpoint:', agentEndpointError);
        // If agent endpoint fails, try the main tickets endpoint
        response = await api.get('/tickets', { params: queryFilters });
      }
      
      console.log('API Response:', response.data);
      console.log('Tickets found:', response.data.data?.tickets?.length || response.data.data?.items?.length || 0);

      // Handle different response formats
      let ticketsData = [];
      let paginationData = {};
      
      if (response.data.data?.tickets) {
        // Agent endpoint format
        ticketsData = response.data.data.tickets;
        paginationData = response.data.data.pagination || {};
      } else if (response.data.data?.items) {
        // Main tickets endpoint format
        ticketsData = response.data.data.items;
        paginationData = response.data.data.pagination || {};
      } else if (Array.isArray(response.data.data)) {
        // Direct array format
        ticketsData = response.data.data;
      }
      
      console.log('Setting tickets:', ticketsData.length, 'items');
      setTickets(ticketsData);
      setPagination(prev => ({
        ...prev,
        total: paginationData.totalCount || paginationData.total || 0,
        totalPages: paginationData.totalPages || paginationData.pages || 0
      }));
    } catch (error) {
      toast.error('Failed to fetch bet history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticketId) => {
    // Use the ticket data from the list instead of making a separate API call
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setShowTicketModal(true);
    } else {
      toast.error('Ticket not found in current list');
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
      'no_win': 'bg-red-100 text-red-800',
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

  // Function to get actual ticket status based on draw results
  const getActualTicketStatus = (ticket) => {
    // Debug logging to see what's in the draw data
    console.log('Checking ticket status:', {
      ticketId: ticket.id,
      ticketStatus: ticket.status,
      drawExists: !!ticket.draw,
      drawStatus: ticket.draw?.status,
      winningNumber: ticket.draw?.winningNumber,
      result: ticket.draw?.result,
      drawData: ticket.draw
    });
    
    // If ticket already has a definitive status, use it
    if (['won', 'lost', 'claimed', 'pending_approval'].includes(ticket.status)) {
      // For claimed tickets, we should show them as won for display purposes
      return ticket.status === 'claimed' ? 'won' : ticket.status;
    }
    
    // Check for winning number in different possible fields
    const winningNumber = ticket.draw?.winningNumber || ticket.draw?.result;
    
    // If draw is not completed yet or no winning number, ticket is still active
    if (!ticket.draw || !winningNumber) {
      console.log('No draw or winning number found for ticket', ticket.id);
      return 'active';
    }
    
    console.log('Found winning number:', winningNumber, 'for ticket', ticket.id);
    
    // Check if any bets are winning
    if (ticket.bets && ticket.bets.length > 0) {
      const hasWinningBet = ticket.bets.some(bet => {
        const isWinning = checkIfBetIsWinning(bet, winningNumber);
        console.log('Bet check:', {
          betCombination: bet.betCombination,
          betType: bet.betType,
          winningNumber: winningNumber,
          isWinning: isWinning
        });
        return isWinning;
      });
      
      console.log('Ticket', ticket.id, 'has winning bet:', hasWinningBet);
      return hasWinningBet ? 'won' : 'no_win';
    }
    
    return 'lost';
  };

  // Function to calculate winnings for a ticket
  const calculateTicketWinnings = (ticket) => {
    // Always calculate based on draw results for accuracy
    // Don't trust stored winAmount as it might be incorrect
    const winningNumber = ticket.draw?.winningNumber || ticket.draw?.result;
    
    if (!ticket.bets || !winningNumber) {
      return 0;
    }
    
    let totalWinnings = 0;
    
    ticket.bets.forEach(bet => {
      if (checkIfBetIsWinning(bet, winningNumber)) {
        const betAmount = parseFloat(bet.betAmount) || 0;
        let multiplier = 0;
        
        if (bet.betType === 'standard' || bet.betType === 'straight') {
          multiplier = 450; // Standard multiplier
        } else if (bet.betType === 'rambolito' || bet.betType === 'rambol') {
          // Check for double digits for rambolito double
          const hasDouble = bet.betCombination.split('').some((digit, index, arr) => 
            arr.indexOf(digit) !== index
          );
          multiplier = hasDouble ? 150 : 75; // Rambolito double or regular
        }
        
        totalWinnings += betAmount * multiplier;
        console.log('Winning bet calculation:', {
          betCombination: bet.betCombination,
          betAmount: betAmount,
          multiplier: multiplier,
          winAmount: betAmount * multiplier
        });
      }
    });
    
    console.log('Total winnings for ticket', ticket.id, ':', totalWinnings);
    return totalWinnings;
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

    // For all tickets tab, show overall stats using actual winning detection
    const totalBets = tickets.length;
    const totalAmount = tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
    
    // Calculate actual winnings and winning tickets based on draw results
    let totalWinnings = 0;
    let winningTickets = 0;
    
    tickets.forEach(ticket => {
      const actualStatus = getActualTicketStatus(ticket);
      if (actualStatus === 'won') {
        winningTickets++;
        totalWinnings += calculateTicketWinnings(ticket);
      }
    });
    
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

  if (loading && pagination.page === 1) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="w-full px-2 py-2">
        <div className="mb-2">
          <h1 className="text-lg font-bold text-blue-900 text-center">Bet History</h1>
          <p className="text-xs text-blue-600 text-center">View betting history</p>
        </div>
        
        {/* Ultra-Compact Statistics Cards */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{stats.totalBets}</div>
              <div className="text-xs text-blue-600">Bets</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">₱{stats.totalAmount.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Amount</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">₱{stats.totalWinnings.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Winnings</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{stats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-blue-600">Win Rate</div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation - Hidden since there's a dedicated WinningTickets page */}
        {/* 
        <ModernCard variant="elevated" className="mb-6">
          <div className="px-4 sm:px-6 py-4">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4" aria-label="Bet History Tabs">
              <ModernButton
                variant={activeTab === 'all' ? 'primary' : 'ghost'}
                onClick={() => {
                  setActiveTab('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                icon={TicketIcon}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                All Tickets
                <span className="ml-2 px-2 py-1 bg-white/20 text-xs rounded-full">({stats.totalBets})</span>
              </ModernButton>
              <ModernButton
                variant={activeTab === 'winning' ? 'success' : 'ghost'}
                onClick={() => {
                  setActiveTab('winning');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                icon={TrophyIcon}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                Winning Tickets
                <span className="ml-2 px-2 py-1 bg-white/20 text-xs rounded-full">({stats.winningTickets})</span>
              </ModernButton>
            </nav>
          </div>
        </ModernCard>
        */}


        {/* Ultra-Compact Role-based scopes */}
        {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user.role) && (
          <div className="bg-white rounded p-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">Scope</h3>
            <div className="grid grid-cols-2 gap-1">
              {['superadmin', 'admin', 'area_coordinator'].includes(user.role) && (
                <select
                  value={selectedCoordinatorId}
                  onChange={(e) => {
                    setSelectedCoordinatorId(e.target.value);
                    setSelectedAgentId('');
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
                >
                  <option value="">All Coordinators</option>
                  {coordinators.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              )}
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
              >
                <option value="">Select Agent</option>
                {(
                  user.role === 'area_coordinator' && selectedCoordinatorId
                    ? agents.filter(a => String(a.coordinatorId) === String(selectedCoordinatorId))
                    : agents
                ).map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Ultra-Compact Filters */}
        <div className="bg-white rounded p-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">Filters</h3>
          <div className="grid grid-cols-2 gap-1">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
            />
            {activeTab === 'all' && (
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            )}
            <select
              value={filters.drawTime}
              onChange={(e) => setFilters(prev => ({ ...prev, drawTime: e.target.value }))}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
            >
              <option value="all">All Times</option>
              <option value="twoPM">{formatDrawTime('twoPM')}</option>
              <option value="fivePM">{formatDrawTime('fivePM')}</option>
              <option value="ninePM">{formatDrawTime('ninePM')}</option>
            </select>
          </div>
        </div>

        {/* Bet History Table */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TicketIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Betting History
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {tickets.length} tickets
              </span>
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
                    {(() => {
                      const actualStatus = getActualTicketStatus(ticket);
                      const displayStatus = actualStatus === 'no_win' ? 'NO WIN' : actualStatus.toUpperCase();
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(actualStatus)}`}>
                          {displayStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const actualStatus = getActualTicketStatus(ticket);
                      const calculatedWinnings = calculateTicketWinnings(ticket);
                      
                      if (actualStatus === 'won') {
                        return (
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(calculatedWinnings)}
                          </div>
                        );
                      } else if (actualStatus === 'no_win' || actualStatus === 'lost') {
                        return <div className="text-sm text-red-600">-</div>;
                      } else {
                        return <div className="text-sm text-gray-500">Pending</div>;
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <ModernButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewTicket(ticket.id)}
                      icon={EyeIcon}
                    >
                      View
                    </ModernButton>
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
        </ModernCard>

        {/* Ticket Detail Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <ModernCard variant="elevated" className="w-full max-w-4xl animate-bounce-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      Ticket Details
                    </h3>
                  </div>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTicketModal(false)}
                    icon={XMarkIcon}
                    className="text-gray-400 hover:text-gray-600"
                  />
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
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetHistory;
