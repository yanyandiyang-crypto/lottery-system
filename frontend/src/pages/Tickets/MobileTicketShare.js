import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import MobileTicketTemplate from '../../components/Tickets/MobileTicketTemplate';
import MobileTicketUtils from '../../utils/mobileTicketUtils';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const MobileTicketShare = () => {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch ticket data
  const { data: ticketData, isLoading, error } = useQuery(
    ['ticket', ticketNumber],
    async () => {
      const response = await api.get(`/tickets/number/${ticketNumber}`);
      return response.data;
    },
    {
      enabled: !!ticketNumber,
      retry: 2
    }
  );

  // Get current user info
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    setUser(currentUser);
  }, []);

  const handleShare = async () => {
    if (!ticketData?.data) return;
    
    try {
      const result = await MobileTicketUtils.shareTicket(ticketData.data, user);
      if (result.success) {
        if (result.method === 'web-share') {
          toast.success('Ticket shared successfully!');
        } else {
          toast.success('Ticket link copied to clipboard!');
        }
      } else {
        toast.error('Failed to share ticket');
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
      toast.error('Failed to share ticket');
    }
  };

  const handlePrint = () => {
    if (!ticketData?.data) return;
    MobileTicketUtils.printMobileTicket(ticketData.data, user);
    toast.success('Ticket sent to printer');
  };

  const handleDownload = async () => {
    if (!ticketData?.data) return;
    
    try {
      await MobileTicketUtils.downloadTicketImage(ticketData.data, user);
      toast.success('Ticket downloaded as image!');
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const ticket = ticketData.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lottery Ticket</h1>
          <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
        </div>

        {/* Mobile Ticket */}
        <MobileTicketTemplate
          ticket={ticket}
          user={user}
          onShare={handleShare}
          onPrint={handlePrint}
        />

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleShare}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center justify-center space-x-2"
          >
            <span>📱</span>
            <span>Share Ticket</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center justify-center space-x-2"
          >
            <span>🖨️</span>
            <span>Print Ticket</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium flex items-center justify-center space-x-2"
          >
            <span>📥</span>
            <span>Download Image</span>
          </button>
        </div>

        {/* Ticket Info */}
        <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Ticket Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Number:</span>
              <span className="font-medium">{ticket.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draw Time:</span>
              <span className="font-medium">{ticket.draw?.drawTime || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Draw Date:</span>
              <span className="font-medium">
                {ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">₱{parseFloat(ticket.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                ticket.status === 'won' ? 'text-green-600' : 
                ticket.status === 'pending' ? 'text-yellow-600' : 
                'text-gray-600'
              }`}>
                {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileTicketShare;
