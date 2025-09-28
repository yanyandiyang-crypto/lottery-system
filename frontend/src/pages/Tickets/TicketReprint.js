import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { ticketsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  PrinterIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  TicketIcon,
  CalendarDaysIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const TicketReprint = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reprinting, setReprinting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticket, setTicket] = useState(null);
  const [reprintHistory, setReprintHistory] = useState([]);

  useEffect(() => {
    fetchReprintHistory();
  }, []);

  const fetchReprintHistory = async () => {
    try {
      const response = await ticketsAPI.getReprintHistory({
        agentId: user.role === 'agent' ? user.id : undefined,
        limit: 10
      });
      setReprintHistory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reprint history:', error);
    }
  };

  const handleSearchTicket = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a ticket number');
      return;
    }

    setSearching(true);
    try {
      const response = await ticketsAPI.getTicketForReprint(searchQuery.trim());
      setTicket(response.data.data);
      
      if (!response.data.data) {
        toast.error('Ticket not found');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to find ticket');
      setTicket(null);
    } finally {
      setSearching(false);
    }
  };

  const handleReprintTicket = async () => {
    if (!ticket) return;

    setReprinting(true);
    try {
      const response = await ticketsAPI.reprintTicket(ticket.id);
      
      toast.success('Ticket reprinted successfully');
      
      // Update ticket data with new reprint count
      setTicket(prev => ({
        ...prev,
        reprintCount: prev.reprintCount + 1
      }));
      
      // Refresh reprint history
      fetchReprintHistory();
      
      // Trigger print (this would typically open a print dialog or send to POS printer)
      if (response.data.printData) {
        // Handle print data - could be base64 image, PDF, or printer commands
        console.log('Print data:', response.data.printData);
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reprint ticket');
    } finally {
      setReprinting(false);
    }
  };

  const canReprint = (ticket) => {
    if (!ticket) return false;
    
    // Check if user has permission to reprint this ticket
    const hasPermission = user.role === 'agent' ? ticket.agentId === user.id : true;
    
    // Check if reprint limit is reached (max 2 reprints)
    const withinLimit = ticket.reprintCount < 2;
    
    // Check if ticket is not already settled/won
    const notSettled = ticket.status !== 'won' && ticket.status !== 'settled';
    
    return hasPermission && withinLimit && notSettled;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'won': 'bg-blue-100 text-blue-800',
      'lost': 'bg-red-100 text-red-800',
      'settled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Ticket Reprint"
          subtitle="Reprint tickets (maximum 2 reprints per ticket)"
          icon={PrinterIcon}
        >
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {user.role === 'agent' ? 'Your tickets only' : 'All tickets'}
          </div>
        </PageHeader>

        {/* Search Section */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Search Ticket</h2>
                <p className="text-sm text-gray-600 mt-1">Enter ticket number to find and reprint</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSearchTicket} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter ticket number (e.g., T240915001)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <ModernButton
                type="submit"
                disabled={searching}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </ModernButton>
            </form>
          </div>
        </ModernCard>

        {/* Ticket Details */}
        {ticket && (
          <ModernCard className="mb-8">
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TicketIcon className="h-6 w-6 mr-3 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
                    <p className="text-sm text-gray-600 mt-1">Complete ticket information</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status.toUpperCase()}
                </span>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ticket Number</label>
                <div className="mt-1 text-lg font-mono font-bold text-gray-900">
                  {ticket.ticketNumber}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Draw Information</label>
                <div className="mt-1 text-sm text-gray-900">
                  {formatDrawTime(ticket.draw?.drawTime)} - {new Date(ticket.draw?.drawDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agent</label>
                <div className="mt-1 text-sm text-gray-900">
                  {ticket.agent?.fullName} ({ticket.agent?.username})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                <div className="mt-1 text-lg font-bold text-green-600">
                  {formatCurrency(ticket.totalAmount)}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bet Combinations</label>
                <div className="mt-1 space-y-2">
                  {ticket.bets?.map((bet, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="font-mono font-bold">{bet.betCombination}</span>
                      <span className="text-sm text-gray-600">
                        {bet.betType} - {formatCurrency(bet.betAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reprint Count</label>
                <div className="mt-1 flex items-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">
                    {ticket.reprintCount} / 2 reprints used
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(ticket.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Reprint Action */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {canReprint(ticket) ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">This ticket can be reprinted</span>
                </div>
                <button
                  onClick={handleReprintTicket}
                  disabled={reprinting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  {reprinting ? 'Reprinting...' : 'Reprint Ticket'}
                </button>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  {ticket.reprintCount >= 2 ? 'Maximum reprints reached (2/2)' :
                   ticket.status === 'won' || ticket.status === 'settled' ? 'Cannot reprint settled tickets' :
                   user.role === 'agent' && ticket.agentId !== user.id ? 'You can only reprint your own tickets' :
                   'This ticket cannot be reprinted'}
                </span>
              </div>
            )}
          </div>
          </ModernCard>
        )}

        {/* Recent Reprint History */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Reprints</h2>
                <p className="text-sm text-gray-600 mt-1">History of recently reprinted tickets</p>
              </div>
            </div>
          </div>
          
          <ModernTable
            columns={[
              {
                key: 'ticketNumber',
                label: 'Ticket Number',
                render: (reprint) => (
                  <div className="text-sm font-mono font-medium text-gray-900">
                    {reprint.ticket?.ticketNumber}
                  </div>
                )
              },
              {
                key: 'agent',
                label: 'Agent',
                render: (reprint) => (
                  <div className="text-sm text-gray-900">
                    {reprint.ticket?.agent?.fullName}
                  </div>
                )
              },
              {
                key: 'reprintedBy',
                label: 'Reprinted By',
                render: (reprint) => (
                  <div className="text-sm text-gray-900">
                    {reprint.reprintedBy?.fullName}
                  </div>
                )
              },
              {
                key: 'reprintDate',
                label: 'Reprint Date',
                render: (reprint) => (
                  <div className="text-sm text-gray-500">
                    {new Date(reprint.createdAt).toLocaleString()}
                  </div>
                )
              },
              {
                key: 'count',
                label: 'Count',
                render: (reprint) => (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {reprint.reprintNumber}/2
                  </span>
                )
              }
            ]}
            data={reprintHistory}
            emptyMessage="No recent reprints found"
          />
        </ModernCard>

        {/* Information Panel */}
        <ModernCard>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-b border-yellow-200">
            <div className="flex items-center">
              <InformationCircleIcon className="h-6 w-6 mr-3 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Reprint Guidelines</h3>
                <p className="text-sm text-yellow-600 mt-1">Important rules and limitations</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="text-sm text-gray-700">
                    Each ticket can only be reprinted a maximum of <strong>2 times</strong>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="text-sm text-gray-700">
                    Agents can only reprint their <strong>own tickets</strong>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="text-sm text-gray-700">
                    Tickets that have already been <strong>settled or won</strong> cannot be reprinted
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="text-sm text-gray-700">
                    All reprints are <strong>logged and tracked</strong> for audit purposes
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div className="text-sm text-gray-700">
                    Original ticket remains valid - reprints are <strong>exact duplicates</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default TicketReprint;
