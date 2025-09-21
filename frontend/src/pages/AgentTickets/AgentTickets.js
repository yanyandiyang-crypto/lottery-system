import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  TicketIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AgentTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    drawTime: 'all',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Check if user can reprint tickets
  const canReprint = () => {
    return user.role === 'agent' || user.role === 'superadmin';
  };

  const fetchHierarchyData = useCallback(async () => {
    try {
      if (user.role === 'area_coordinator') {
        const coordinatorsRes = await userAPI.getUsers({ role: 'coordinator' });
        setCoordinators(coordinatorsRes.data.data || []);
      } else if (['superadmin', 'admin'].includes(user.role)) {
        // Fetch all agents for superadmin and admin
        const agentsRes = await userAPI.getUsers({ role: 'agent' });
        setAgents(agentsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
    }
  }, [user.role]);

  useEffect(() => {
    // Prefetch hierarchy lists for non-agent roles
    if (['superadmin', 'admin', 'area_coordinator'].includes(user.role)) {
      fetchHierarchyData();
    }
  }, [user.role, fetchHierarchyData]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        drawTime: filters.drawTime,
        page: pagination.currentPage,
        limit: pagination.limit
      });

      let response;
      let agentIdToQuery = user.id;

      if (['superadmin', 'admin'].includes(user.role)) {
        // For superadmin and admin: get ALL tickets from ALL agents
        response = await api.get(`/tickets?${queryParams}`);
      } else if (user.role === 'coordinator' && selectedAgentId) {
        // For coordinator: get tickets from selected agent
        agentIdToQuery = parseInt(selectedAgentId);
        response = await api.get(`/tickets/agent/${agentIdToQuery}?${queryParams}`);
      } else if (user.role === 'area_coordinator') {
        // For area coordinator: get ALL tickets from ALL agents under selected coordinator
        if (selectedCoordinatorId) {
          // Get all agents under the selected coordinator
          try {
            const agentsRes = await userAPI.getUsers({ role: 'agent', coordinatorId: selectedCoordinatorId });
            const agentList = agentsRes.data.data || [];
            setAgents(agentList);
            
            // Use the main tickets API which will filter by region automatically
            response = await api.get(`/tickets?${queryParams}`);
          } catch (e) {
            // If error, fallback to main tickets API
            response = await api.get(`/tickets?${queryParams}`);
          }
        } else {
          // If no coordinator selected, get all tickets from area coordinator's region
          response = await api.get(`/tickets?${queryParams}`);
        }
      } else {
        // For agents: get their own tickets
        response = await api.get(`/tickets/agent/${user.id}?${queryParams}`);
      }

      if (response.data.success) {
        setTickets(response.data.data.tickets);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit, user.id, user.role, selectedAgentId, selectedCoordinatorId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, selectedAgentId, selectedCoordinatorId]);

  // Fetch agents when coordinator selection changes for area coordinators
  useEffect(() => {
    if (user.role === 'area_coordinator' && selectedCoordinatorId) {
      const fetchAgentsForCoordinator = async () => {
        try {
          const agentsRes = await userAPI.getUsers({ role: 'agent', coordinatorId: selectedCoordinatorId });
          setAgents(agentsRes.data.data || []);
        } catch (error) {
          console.error('Error fetching agents for coordinator:', error);
        }
      };
      fetchAgentsForCoordinator();
    }
  }, [selectedCoordinatorId, user.role]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleReprint = async (ticket) => {
    try {
      const response = await api.post(`/tickets/${ticket.id}/reprint`);
      if (response.data.success) {
        toast.success('Ticket reprinted successfully');
        // Generate and print the ticket
        await generateAndPrintTicket(ticket);
        // Refresh tickets to update reprint count
        fetchTickets();
      }
    } catch (error) {
      console.error('Error reprinting ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to reprint ticket');
    }
  };

  const generateAndPrintTicket = async (ticket) => {
    try {
      // Fetch assigned templates
      const templatesResponse = await api.get(`/ticket-templates/agent/${user.id}`);
      const templates = templatesResponse.data.data || [];
      
      // Find the template used for this ticket or fallback to assigned templates
      let selectedTemplate = templates.find(t => t.id === ticket.templateId);
      
      // If no specific template found, use mobile template if available, otherwise first assigned template
      if (!selectedTemplate) {
        selectedTemplate = templates.find(t => t.design?.templateType === 'mobile') || templates[0];
      }

      let ticketHtml;
      if (selectedTemplate && selectedTemplate.design && selectedTemplate.design.elements) {
        ticketHtml = await generateCustomTicketTemplate(ticket, selectedTemplate);
      } else {
        ticketHtml = generateDefaultTicketTemplate(ticket);
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(ticketHtml);
      printWindow.document.close();
      
      // Wait for images to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
        }, 500);
      };
      
      toast.success(`${selectedTemplate?.design?.templateType === 'mobile' ? 'Mobile' : 'Custom'} ticket reprinted`);
    } catch (error) {
      console.error('Error printing ticket:', error);
      toast.error('Failed to print ticket');
    }
  };

  // Helper function to convert image URL to base64
  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const generateCustomTicketTemplate = async (ticket, template) => {
    try {
      // Use backend template generation for better consistency
      const response = await api.post('/ticket-templates/generate', {
        ticketId: ticket.id,
        templateId: template.id
      });
      
      return response.data.data.html;
          } catch (error) {
      console.error('Error generating custom template:', error);
      // Fallback to default template
      return generateDefaultTicketTemplate(ticket);
    }
  };

  const generateDefaultTicketTemplate = (ticket) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lottery Ticket</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .ticket { width: 300px; margin: 0 auto; border: 2px solid #000; padding: 15px; }
          .header { text-align: center; margin-bottom: 15px; }
          .logo { width: 60px; height: 60px; margin: 0 auto 10px; }
          .qr-code { width: 80px; height: 80px; margin: 10px auto; display: block; }
          .info { margin: 5px 0; }
          @media print { 
            body { margin: 0; padding: 0; } 
            .ticket { margin: 0; border: 2px solid #000; } 
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="logo">
              <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="#1e40af" stroke="#000" stroke-width="2"/>
                <text x="50" y="35" text-anchor="middle" fill="white" font-size="12" font-weight="bold">LOTTERY</text>
                <text x="50" y="50" text-anchor="middle" fill="white" font-size="16" font-weight="bold">3D</text>
                <text x="50" y="65" text-anchor="middle" fill="white" font-size="10">SYSTEM</text>
              </svg>
            </div>
            <h3 style="margin: 0;">Official Lottery Ticket</h3>
          </div>
          <div class="info"><strong>Ticket #:</strong> ${ticket.ticketNumber}</div>
          <div class="info"><strong>Draw:</strong> ${formatDrawTimeForTicket(ticket.draw?.drawTime)} - ${ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'TBD'}</div>
          <div class="info"><strong>Numbers:</strong> <span style="font-size: 18px; font-weight: bold; color: #1e40af;">${ticket.bets && ticket.bets.length > 0 ? ticket.bets.map(bet => bet.betCombination).join(', ') : 'No Bets'}</span></div>
          <div class="info"><strong>Bet Type:</strong> ${ticket.bets && ticket.bets.length > 0 ? ticket.bets[0].betType.charAt(0).toUpperCase() + ticket.bets[0].betType.slice(1) : 'Standard'}</div>
          <div class="info"><strong>Amount:</strong> <strong>₱${parseFloat(ticket.totalAmount).toFixed(2)}</strong></div>
          <div class="info"><strong>Agent:</strong> ${user.fullName}</div>
          <div class="info"><strong>Date:</strong> ${new Date(ticket.createdAt).toLocaleString()}</div>
          ${ticket.qrCode ? `<img src="${ticket.qrCode}" alt="QR Code" class="qr-code" onerror="this.style.display='none';" />` : ''}
          <div style="text-align: center; margin-top: 10px; font-size: 10px; color: #666;">
            Keep this ticket safe. Present for prize claims.
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const formatDrawTimeForTicket = (drawTime) => {
    return formatDrawTime(drawTime);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      validated: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validated' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      lost: { bg: 'bg-red-100', text: 'text-red-800', label: 'Lost' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filter tickets by search term
  const filteredTickets = tickets.filter(ticket => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
      (ticket.bets && ticket.bets.some(bet => 
        bet.betCombination.toLowerCase().includes(searchTerm) ||
        bet.betType.toLowerCase().includes(searchTerm)
      ))
    );
  });

  return (
    <div className="p-1 sm:p-2 lg:p-4">
      <div className="mb-2 sm:mb-4">
        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
          {user.role === 'agent' ? 'My Tickets' : 'Agent Tickets'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {user.role === 'agent' 
            ? 'View and manage your lottery tickets' 
            : 'View and manage agent lottery tickets'
          }
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-2 sm:mb-4">
        <div className="p-2 sm:p-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ticket number, bet numbers, or bet type..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-6 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 w-full text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Agent/Coordinator Selection for Management Roles */}
            {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user.role) && (
              <>
                {user.role === 'area_coordinator' && coordinators.length > 0 && (
                  <div className="min-w-0">
                    <select
                      value={selectedCoordinatorId}
                      onChange={(e) => {
                        setSelectedCoordinatorId(e.target.value);
                        setSelectedAgentId(''); // Reset agent selection
                        setAgents([]); // Clear agents list
                      }}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Coordinators</option>
                      {coordinators.map(coord => (
                        <option key={coord.id} value={coord.id}>
                          {coord.fullName || coord.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {(user.role === 'superadmin' || user.role === 'admin' || 
                  user.role === 'coordinator') && (
                  <div className="min-w-0">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Agents</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.fullName || agent.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="validated">Validated</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Draw Time</label>
                <select
                  value={filters.drawTime}
                  onChange={(e) => handleFilterChange('drawTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs"
                >
                  <option value="all">All Times</option>
                  <option value="2PM">2:00 PM</option>
                  <option value="5PM">5:00 PM</option>
                  <option value="9PM">9:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            Tickets ({pagination.totalCount})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTickets.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border-b border-gray-200 p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center min-w-0 flex-1">
                      <TicketIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(ticket.status)}
                      {canReprint() && (
                        <button
                          onClick={() => handleReprint(ticket)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Reprint"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Draw:</span>
                      <div className="font-medium">{formatDrawTimeForTicket(ticket.draw?.drawTime)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-medium text-green-600">{formatCurrency(ticket.totalAmount)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Numbers:</span>
                      <div className="font-medium truncate">
                        {ticket.bets && ticket.bets.length > 0 
                          ? ticket.bets.map(bet => bet.betCombination).join(', ')
                          : 'No Bets'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Ticket
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Draw
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Numbers
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Amount
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      {canReprint() ? 'Action' : 'View'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <TicketIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {ticket.ticketNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {formatDrawTimeForTicket(ticket.draw?.drawTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'No Date'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {ticket.bets && ticket.bets.length > 0 
                            ? ticket.bets.map(bet => bet.betCombination).join(', ')
                            : 'No Bets'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.bets && ticket.bets.length > 0 
                            ? ticket.bets[0].betType.charAt(0).toUpperCase() + ticket.bets[0].betType.slice(1)
                            : 'Standard'
                          }
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(ticket.totalAmount)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                        {canReprint() ? (
                          <button
                            onClick={() => handleReprint(ticket)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="Reprint Ticket"
                          >
                            <PrinterIcon className="h-3 w-3 mr-1" />
                            <span className="hidden lg:inline">Reprint</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <TicketIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">No tickets found</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {filters.search ? 'Try adjusting your search or filters.' : 'No tickets match your current filters.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-2 sm:px-4 lg:px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-xs sm:text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentTickets;
