import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import TicketGenerator from '../../utils/ticketGenerator';
import TemplateAssigner from '../../utils/templateAssigner';
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
      
      // Check if running in Android POS app
      const isAndroidPOS = typeof window.AndroidPOS !== 'undefined';
      
      if (isAndroidPOS) {
        // Use image-based printing for Android POS
        console.log('📱 Android POS detected - using image printing');
        const MobileTicketUtils = (await import('../../utils/mobileTicketUtils')).default;
        
        try {
          const result = await MobileTicketUtils.printMobileTicket(ticket, ticket.user || user);
          console.log('✅ Print result:', result);
          
          if (result.success) {
            toast.success('🖨️ Ticket reprinted successfully!');
          } else {
            toast.error('❌ Print failed: ' + (result.error || 'Unknown error'));
          }
          return;
        } catch (error) {
          console.error('❌ Android printing failed:', error);
          toast.error('Print failed: ' + error.message);
          return;
        }
      }
      
      // Web browser: Use traditional print window
      console.log('🌐 Web browser detected - using browser print');
      
      // Get system-wide active template
      let template = null;
      try {
        template = await TemplateAssigner.fetchSystemTemplate();
        console.log('Template fetched:', template?.name || 'default');
      } catch (error) {
        console.warn('Could not fetch system template, using default:', error);
      }

      // Use template-aware ticket generator
      const ticketHtml = TicketGenerator.generateWithTemplate(ticket, ticket.user || user, template);
      console.log('Ticket HTML generated, length:', ticketHtml.length);
      
      // Create print window with template-aware HTML scaled to 58mm (≈384px)
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
  /* Outer width targets 58mm printers (~384px at 203dpi) */
  .print-wrap { width: 384px; margin: 0 auto; }
  /* Scale 600px templates down to 384px (0.64) while keeping layout */
  .scale-600 { width: 600px; transform: scale(0.64); transform-origin: top left; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="print-wrap">
    <div class="scale-600">${ticketHtml}</div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Agent Tickets"
          subtitle="View, manage, and reprint lottery tickets for your agents"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Agent', href: '/agent' },
            { label: 'Tickets' }
          ]}
        />

        {/* Search and Filter Controls */}
        <ModernCard variant="glass" className="mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ticket number, agent name, or username..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
                    />
                  </div>
                  <span className="text-gray-500 text-sm flex-shrink-0">to</span>
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw Time</label>
                <select
                  value={drawTimeFilter}
                  onChange={(e) => setDrawTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="all">All Draw Times</option>
                  <option value="twoPM">2:00 PM</option>
                  <option value="fivePM">5:00 PM</option>
                  <option value="ninePM">9:00 PM</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <ModernButton
                  variant="primary"
                  onClick={() => refetch()}
                  icon={ArrowPathIcon}
                  className="w-full"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Tickets Table */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TicketIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Lottery Tickets
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            
            <ModernTable
              columns={[
                { 
                  key: 'ticketNumber', 
                  label: 'Ticket Number', 
                  sortable: true,
                  render: (value) => (
                    <span className="font-semibold text-primary-600">{value}</span>
                  )
                },
                { 
                  key: 'user', 
                  label: 'Agent', 
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-primary-600" />
                      </div>
                      <span>{value?.fullName || value?.username || 'Unknown'}</span>
                    </div>
                  )
                },
                { 
                  key: 'draw', 
                  label: 'Draw', 
                  sortable: true,
                  render: (value) => (
                    <div className="text-sm">
                      <div className="font-medium">
                        {value?.drawDate ? new Date(value.drawDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-gray-500">
                        {formatDrawTimeForTicket(value?.drawTime)}
                      </div>
                    </div>
                  )
                },
                { 
                  key: 'bets', 
                  label: 'Bets', 
                  render: (value) => (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {value?.length || 0} bet{(value?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  )
                },
                { 
                  key: 'totalAmount', 
                  label: 'Total Amount', 
                  sortable: true,
                  render: (value) => (
                    <span className="font-semibold text-success-600">{formatCurrency(value)}</span>
                  )
                },
                { 
                  key: 'status', 
                  label: 'Status', 
                  render: (value, row) => getStatusBadge(deriveTicketStatus(row))
                },
                { 
                  key: 'createdAt', 
                  label: 'Created', 
                  sortable: true,
                  render: (value) => new Date(value).toLocaleDateString()
                },
                { 
                  key: 'actions', 
                  label: 'Actions',
                  render: (value, row) => (
                    <div className="flex space-x-2">
                      {canReprint() && (
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprint(row)}
                          icon={PrinterIcon}
                          title="Reprint Ticket"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <span className="sr-only">Reprint</span>
                        </ModernButton>
                      )}
                      {!canReprint() && (
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(row)}
                          icon={EyeIcon}
                          title="View Ticket Details"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <span className="sr-only">View Details</span>
                        </ModernButton>
                      )}
                    </div>
                  )
                }
              ]}
              data={filteredTickets}
              emptyMessage="No tickets found matching your search criteria"
            />
          </div>
        </ModernCard>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <ModernCard variant="glass" className="mt-6">
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700 font-medium text-center sm:text-left">
                  <span className="block sm:inline">
                    Showing <span className="font-semibold text-primary-600">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                    </span> to <span className="font-semibold text-primary-600">
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                    </span>
                  </span>
                  <span className="text-gray-500 block sm:inline sm:ml-1">
                    of {pagination.totalItems} tickets
                  </span>
                </div>
                
                <div className="flex justify-center sm:justify-end space-x-2">
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    icon={ChevronLeftIcon}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </ModernButton>
                  
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
                        <ModernButton
                          key={page}
                          variant={page === pagination.currentPage ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </ModernButton>
                      );
                    })}
                  </div>
                  
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    icon={ChevronRightIcon}
                    className="flex-1 sm:flex-none"
                  >
                    Next
                  </ModernButton>
                </div>
              </div>
            </div>
          </ModernCard>
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
                <XMarkIcon className="h-6 w-6" />
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