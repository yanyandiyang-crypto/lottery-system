import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  TicketIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = filter === 'all' ? '/tickets' : `/tickets?status=${filter}`;
      console.log('🔍 [Tickets] Fetching from:', endpoint);
      
      const response = await api.get(endpoint);
      console.log('📡 [Tickets] API Response:', response.data);
      
      // Ensure we get an array from the response
      const ticketsData = response.data?.data || response.data || [];
      console.log('📋 [Tickets] Tickets data:', ticketsData);
      
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tickets';
      setError(errorMessage);
      console.error('❌ [Tickets] Error fetching tickets:', err);
      console.error('❌ [Tickets] Error response:', err.response?.data);
      setTickets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      fetchTickets(); // Refresh the list
    } catch (err) {
      setError('Failed to update ticket status');
      console.error('Error updating ticket status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'won': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'all': return <DocumentTextIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
      case 'won': return <TicketIcon className="h-4 w-4" />;
      case 'lost': return <XCircleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tickets..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Tickets"
          subtitle="View and manage all tickets"
          icon={TicketIcon}
        />

        {error && (
          <ModernCard className="mb-8 border-l-4 border-red-500 bg-red-50">
            <div className="p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Filter Tabs */}
        <ModernCard className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-col sm:flex-row px-6">
              {['all', 'pending', 'confirmed', 'cancelled', 'won', 'lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center justify-center sm:justify-start mb-2 sm:mb-0 mr-0 sm:mr-8 ${
                    filter === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </button>
              ))}
            </nav>
          </div>
        </ModernCard>

        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <TicketIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {filter === 'all' ? 'All Tickets' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tickets`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Manage and track ticket status</p>
              </div>
            </div>
          </div>
          
          <ModernTable
            columns={[
              {
                key: 'id',
                label: 'Ticket ID',
                render: (ticket) => (
                  <div className="text-sm font-medium text-gray-900">
                    #{ticket.id}
                  </div>
                )
              },
              {
                key: 'agent',
                label: 'Agent',
                render: (ticket) => (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <div className="text-sm text-gray-900">
                      {ticket.agent?.username || 'N/A'}
                    </div>
                  </div>
                )
              },
              {
                key: 'numbers',
                label: 'Numbers',
                render: (ticket) => (
                  <div className="flex flex-wrap gap-1">
                    {ticket.numbers?.map((number, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                )
              },
              {
                key: 'amount',
                label: 'Amount',
                render: (ticket) => (
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-sm font-semibold text-green-600">
                      ₱{ticket.amount?.toLocaleString()}
                    </span>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (ticket) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                )
              },
              {
                key: 'createdAt',
                label: 'Created',
                render: (ticket) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (ticket) => (
                  ticket.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <ModernButton
                        onClick={() => handleStatusChange(ticket.id, 'confirmed')}
                        variant="success"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirm
                      </ModernButton>
                      <ModernButton
                        onClick={() => handleStatusChange(ticket.id, 'cancelled')}
                        variant="danger"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </ModernButton>
                    </div>
                  )
                )
              }
            ]}
            data={tickets}
            emptyMessage={
              <div className="text-center py-12">
                <TicketIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'There are no tickets in the system yet.' 
                    : `There are no ${filter} tickets.`}
                </p>
              </div>
            }
          />
        </ModernCard>
      </div>
    </div>
  );
};

export default Tickets;

