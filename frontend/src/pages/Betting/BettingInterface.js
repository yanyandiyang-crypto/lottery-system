import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime, getDrawTimeLabel } from '../../utils/drawTimeFormatter';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TicketIcon,
  BackspaceIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode.react';
import MobileTicketTemplate from '../../components/Tickets/MobileTicketTemplate';
import MobileTicketUtils from '../../utils/mobileTicketUtils';
import EnhancedMobileTicketUtils from '../../utils/enhancedMobileTicketUtils';
import MobilePOSUtils from '../../utils/mobilePOSUtils';

// Custom Template Preview Component
const CustomTemplatePreview = ({ ticket, user, onShare, onPrint }) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user's assigned template
        const response = await api.get(`/ticket-templates/user-assignment/${user.id}`);
        const template = response.data.data?.template;
        
        if (!template) {
          throw new Error('No template assigned to user');
        }

        // Generate template HTML
        const htmlResponse = await api.post('/ticket-templates/generate', {
          ticketId: ticket.id,
          templateId: template.id
        });
        
        setTemplateHtml(htmlResponse.data.data.html);
      } catch (err) {
        console.error('Error generating template preview:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generatePreview();
  }, [ticket, user]);

  if (loading) {
    return (
      <div className="ticket-preview">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Custom Template Preview</p>
          <p className="text-xs text-gray-500">Template ID: {ticket.templateId}</p>
        </div>
        <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading template...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-preview">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Custom Template Preview</p>
          <p className="text-xs text-gray-500">Template ID: {ticket.templateId}</p>
        </div>
        <div className="border-2 border-dashed border-red-300 p-4 rounded-lg bg-red-50">
          <p className="text-center text-red-500">Error loading template: {error}</p>
          <p className="text-xs text-center text-red-400 mt-2">
            Ticket #{ticket.ticketNumber} | Total: ₱{parseFloat(ticket.totalAmount).toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-preview">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">Custom Template Preview</p>
        <p className="text-xs text-gray-500">Template ID: {ticket.templateId}</p>
      </div>
      
      {/* Template Preview Container */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <div 
          className="template-preview-container"
          style={{
            maxHeight: '600px',
            overflow: 'auto',
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%' // Compensate for scale
          }}
          dangerouslySetInnerHTML={{ __html: templateHtml }}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={onShare}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          📱 Share Ticket
        </button>
        <button
          onClick={onPrint}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
        >
          🖨️ Print Ticket
        </button>
      </div>
    </div>
  );
};

const BettingInterface = () => {
  const { user } = useAuth();
  const { emit } = useSocket();
  const queryClient = useQueryClient();

  // Helper function to format draw time (using utility function)
  const formatDrawTimeForTicket = (drawTime) => {
    return formatDrawTime(drawTime);
  };
  
  // Get URL parameters for draw selection
  const urlParams = new URLSearchParams(window.location.search);
  const drawParam = urlParams.get('draw');
  const timeParam = urlParams.get('time');
  
  console.log('🔗 URL Parameters:', { drawParam, timeParam });
  
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [betDigits, setBetDigits] = useState(['?', '?', '?']);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [betType, setBetType] = useState('standard');
  const [betAmount, setBetAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileTicket, setShowMobileTicket] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [addedBets, setAddedBets] = useState([]);
  const [showViewBets, setShowViewBets] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Fetch active draws
  const { data: draws, isLoading: drawsLoading } = useQuery(
    'activeDraws',
    async () => {
      const response = await api.get('/draws/current/active');
      // The API returns { success: true, data: [...] }, so we need response.data.data
      return response.data.data || [];
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      onError: (error) => {
        console.error('Error fetching draws:', error);
        toast.error('Failed to load draw information');
      }
    }
  );

  // Fetch user balance
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading } = useQuery(
    ['balance', user?.id],
    async () => {
      if (!user?.id) return null;
      const response = await api.get(`/balance/${user.id}`);
      // The API returns { success: true, data: balance, currentBalance: balance.currentBalance }
      return response.data.data || response.data;
    },
    {
      enabled: !!user?.id,
      refetchInterval: 10000, // Refetch every 10 seconds
      onError: (error) => {
        console.error('Error fetching balance:', error);
      }
    }
  );


  // Set default draw when draws are loaded
  useEffect(() => {
    if (draws && Array.isArray(draws) && draws.length > 0 && !selectedDraw) {
      // First, try to find the draw by ID from URL parameter
      if (drawParam) {
        const drawById = draws.find(draw => draw.id.toString() === drawParam);
        if (drawById) {
          console.log('🎯 Selected draw by ID:', drawById.drawTime, drawById.id);
          setSelectedDraw(drawById);
          return;
        }
      }
      
      // If no draw ID or draw not found, try to find by draw time
      if (timeParam) {
        const drawByTime = draws.find(draw => {
          const drawTimeLabel = getDrawTimeLabel(draw.drawTime);
          return drawTimeLabel === timeParam || formatDrawTime(draw.drawTime) === timeParam;
        });
        if (drawByTime) {
          console.log('🎯 Selected draw by time:', drawByTime.drawTime, drawByTime.id);
          setSelectedDraw(drawByTime);
          return;
        }
      }
      
      // Fallback: Find the first open draw
      const openDraw = draws.find(draw => draw.status === 'open');
      if (openDraw) {
        console.log('🎯 Selected first open draw:', openDraw.drawTime, openDraw.id);
        setSelectedDraw(openDraw);
      } else {
        console.log('🎯 Selected first available draw:', draws[0].drawTime, draws[0].id);
        setSelectedDraw(draws[0]);
      }
    }
  }, [draws, selectedDraw, drawParam, timeParam]);

  // Timer effect for countdown
  useEffect(() => {
    if (!selectedDraw) return;

    const updateTimer = () => {
      const now = new Date();
      const cutoffTime = new Date(selectedDraw.cutoffTime);
      const drawTime = new Date(selectedDraw.drawDatetime);
      
      let targetTime;
      if (now > drawTime) {
        targetTime = null; // Draw is over
      } else if (now > cutoffTime) {
        targetTime = drawTime; // Show time until draw
      } else {
        targetTime = cutoffTime; // Show time until cutoff
      }

      if (targetTime) {
        const diff = targetTime - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setTimeRemaining({
            hours,
            minutes,
            seconds,
            total: diff,
            isCutoff: now <= cutoffTime
          });
        } else {
          setTimeRemaining(null);
        }
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [selectedDraw]);

  // Create ticket mutation
  const createTicketMutation = useMutation(
    async (ticketData) => {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Ticket created successfully!');
        
        // Show mobile ticket preview
        setCreatedTicket(data.data);
        setShowMobileTicket(true);
        
        // Refresh balance and tickets
        queryClient.invalidateQueries(['balance', user.id]);
        queryClient.invalidateQueries('tickets');
        refetchBalance(); // Force immediate balance refresh
        
        // Emit real-time notification
        const notificationData = {
          ticketId: data.data.id,
          ticketNumber: data.data.ticketNumber,
          agentName: user.fullName || user.username || 'Unknown Agent',
          betCount: data.data.bets?.length || 0,
          totalAmount: data.data.totalAmount || 0,
          drawTime: data.data.draw?.drawTime || 'Unknown Draw',
          bets: data.data.bets || []
        };
        
        console.log('Emitting ticket-created notification:', notificationData);
        emit('ticket-created', notificationData);
        
        // Reset form
        setBetDigits(['?', '?', '?']);
        setCurrentDigitIndex(0);
        setBetAmount(10);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create ticket');
      }
    }
  );

  const handleBetTypeChange = (type) => {
    setBetType(type);
    setBetDigits(''); // Clear digits when changing bet type
  };

  const handleDigitInput = (digit) => {
    if (currentDigitIndex < 3) {
      const newDigits = [...betDigits];
      newDigits[currentDigitIndex] = digit.toString();
      setBetDigits(newDigits);
      setCurrentDigitIndex(prev => Math.min(prev + 1, 2));
    }
  };

  const handleClearDigits = () => {
    setBetDigits(['?', '?', '?']);
    setCurrentDigitIndex(0);
  };

  const handleBackspace = () => {
    if (currentDigitIndex > 0) {
      const newDigits = [...betDigits];
      newDigits[currentDigitIndex - 1] = '?';
      setBetDigits(newDigits);
      setCurrentDigitIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const handleDigitClick = (index) => {
    setCurrentDigitIndex(index);
  };

  const handleAddBet = () => {
    const hasAllDigits = betDigits.every(digit => digit !== '?');
    
    if (!hasAllDigits) {
      toast.error('Please enter exactly 3 digits');
      return;
    }

    if (betAmount < 1) {
      toast.error('Minimum bet amount is ₱1');
      return;
    }

    const betNumber = betDigits.join('');
    const newBet = {
      id: Date.now(),
      number: betNumber,
      type: betType,
      amount: betAmount
    };

    // Check if bet already exists
    const existingBet = addedBets.find(bet => 
      bet.number === betNumber && bet.type === betType
    );

    if (existingBet) {
      toast.error('This bet combination already exists');
      return;
    }

    setAddedBets(prev => [...prev, newBet]);
    setBetDigits(['?', '?', '?']);
    setCurrentDigitIndex(0);
    toast.success(`Bet ${betNumber} (${betType}) added for ₱${betAmount}`);
  };

  const handleRemoveBet = (betId) => {
    setAddedBets(prev => prev.filter(bet => bet.id !== betId));
    toast.success('Bet removed');
  };

  const getTotalBetAmount = () => {
    return addedBets.reduce((total, bet) => total + bet.amount, 0);
  };

  const handleConfirmAllBets = () => {
    if (addedBets.length === 0) {
      toast.error('Please add at least one bet');
      return;
    }

    if (balance && balance.currentBalance < getTotalBetAmount()) {
      toast.error('Insufficient balance');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    // Check if draws are loaded
    if (!draws || !Array.isArray(draws)) {
      toast.error('Draw information is still loading. Please wait and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure we use an open draw
      const targetDraw = selectedDraw?.status === 'open' ? selectedDraw : 
                        (Array.isArray(draws) ? draws.find(draw => draw.status === 'open') : null);
      
      if (!targetDraw) {
        toast.error('No open draws available for betting');
        return;
      }

      // Get agent's assigned template
      let templateId = null;
      try {
        const templatesResponse = await api.get(`/ticket-templates/agent/${user.id}`);
        const templates = templatesResponse.data.data || [];
        console.log('Available templates for agent:', templates);
        
        const assignedTemplate = templates.find(t => t.isActive);
        if (assignedTemplate) {
          templateId = assignedTemplate.id;
          console.log('Using assigned template:', assignedTemplate.name, 'ID:', templateId);
        } else {
          console.log('No active template assigned, using default template');
        }
      } catch (error) {
        console.log('Error fetching templates, using default:', error);
      }

      // Create a single ticket with multiple bets
      const ticketData = {
        drawId: targetDraw.id,
        userId: user.id,
        templateId: templateId, // Pass the template ID
        bets: addedBets.map(bet => ({
          betCombination: bet.number,
          betType: bet.type,
          betAmount: bet.amount
        }))
      };

      const response = await api.post('/tickets', ticketData);
      const ticket = response.data.data;

      // Set the created ticket and show mobile ticket modal
      setCreatedTicket(ticket);
      setShowMobileTicket(true);
      
      // Log template information for debugging
      console.log('Ticket created with template ID:', ticket.templateId || 'default');

      toast.success(`Ticket with ${addedBets.length} bets created successfully!`);
      
      // Reset form
      setAddedBets([]);
      setBetDigits(['?', '?', '?']);
      setCurrentDigitIndex(0);
      setShowConfirmModal(false);
      
      // Refresh balance
      queryClient.invalidateQueries(['balance', user.id]);
      refetchBalance(); // Force immediate balance refresh
      
    } catch (error) {
      console.error('Error creating tickets:', error);
      toast.error(error.response?.data?.message || 'Failed to create tickets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAndPrintTicket = async (ticket) => {
    try {
      // Check if agent has assigned templates
      const templatesResponse = await api.get(`/ticket-templates/agent/${user.id}`);
      const templates = templatesResponse.data.data || [];
      
      // Find mobile template first, then any other assigned template
      const mobileTemplate = templates.find(t => t.design?.templateType === 'mobile');
      const selectedTemplate = mobileTemplate || templates[0];
      
      if (selectedTemplate) {
        // Use assigned template
        const ticketHtml = await generateCustomTicketTemplate(ticket, selectedTemplate);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(ticketHtml);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }, 500);
        };
        toast.success(`${selectedTemplate.design?.templateType === 'mobile' ? 'Mobile' : 'Custom'} ticket sent to printer`);
      } else {
        // Fallback to mobile-optimized ticket
        MobileTicketUtils.printMobileTicket(ticket, user);
        toast.success('Default ticket sent to printer');
      }
    } catch (error) {
      console.error('Error printing ticket:', error);
      toast.error('Failed to print ticket');
    }
  };

  const handleShareTicket = async (ticket) => {
    try {
      // Get user's assigned template
      const template = await getUserTemplate(user.id);
      
      const result = await EnhancedMobileTicketUtils.shareTicket(ticket, user, template);
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

  const handleDownloadTicket = async (ticket) => {
    try {
      // Get user's assigned template
      const template = await getUserTemplate(user.id);
      
      // Check if it's a mobile POS template
      if (template && template.design?.templateType === 'mobile-pos') {
        await MobilePOSUtils.downloadMobilePOSTicket(ticket, user, template);
        toast.success('Mobile POS ticket downloaded as image!');
      } else {
        await EnhancedMobileTicketUtils.downloadTicketImage(ticket, user, template);
        toast.success('Ticket downloaded as image!');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const handleMobilePOSPrint = async (ticket) => {
    try {
      // Get user's assigned template
      const template = await getUserTemplate(user.id);
      
      await MobilePOSUtils.printMobilePOSTicket(ticket, user, template);
      toast.success('Mobile POS ticket sent to printer!');
    } catch (error) {
      console.error('Error printing mobile POS ticket:', error);
      toast.error('Failed to print mobile POS ticket');
    }
  };

  const handleMobilePOSShare = async (ticket) => {
    try {
      // Get user's assigned template
      const template = await getUserTemplate(user.id);
      
      const result = await MobilePOSUtils.shareMobilePOSTicket(ticket, user, template);
      if (result.success) {
        if (result.method === 'web-share') {
          toast.success('Mobile POS ticket shared successfully!');
        } else {
          toast.success('Mobile POS ticket link copied to clipboard!');
        }
      } else {
        toast.error('Failed to share mobile POS ticket');
      }
    } catch (error) {
      console.error('Error sharing mobile POS ticket:', error);
      toast.error('Failed to share mobile POS ticket');
    }
  };

  // Get user's assigned template
  const getUserTemplate = async (userId) => {
    try {
      const response = await api.get(`/ticket-templates/user-assignment/${userId}`);
      return response.data.data?.template || null;
    } catch (error) {
      console.error('Error getting user template:', error);
      return null;
    }
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
      return generateTicketTemplate(ticket);
    }
  };

  const generateTicketTemplate = (ticket) => {
    // Handle multiple bets
    const bets = ticket.bets || [];
    const betListHtml = bets.length > 0 
      ? bets.map((bet, index) => {
          const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
          const sequence = String.fromCharCode(65 + index); // A, B, C, etc.
          return `<div class="bet-item" style="margin: 5px 0; padding: 5px; border-left: 2px solid #333; font-family: monospace;">
            <div>${betType} (Bet Type)                                                ${bet.betCombination.split('').join('   ')} (Bet Combination)</div>
            <div>${sequence} (Bet Sequence)                                                                           Price: ₱${parseFloat(bet.betAmount).toFixed(2)} (Bet Price)</div>
          </div>`;
        }).join('')
      : '<div class="content">No bets found</div>';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>3D Lotto Ticket</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
          .ticket { width: 300px; border: 1px solid #000; padding: 10px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
          .content { margin: 5px 0; }
          .footer { text-align: center; margin-top: 10px; font-size: 10px; }
          .qr-code { text-align: center; margin: 10px 0; }
          .bet-item { font-size: 11px; }
          .total-amount { font-weight: bold; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">3D LOTTO TICKET</div>
          <div class="content">Ticket #: ${ticket.ticketNumber}</div>
          <div class="content">Draw: ${formatDrawTimeForTicket(ticket.draw?.drawTime)} - ${ticket.draw?.drawDate ? new Date(ticket.draw.drawDate).toLocaleDateString() : 'No Date'}</div>
          <div class="content">Bets (${bets.length}):</div>
          ${betListHtml}
          <div class="content total-amount">Total Amount: ₱${ticket.totalAmount}</div>
          <div class="content">Agent: ${user.fullName || user.username}</div>
          <div class="content">Date: ${new Date(ticket.createdAt).toLocaleString()}</div>
          <div class="qr-code">
            <img src="${ticket.qrCode}" alt="QR Code" style="width: 100px; height: 100px;" />
          </div>
          <div class="footer">Good luck!</div>
        </div>
      </body>
      </html>
    `;
  };

  const availableAmounts = [1, 5, 10, 20, 30, 40, 50, 100, 200, 500];

  const getDrawInfo = () => {
    if (drawParam && timeParam) {
      return {
        id: drawParam,
        time: decodeURIComponent(timeParam),
        date: '2025-09-15',
        status: 'Betting Open',
        timeLeft: '19m left'
      };
    }
    return null;
  };

  const drawInfo = getDrawInfo();

  const validateBet = () => {
    const hasAllDigits = betDigits.every(digit => digit !== '?');
    
    if (!hasAllDigits) {
      toast.error('Please enter exactly 3 digits');
      return false;
    }

    if (betType === 'rambolito') {
      // Check for triple numbers (not allowed)
      const uniqueDigits = [...new Set(betDigits)];
      if (uniqueDigits.length === 1) {
        toast.error('Triple numbers (000, 111, 222, etc.) are not allowed for Rambolito betting');
        return false;
      }
    }

    if (betAmount < 10) {
      toast.error('Minimum bet amount is ₱10');
      return false;
    }

    if (balance && balance.currentBalance < betAmount) {
      toast.error('Insufficient balance');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBet()) {
      return;
    }

    // Check if draws are loaded
    if (!draws || !Array.isArray(draws)) {
      toast.error('Draw information is still loading. Please wait and try again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure we use an open draw
      const targetDraw = selectedDraw?.status === 'open' ? selectedDraw : 
                        (Array.isArray(draws) ? draws.find(draw => draw.status === 'open') : null);
      
      if (!targetDraw) {
        toast.error('No open draws available for betting');
        return;
      }

      await createTicketMutation.mutateAsync({
        betType,
        betDigits: betDigits.join(''),
        betAmount,
        drawId: targetDraw.id
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDrawStatus = (draw) => {
    const now = new Date();
    const cutoffTime = new Date(draw.cutoffTime);
    const drawTime = new Date(draw.drawDatetime);
    
    if (now > drawTime) {
      return { status: 'closed', color: 'red', text: 'Draw Completed' };
    } else if (now > cutoffTime) {
      return { status: 'cutoff', color: 'yellow', text: 'Betting Closed' };
    } else {
      return { status: 'open', color: 'green', text: 'Betting Open' };
    }
  };

  const getBettingWindowStatus = (draw) => {
    if (!draw.bettingWindow) return null;
    
    const now = new Date();
    const startTime = new Date(draw.bettingWindow.startTime);
    const endTime = new Date(draw.bettingWindow.endTime);
    
    if (now < startTime) {
      return { status: 'upcoming', text: `Opens at ${startTime.toLocaleTimeString()}` };
    } else if (now > endTime) {
      return { status: 'closed', text: 'Betting window closed' };
    } else {
      return { status: 'open', text: draw.bettingWindow.description };
    }
  };

  if (drawsLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
        
        {/* Draw Header with Countdown Timer */}
        {selectedDraw && timeRemaining && (
          <div className={`rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 border-l-4 ${
            timeRemaining.isCutoff && timeRemaining.total < 300000 // 5 minutes
              ? 'bg-white border-red-500 animate-pulse'
              : timeRemaining.isCutoff && timeRemaining.total < 600000 // 10 minutes
              ? 'bg-white border-yellow-500'
              : 'bg-white border-blue-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {formatDrawTimeForTicket(selectedDraw.drawTime)} Draw
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date(selectedDraw.drawDate).toLocaleDateString()}
                  {timeRemaining.isCutoff && timeRemaining.total < 300000 && (
                    <span className="ml-2 font-bold text-red-600">⚠️ HURRY!</span>
                  )}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <ClockIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    timeRemaining.isCutoff && timeRemaining.total < 300000
                      ? 'text-red-500'
                      : timeRemaining.isCutoff && timeRemaining.total < 600000
                      ? 'text-yellow-500'
                      : 'text-blue-500'
                  }`} />
                  <span className={`text-sm sm:text-lg font-bold ${
                    timeRemaining.isCutoff && timeRemaining.total < 300000
                      ? 'text-red-600'
                      : timeRemaining.isCutoff && timeRemaining.total < 600000
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}:`}
                    {timeRemaining.minutes.toString().padStart(2, '0')}:
                    {timeRemaining.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {timeRemaining.isCutoff ? 'Betting Closes In' : 'Draw Starts In'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3D Lotto Betting Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">

          {/* Bet Type Selection */}
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Bet Type</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setBetType('standard')}
                className={`p-2 sm:p-3 rounded-lg border-2 text-center text-xs sm:text-sm font-medium transition-colors ${
                  betType === 'standard'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setBetType('rambolito')}
                className={`p-2 sm:p-3 rounded-lg border-2 text-center text-xs sm:text-sm font-medium transition-colors ${
                  betType === 'rambolito'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Rambolito
              </button>
            </div>
          </div>

          {/* Number Selection Display */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm text-gray-600">Select from 0-9</p>
              <button
                onClick={handleClearDigits}
                className="text-red-500 text-xs sm:text-sm font-medium"
              >
                ✕ Clear
              </button>
            </div>
            
            {/* Selected Numbers Display */}
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-6">
              {betDigits.map((digit, index) => (
                <button
                  key={index}
                  onClick={() => handleDigitClick(index)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-lg sm:text-2xl font-bold transition-colors ${
                    currentDigitIndex === index
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigitInput(num)}
                  className="h-10 sm:h-12 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm sm:text-lg font-medium transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-10 sm:h-12 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <BackspaceIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => handleDigitInput(0)}
                className="h-10 sm:h-12 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm sm:text-lg font-medium transition-colors"
              >
                0
              </button>
              <button 
                onClick={handleAddBet}
                disabled={betDigits.includes('?')}
                className="h-10 sm:h-12 rounded-lg bg-green-400 hover:bg-green-500 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Bet Amount</p>
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-2 sm:mb-3">
              <button
                onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
              >
                <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <input
                type="number"
                min="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 sm:w-20 px-2 sm:px-3 py-1 sm:py-2 text-center text-sm sm:text-lg font-bold text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => setBetAmount(betAmount + 1)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
              >
                <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {availableAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`py-1 px-1 sm:px-2 text-xs rounded border transition-colors ${
                    betAmount === amount 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ₱{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            {addedBets.length > 0 && (
              <>
                <button
                  onClick={() => setShowViewBets(true)}
                  className="w-full bg-blue-500 text-white py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-lg hover:bg-blue-600 transition-all"
                >
                  View Bets ({addedBets.length})
                </button>
                
                <button
                  onClick={handleConfirmAllBets}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-lg hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? 'Processing...' : `Confirm All Bets (₱${getTotalBetAmount()})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Bets Modal */}
        {showViewBets && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center min-h-screen z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-md max-h-96 overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Your Bets</h3>
                  <button
                    onClick={() => setShowViewBets(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4 max-h-64 overflow-y-auto">
                {addedBets.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">No bets added yet</p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {addedBets.map((bet) => (
                      <div key={bet.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-lg text-gray-900 truncate">{bet.number}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{bet.type} • ₱{bet.amount}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveBet(bet.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total: ₱{getTotalBetAmount()}</span>
                  <button
                    onClick={() => setShowViewBets(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center min-h-screen z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Bets</h3>
                <div className="mb-6">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {addedBets.map((bet) => (
                      <div key={bet.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-mono text-lg font-bold">{bet.number}</span>
                        <span className="text-sm text-gray-600">{bet.type}</span>
                        <span className="font-medium">₱{bet.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">₱{getTotalBetAmount()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Current Balance:</span>
                      <span className="text-sm font-medium">₱{balance?.currentBalance?.toLocaleString() || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Remaining Balance:</span>
                      <span className="text-sm font-medium">₱{((balance?.currentBalance || 0) - getTotalBetAmount()).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 font-bold"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Ticket Preview Modal */}
        {showMobileTicket && createdTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Your Lottery Ticket</h3>
                  <button
                    onClick={() => setShowMobileTicket(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Debug template information */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Template Information:</p>
                  <p className="text-xs text-blue-600">Template ID: {createdTicket.templateId || 'Default (1)'}</p>
                  <p className="text-xs text-blue-600">Ticket Number: {createdTicket.ticketNumber}</p>
                </div>

                {/* Check if we should use custom template or default mobile template */}
                {createdTicket.templateId && createdTicket.templateId !== 1 ? (
                  <CustomTemplatePreview
                    ticket={createdTicket}
                    user={user}
                    onShare={() => handleShareTicket(createdTicket)}
                    onPrint={() => generateAndPrintTicket(createdTicket)}
                  />
                ) : (
                  <MobileTicketTemplate
                    ticket={createdTicket}
                    user={user}
                    onShare={() => handleShareTicket(createdTicket)}
                    onPrint={() => generateAndPrintTicket(createdTicket)}
                  />
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadTicket(createdTicket)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    📱 Download Image
                  </button>
                  <button
                    onClick={() => handleMobilePOSPrint(createdTicket)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                  >
                    🖨️ POS Print
                  </button>
                  <button
                    onClick={() => handleMobilePOSShare(createdTicket)}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                  >
                    📤 POS Share
                  </button>
                  <button
                    onClick={() => setShowMobileTicket(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingInterface;

