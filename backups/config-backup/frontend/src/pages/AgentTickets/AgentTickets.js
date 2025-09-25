import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import TicketGenerator from '../../utils/ticketGenerator';
import TemplateAssigner from '../../utils/templateAssigner';
import {
  PrinterIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const AgentTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawTimeFilter, setDrawTimeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [hierarchyData, setHierarchyData] = useState({
    agents: [],
    coordinators: [],
    areaCoordinators: []
  });

  const canReprint = () => {
    return user.role === 'agent' || user.role === 'superadmin';
  };

  const fetchHierarchyData = useCallback(async () => {
    if (user.role === 'coordinator') {
      try {
        const response = await api.get(`/users/coordinator/${user.id}/agents`);
        setHierarchyData(prev => ({
          ...prev,
          agents: response.data.data || []
        }));
      } catch (error) {
        console.error('Error fetching agents for coordinator:', error);
      }
    } else if (user.role === 'area_coordinator') {
      try {
        const response = await api.get(`/users/area-coordinator/${user.id}/coordinators`);
        setHierarchyData(prev => ({
          ...prev,
          coordinators: response.data.data || []
        }));
      } catch (error) {
        console.error('Error fetching coordinators for area coordinator:', error);
      }
    }
  }, [user.id, user.role]);

  useEffect(() => {
    fetchHierarchyData();
  }, [fetchHierarchyData]);

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

    const response = await api.get(`/tickets?${params}`);
    const data = response.data.data;
    
    setPagination(prev => ({
      ...prev,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      totalItems: data.totalItems
    }));
    
    return data;
  };

  const { data: ticketsData, isLoading, refetch } = useQuery(
    ['tickets', pagination.currentPage, searchTerm, statusFilter, drawTimeFilter, dateRange.startDate, dateRange.endDate],
    () => fetchTickets({ pageParam: pagination.currentPage }),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  );

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
      // Get assigned template for the ticket's agent
      let template = null;
      try {
        template = await TemplateAssigner.fetchAssignedTemplate(ticket.user?.id || ticket.agentId);
      } catch (error) {
        console.warn('Could not fetch assigned template, using default:', error);
      }

      // Use template-aware ticket generator
      const ticketHtml = TicketGenerator.generateWithTemplate(ticket, ticket.user || user, template);
      
      // Create print window with template-aware HTML scaled to 58mm (≈384px)
      const printWindow = window.open('', '_blank');
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
          const images = Array.from(printWindow.document.images || []);
          if (images.length === 0) {
            printWindow.print();
            return;
          }
          let loadedCount = 0;
          const onImgDone = () => {
            loadedCount += 1;
            if (loadedCount >= images.length) {
              printWindow.print();
            }
          };
          images.forEach((img) => {
            if (img.complete) {
              onImgDone();
            } else {
              img.addEventListener('load', onImgDone, { once: true });
              img.addEventListener('error', onImgDone, { once: true });
            }
          });
          setTimeout(() => {
            try { printWindow.print(); } catch (_) { /* noop */ }
          }, 1500);
        } catch (_) {
          try { printWindow.print(); } catch (__) { /* noop */ }
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      won: { bg: 'bg-green-100', text: 'text-green-800', label: 'Won' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      lost: { bg: 'bg-red-100', text: 'text-red-800', label: 'Lost' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filter tickets by search term
  const filteredTickets = ticketsData?.tickets?.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Tickets</h1>
        <p className="text-gray-600">View and manage lottery tickets</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={drawTimeFilter}
            onChange={(e) => setDrawTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Draw Times</option>
            <option value="twoPM">2:00 PM</option>
            <option value="fivePM">5:00 PM</option>
            <option value="ninePM">9:00 PM</option>
          </select>
          
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Draw
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticket.ticketNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.agent?.fullName || ticket.agent?.username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : ''} {formatDrawTimeForTicket(ticket.draw?.drawTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.bets?.length || 0} bet(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(ticket.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReprint(ticket)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Reprint Ticket"
                      >
                        <PrinterIcon className="h-4 w-4" />
                      </button>
                    </div>
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
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalItems}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
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