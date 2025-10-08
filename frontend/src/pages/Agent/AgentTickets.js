import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
// Template generation moved to backend - no longer needed
import {
  PrinterIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TicketIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const AgentTickets = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawTimeFilter, setDrawTimeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '', // Empty means no date filter
    endDate: ''   // Empty means no date filter
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  // Removed hierarchyData as it's not currently used in this component

  const canReprint = () => {
    return user.role === 'agent' || user.role === 'superadmin';
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  // Removed fetchHierarchyData and related useEffect as hierarchy data is not currently used

  const fetchTickets = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam,
      limit: pagination.itemsPerPage,
      search: searchTerm,
      status: statusFilter,
      drawTime: drawTimeFilter,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    console.log('Fetching tickets with params:', {
      url: `/tickets?${params}`,
      user: user,
      params: Object.fromEntries(params)
    });

    const response = await api.get(`/tickets?${params}`);
    const data = response.data.data;
    
    console.log('Tickets API response:', {
      success: response.data.success,
      dataStructure: data,
      itemsCount: data.items?.length,
      pagination: data.pagination,
      sampleTicket: data.items?.[0] // Log first ticket to see structure
    });
    
    setPagination(prev => ({
      ...prev,
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems
    }));
    
    return {
      tickets: data.items,
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems
    };
  };

  const { data: ticketsData, isLoading, refetch } = useQuery({
    queryKey: ['tickets', pagination.currentPage, searchTerm, statusFilter, drawTimeFilter, dateRange.startDate, dateRange.endDate],
    queryFn: () => fetchTickets({ pageParam: pagination.currentPage }),
    placeholderData: (previousData) => previousData, // keepPreviousData renamed in v5
    staleTime: 30000
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleReprint = async (ticket) => {
    try {
      if (canReprint()) {
        await generateAndPrintTicket(ticket);
        // Refresh tickets to update reprint count
        refetch();
      }
    } catch (error) {
      console.error('Error reprinting ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to reprint ticket');
    }
  };

  const generateAndPrintTicket = async (ticket) => {
    try {
      console.log('Starting reprint for ticket:', ticket.id);
      
      // Fetch pre-generated HTML from backend (Umatik template)
      let ticketHtml = '';
      try {
        const response = await api.get(`/ticket-templates/generate`, {
          params: {
            ticketId: ticket.id || ticket.ticketNumber,
            templateId: 'umatik-center'
          }
        });
        ticketHtml = response.data?.data?.html || '';
        console.log('Backend HTML fetched, length:', ticketHtml.length);
      } catch (error) {
        console.error('Failed to fetch backend HTML:', error);
        toast.error('Failed to load ticket template from server');
        return;
      }

      if (!ticketHtml) {
        toast.error('No ticket HTML available');
        return;
      }
      
      // Create print window with backend-generated HTML (58mm width = 220px)
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!printWindow) {
        toast.error('Pop-up blocked! Please allow pop-ups for this site to enable printing.');
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Ticket ${ticket.ticketNumber}</title>
<style>
  @page { size: auto; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 6px 0; background: #fff; }
  .print-wrap { width: 220px; margin: 0 auto; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="print-wrap">
    ${ticketHtml}
  </div>
</body>
</html>`);
      printWindow.document.close();
      
      // Wait for images to load before printing
      const triggerPrintWhenReady = () => {
        try {
          console.log('Preparing to print ticket...');
          const images = Array.from(printWindow.document.images || []);
          console.log('Found images:', images.length);
          
          if (images.length === 0) {
            console.log('No images found, printing immediately');
            printWindow.print();
            return;
          }
          
          let loadedCount = 0;
          const onImgDone = () => {
            loadedCount += 1;
            console.log(`Image loaded: ${loadedCount}/${images.length}`);
            if (loadedCount >= images.length) {
              console.log('All images loaded, printing now');
              printWindow.print();
            }
          };
          
          images.forEach((img, index) => {
            console.log(`Checking image ${index + 1}:`, img.src);
            if (img.complete) {
              onImgDone();
            } else {
              img.addEventListener('load', onImgDone, { once: true });
              img.addEventListener('error', (e) => {
                console.warn(`Image ${index + 1} failed to load:`, e);
                onImgDone(); // Continue even if image fails
              }, { once: true });
            }
          });
          
          // Fallback timeout
          setTimeout(() => {
            console.log('Fallback timeout reached, printing anyway');
            try { printWindow.print(); } catch (e) { console.error('Print failed:', e); }
          }, 2000);
        } catch (error) {
          console.error('Error in print preparation:', error);
          try { printWindow.print(); } catch (e) { console.error('Fallback print failed:', e); }
        }
      };
      
      if (printWindow.document.readyState === 'complete') {
        triggerPrintWhenReady();
      } else {
        printWindow.addEventListener('load', triggerPrintWhenReady, { once: true });
      }
      
      toast.success('Ticket printed successfully!');
    } catch (error) {
      console.error('Error printing ticket:', error);
      toast.error('Failed to print ticket');
    }
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
      pending: { color: 'bg-warning-100 text-warning-700', label: 'Pending' },
      won: { color: 'bg-success-100 text-success-700', label: 'Won' },
      cancelled: { color: 'bg-danger-100 text-danger-700', label: 'Cancelled' },
      lost: { color: 'bg-danger-100 text-danger-700', label: 'Lost' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Compute effective ticket status: if draw is closed/settled and ticket is still pending, mark as won/lost based on winnings
  const deriveTicketStatus = (ticket) => {
    // Prefer backend-provided derived status if present
    if (ticket.derivedStatus) return ticket.derivedStatus;

    const baseStatus = ticket.status || 'pending';
    const drawStatus = ticket.draw?.status;
    const winningNumber = ticket.draw?.winningNumber;
    const hasWinnings = (Array.isArray(ticket.winningTickets) && ticket.winningTickets.length > 0)
      || (typeof ticket.winAmount === 'number' && ticket.winAmount > 0)
      || (typeof ticket.winningPrize === 'number' && ticket.winningPrize > 0);

    // If explicitly resolved, trust backend
    if (baseStatus === 'cancelled' || baseStatus === 'won' || baseStatus === 'lost') {
      return baseStatus;
    }

    // Consider draw finished if status closed/settled OR there is a winningNumber
    const drawFinished = (drawStatus === 'closed' || drawStatus === 'settled') || Boolean(winningNumber);
    if (drawFinished && baseStatus === 'pending') {
      return hasWinnings ? 'won' : 'lost';
    }

    return baseStatus;
  };

  // Filter tickets by search term
  const filteredTickets = ticketsData?.tickets?.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const effectiveStatus = deriveTicketStatus(ticket);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="w-full px-2 py-2">
        <div className="mb-2">
          <h1 className="text-lg font-bold text-blue-900 text-center">Tickets</h1>
          <p className="text-xs text-blue-600 text-center">View and reprint tickets</p>
            </div>
            
        {/* Ultra-Compact Search */}
        <div className="bg-white rounded p-2 mb-2 border border-blue-200">
                <input
                  type="text"
            placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          
          <div className="grid grid-cols-2 gap-1 mt-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              
                <select
                  value={drawTimeFilter}
                  onChange={(e) => setDrawTimeFilter(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
            >
              <option value="all">All Times</option>
              <option value="twoPM">2PM</option>
              <option value="fivePM">5PM</option>
              <option value="ninePM">9PM</option>
                </select>
              </div>
              
          <button
                  onClick={() => refetch()}
            className="w-full mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
            Refresh
          </button>
              </div>

        {/* Ultra-Compact Tickets List */}
        <div className="bg-white rounded overflow-hidden">
          <div className="px-2 py-1 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 text-center">
              Tickets ({filteredTickets.length})
            </h2>
          </div>
          
          {/* Ultra-Compact Mobile Layout */}
          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-2 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">T</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-blue-600">
                        {ticket.ticketNumber}
            </div>
                      <div className="text-xs text-gray-500">
                        {formatDrawTimeForTicket(ticket.draw?.drawTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      ₱{ticket.totalAmount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStatusBadge(deriveTicketStatus(ticket))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {ticket.bets?.length || 0} bet{(ticket.bets?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  <div className="flex space-x-1">
                    {canReprint() && (
                      <button
                        onClick={() => handleReprint(ticket)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                      >
                        Print
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(ticket)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draw</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">T</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-600">{ticket.ticketNumber}</div>
                          <div className="text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.user?.fullName || ticket.user?.username || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium">
                          {ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-gray-500">
                          {formatDrawTimeForTicket(ticket.draw?.drawTime)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {ticket.bets?.length || 0} bet{(ticket.bets?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-green-600">₱{ticket.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deriveTicketStatus(ticket))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {canReprint() && (
                          <button
                            onClick={() => handleReprint(ticket)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Reprint
                          </button>
                      )}
                      {!canReprint() && (
                          <button
                            onClick={() => handleViewDetails(ticket)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                      )}
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simplified Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg p-4 mt-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700 font-medium text-center sm:text-left">
                  <span className="block sm:inline">
                  Showing <span className="font-semibold text-blue-600">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                  </span> to <span className="font-semibold text-blue-600">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>
                  </span>
                  <span className="text-gray-500 block sm:inline sm:ml-1">
                    of {pagination.totalItems} tickets
                  </span>
                </div>
                
                <div className="flex justify-center sm:justify-end space-x-2">
                <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  Previous
                </button>
                  
                  {/* Page Numbers - Show only on larger screens */}
                  <div className="hidden md:flex space-x-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        page = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                      <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                        >
                          {page}
                      </button>
                      );
                    })}
                  </div>
                  
                <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Ticket Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ticket Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agent</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTicket.user?.fullName || selectedTicket.user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">₱{selectedTicket.totalAmount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Draw Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTicket.drawTime ? formatDrawTime(selectedTicket.drawTime) : 
                     selectedTicket.draw?.drawTime ? formatDrawTime(selectedTicket.draw.drawTime) :
                     selectedTicket.draw?.drawDate ? new Date(selectedTicket.draw.drawDate).toLocaleString() :
                     'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTicket.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Bets Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bet Details</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedTicket.bets && selectedTicket.bets.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTicket.bets.map((bet, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div>
                            <span className="font-mono text-lg font-semibold">{bet.betCombination}</span>
                            <span className="ml-2 text-sm text-gray-600">({bet.betType})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">₱{bet.betAmount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No bet details available</p>
                  )}
                </div>
              </div>

              {/* Draw Information */}
              {selectedTicket.draw && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Draw Information</label>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Draw Date:</span>
                        <p className="font-semibold">{new Date(selectedTicket.draw.drawDate).toLocaleDateString()}</p>
                      </div>
                      {selectedTicket.draw.winningNumber && (
                        <div>
                          <span className="text-sm text-gray-600">Winning Number:</span>
                          <p className="font-mono text-lg font-bold text-blue-600">{selectedTicket.draw.winningNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <ModernButton
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTickets;