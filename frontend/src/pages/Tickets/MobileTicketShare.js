import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MobileTicketTemplate from '../../components/Tickets/MobileTicketTemplate';
import MobileTicketUtils from '../../utils/mobileTicketUtils';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  ShareIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  HomeIcon,
  TicketIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const MobileTicketShare = () => {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch ticket data
  const { data: ticketData, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketNumber],
    queryFn: async () => {
      const response = await api.get(`/tickets/number/${ticketNumber}`);
      return response.data;
    },
    enabled: !!ticketNumber,
    retry: 2
  });

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
    return <LoadingSpinner message="Loading ticket..." />;
  }

  if (error || !ticketData?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-12">
          <ModernCard className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <TicketIcon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
            <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist or has been removed.</p>
            <ModernButton
              onClick={() => navigate('/')}
              variant="primary"
              size="lg"
              className="w-full"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Go Home
            </ModernButton>
          </ModernCard>
        </div>
      </div>
    );
  }

  const ticket = ticketData.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader
          title="Lottery Ticket"
          subtitle={`Ticket #${ticket.ticketNumber}`}
          icon={TicketIcon}
          className="mb-8"
        />

        {/* Mobile Ticket */}
        <div className="mb-8">
          <MobileTicketTemplate
            ticket={ticket}
            user={user}
            onShare={handleShare}
            onPrint={handlePrint}
          />
        </div>

        {/* Action Buttons */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600 mt-1">Share, print, or download your ticket</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ModernButton
                onClick={handleShare}
                variant="primary"
                size="md"
                className="w-full"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </ModernButton>
              
              <ModernButton
                onClick={handlePrint}
                variant="success"
                size="md"
                className="w-full"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print
              </ModernButton>
              
              <ModernButton
                onClick={handleDownload}
                variant="secondary"
                size="md"
                className="w-full"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Ticket Info */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <TicketIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ticket Information</h3>
                <p className="text-sm text-gray-600 mt-1">Complete ticket details</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <TicketIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Ticket Number</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ticket.ticketNumber}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Draw Time</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{ticket.draw?.drawTime || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Draw Date</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Total Amount</span>
                </div>
                <span className="text-sm font-semibold text-green-600">₱{parseFloat(ticket.totalAmount).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Status</span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  ticket.status === 'won' ? 'bg-green-100 text-green-800' : 
                  ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Back Button */}
        <div className="text-center">
          <ModernButton
            onClick={() => navigate('/')}
            variant="ghost"
            size="md"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Back to Home
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default MobileTicketShare;
