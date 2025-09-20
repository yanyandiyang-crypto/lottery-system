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
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Reprint</h1>
            <p className="text-gray-600">Reprint tickets (maximum 2 reprints per ticket)</p>
          </div>
          <div className="text-sm text-gray-500">
            {user.role === 'agent' ? 'Your tickets only' : 'All tickets'}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Search Ticket</h2>
        
        <form onSubmit={handleSearchTicket} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ticket number (e.g., T240915001)"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Ticket Details */}
      {ticket && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Ticket Details</h2>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
              {ticket.status.toUpperCase()}
            </span>
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
        </div>
      )}

      {/* Recent Reprint History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Reprints</h2>
        </div>
        
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
                  Reprinted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reprint Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reprintHistory.map((reprint) => (
                <tr key={reprint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">
                      {reprint.ticket?.ticketNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reprint.ticket?.agent?.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reprint.reprintedBy?.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reprint.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {reprint.reprintNumber}/2
                    </span>
                  </td>
                </tr>
              ))}
              {reprintHistory.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent reprints found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Reprint Guidelines
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Each ticket can only be reprinted a maximum of 2 times</li>
                <li>Agents can only reprint their own tickets</li>
                <li>Tickets that have already been settled or won cannot be reprinted</li>
                <li>All reprints are logged and tracked for audit purposes</li>
                <li>Original ticket remains valid - reprints are exact duplicates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketReprint;
