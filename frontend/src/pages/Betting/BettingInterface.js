import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime, getDrawTimeLabel } from '../../utils/drawTimeFormatter';
import TicketGenerator from '../../utils/ticketGenerator';
import TemplateAssigner from '../../utils/templateAssigner';
import MobileTicketUtils from '../../utils/mobileTicketUtils';
import {
  ClockIcon,
  XMarkIcon,
  BackspaceIcon,
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import ModernButton from '../../components/UI/ModernButton';
import ModernCard from '../../components/UI/ModernCard';

// Default Template Preview Component
const DefaultTemplatePreview = ({ ticket, user, onShare, onPrint }) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the same ticket format as the actual printed ticket
        // Use system-wide active template (58mm optimized)
        let template = null;
        try {
          template = await TemplateAssigner.fetchSystemTemplate();
        } catch (_) {}
        const ticketHtml = TicketGenerator.generateWithTemplate(ticket, user, template, {});
        
        // Preview optimized for 58mm thermal printer (220px width)
        const wrappedHtml = `
          <div style="width:220px;margin:0 auto;overflow:hidden;position:relative;border:1px solid #ddd;background:white;">
            <div style="width:220px;transform-origin:top left;position:relative;">${ticketHtml}</div>
          </div>
        `;
        setTemplateHtml(wrappedHtml);
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
          <p className="text-sm text-gray-600">58mm Thermal Printer Template</p>
        </div>
        <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading ticket...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-preview">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">58mm Thermal Printer Template</p>
        </div>
        <div className="border-2 border-dashed border-red-300 p-4 rounded-lg bg-red-50">
          <p className="text-center text-red-500">Error loading ticket: {error}</p>
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
        <p className="text-sm text-gray-600">58mm Thermal Printer Template</p>
      </div>
      
      {/* Template Preview Container */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <div 
          className="template-preview-container w-full flex justify-center"
          style={{
            transform: 'scale(1)',
            transformOrigin: 'center center'
          }}
          dangerouslySetInnerHTML={{ __html: templateHtml }}
        />
      </div>
      
    </div>
  );
};

const BettingInterface = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to format draw time (using utility function)
  const formatDrawTimeForTicket = (drawTime) => {
    return formatDrawTime(drawTime);
  };
  
  // Get URL parameters for draw selection
  const urlParams = new URLSearchParams(window.location.search);
  const drawParam = urlParams.get('draw');
  const timeParam = urlParams.get('time');
  
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

  // Fetch active draws - optimized for mobile POS
  const { data: draws, isLoading: drawsLoading } = useQuery({
    queryKey: ['activeDraws'],
    queryFn: async () => {
      const response = await api.get('/draws/current/active');
      // The API returns { success: true, data: [...] }, so we need response.data.data
      return response.data.data || [];
    },
    refetchInterval: 90000, // Optimized: 90s for mobile POS (reduced from 30s)
    staleTime: 45000, // Consider data fresh for 45s
    refetchOnWindowFocus: false, // Disable refetch on focus for mobile
    onError: (error) => {
      toast.error('Failed to load draw information');
    }
  });

  // Fetch user balance - optimized polling
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await api.get(`/balance/${user.id}`);
      // The API returns { success: true, data: balance, currentBalance: balance.currentBalance }
      return response.data.data || response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Optimized: 30s for mobile POS (reduced from 10s)
    staleTime: 15000, // Consider data fresh for 15s
    refetchOnWindowFocus: false, // Disable refetch on focus
  });


  // Set default draw when draws are loaded - memoized for performance
  useEffect(() => {
    if (draws && Array.isArray(draws) && draws.length > 0 && !selectedDraw) {
      // First, try to find the draw by ID from URL parameter
      if (drawParam) {
        const drawById = draws.find(draw => draw.id.toString() === drawParam);
        if (drawById) {
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
          setSelectedDraw(drawByTime);
          return;
        }
      }
      
      // Fallback: Find the first open draw
      const openDraw = draws.find(draw => draw.status === 'open');
      if (openDraw) {
        setSelectedDraw(openDraw);
      } else {
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


  // Optimized digit input handler with useCallback
  const handleDigitInput = useCallback((digit) => {
    if (currentDigitIndex < 3) {
      const newDigits = [...betDigits];
      newDigits[currentDigitIndex] = digit.toString();
      setBetDigits(newDigits);
      setCurrentDigitIndex(prev => Math.min(prev + 1, 2));
    }
  }, [betDigits, currentDigitIndex]);

  const handleClearDigits = useCallback(() => {
    setBetDigits(['?', '?', '?']);
    setCurrentDigitIndex(0);
  }, []);

  const handleBackspace = useCallback(() => {
    if (currentDigitIndex > 0) {
      const newDigits = [...betDigits];
      newDigits[currentDigitIndex - 1] = '?';
      setBetDigits(newDigits);
      setCurrentDigitIndex(prev => Math.max(prev - 1, 0));
    }
  }, [currentDigitIndex, betDigits]);

  const handleDigitClick = (index) => {
    setCurrentDigitIndex(index);
  };

  const handleAddBet = useCallback(() => {
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
  }, [betDigits, betAmount, betType, addedBets]);

  const handleRemoveBet = useCallback((betId) => {
    setAddedBets(prev => prev.filter(bet => bet.id !== betId));
    toast.success('Bet removed');
  }, []);

  const getTotalBetAmount = useCallback(() => {
    return addedBets.reduce((total, bet) => total + bet.amount, 0);
  }, [addedBets]);

  const handleConfirmAllBets = useCallback(() => {
    if (addedBets.length === 0) {
      toast.error('Please add at least one bet');
      return;
    }

    if (balance && balance.currentBalance < getTotalBetAmount()) {
      toast.error('Insufficient balance');
      return;
    }

    setShowConfirmModal(true);
  }, [addedBets, balance, getTotalBetAmount]);

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

      // Create a single ticket with multiple bets using default template
      
      // Calculate total amount
      const totalAmount = addedBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      
      const processedBets = addedBets.map(bet => {
        // Ensure bet combination is exactly 3 digits (pad with zeros if needed)
        const paddedNumber = bet.number.toString().padStart(3, '0');
        
        return {
          betCombination: paddedNumber,
          betType: bet.type,
          betAmount: parseFloat(bet.amount)
        };
      });
      
      const ticketData = {
        drawId: targetDraw.id,
        userId: user.id,
        totalAmount: totalAmount,
        bets: processedBets
      };

      // Use create endpoint for ticket creation
      const response = await api.post('/tickets/create', ticketData);
      
      if (response.data.success) {
        const ticket = response.data.ticket;
        
        // Clear form
        setAddedBets([]);
        setBetDigits(['?', '?', '?']);
        setCurrentDigitIndex(0);
        setShowConfirmModal(false);
        
        // Smart detection: Printer available = Print, No printer = Share
        const isAndroidPOS = typeof window.AndroidPOS !== 'undefined';
        const hasPrinter = isAndroidPOS && window.AndroidPOS.isConnected && window.AndroidPOS.isConnected();
        const hasPrintImage = isAndroidPOS && typeof window.AndroidPOS.printImage === 'function';
        
        console.log('🔍 Device detection:', {
          isAndroidPOS,
          hasPrinter,
          hasPrintImage
        });
        
        if (isAndroidPOS && hasPrintImage && hasPrinter) {
          // Android POS with printer: Direct print
          console.log('🖨️ Printer detected - printing directly...');
          setCreatedTicket(ticket);
          
          // Print immediately without showing modal
          setTimeout(() => {
            generateAndPrintTicket(ticket, true);
          }, 300);
          
          toast.success('🖨️ Printing ticket...', { duration: 2000 });
          
        } else if (isAndroidPOS && !hasPrinter) {
          // Android POS without printer: Show share dialog
          console.log('📤 No printer detected - showing share options...');
          setCreatedTicket(ticket);
          setShowMobileTicket(true);
          
          // Auto-trigger share dialog
          setTimeout(() => {
            handleShareTicket(ticket);
          }, 500);
          
          toast.success('📤 Ticket created! Opening share options...', { duration: 2000 });
          
        } else if (isAndroidPOS && !hasPrintImage) {
          // Android POS without printImage: Show upgrade message
          console.log('⚠️ printImage not available - showing modal...');
          setCreatedTicket(ticket);
          setShowMobileTicket(true);
          
          toast.warning('⚠️ Please update app for direct printing', { duration: 3000 });
          
        } else {
          // Web/Browser: Show modal with preview
          console.log('🌐 Web browser detected - showing preview modal...');
          setCreatedTicket(ticket);
          setShowMobileTicket(true);
          
          // Auto-print after modal opens
          setTimeout(() => {
            generateAndPrintTicket(ticket, false);
          }, 500);
        }
        
        // Refresh balance after successful bet
        queryClient.invalidateQueries(['userBalance', user.id]);
        refetchBalance(); // Force immediate balance refresh

        toast.success(`Ticket with ${addedBets.length} bets created successfully! Remaining balance: ₱${response.data.remainingBalance.toFixed(2)}`);
      } else {
        toast.error(response.data.message || 'Failed to create ticket');
      }
      
    } catch (error) {
      console.error('Error creating tickets:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create tickets';
      toast.error(errorMessage);
      
      // Show specific error messages for common issues
      if (errorMessage.includes('Insufficient balance')) {
        toast.error('Please check your balance and try again');
      } else if (errorMessage.includes('Duplicate bet')) {
        toast.error('You have already placed this bet for this draw');
      } else if (errorMessage.includes('Bet limit exceeded')) {
        toast.error('You have reached your betting limit for this draw');
      } else if (errorMessage.includes('Draw is not open')) {
        toast.error('This draw is no longer open for betting');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAndPrintTicket = async (ticket, showToast = true) => {
    try {
      // Use shared ticket generator with silent iframe printing
      await TicketGenerator.printTicket(ticket, user, { autoClose: true, silent: false });
      if (showToast) {
        toast.success('🖨️ Printing ticket...');
      }
    } catch (error) {
      console.error('Error printing ticket:', error);
      if (showToast) {
        toast.error('Failed to print ticket');
      }
    }
  };

  const handleShareTicket = async (ticket) => {
    try {
      // Use the improved mobile sharing utility with image support
      const result = await MobileTicketUtils.shareTicket(ticket, user);
      
      if (result.success) {
        if (result.method === 'web-share-image') {
          toast.success('Ticket image shared successfully!');
        } else if (result.method === 'web-share-text') {
          toast.success('Ticket details shared successfully!');
        } else if (result.method === 'clipboard') {
          toast.success(result.message || 'Ticket details copied to clipboard!');
        } else if (result.method === 'download') {
          toast.success(result.message || 'Ticket image downloaded!');
        } else {
          toast.success('Ticket shared successfully!');
        }
      } else {
        toast.error('Failed to share ticket');
      }
    } catch (error) {
      console.error('Error sharing ticket:', error);
      toast.error('Failed to share ticket');
    }
  };




  const availableAmounts = [1, 5, 10, 20, 30, 40, 50, 100, 200, 500];






  // Memoize expensive calculations for performance
  const totalBetAmount = useMemo(() => {
    return addedBets.reduce((total, bet) => total + bet.amount, 0);
  }, [addedBets]);

  const hasInsufficientBalance = useMemo(() => {
    return balance && balance.currentBalance < totalBetAmount;
  }, [balance, totalBetAmount]);

  // Optimize digit input handler with useCallback
  const handleDigitInputOptimized = useCallback((digit) => {
    if (currentDigitIndex < 3) {
      setBetDigits(prev => {
        const newDigits = [...prev];
        newDigits[currentDigitIndex] = digit.toString();
        return newDigits;
      });
      setCurrentDigitIndex(prev => Math.min(prev + 1, 2));
    }
  }, [currentDigitIndex]);

  // Optimize bet amount changes
  const handleBetAmountChange = useCallback((newAmount) => {
    setBetAmount(Math.max(1, newAmount));
  }, []);

  // Detect Android 6-8 for performance optimizations
  const isOldAndroid = /Android [6-8]/.test(navigator.userAgent);

  if (drawsLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className={`rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4 ${isOldAndroid ? '' : 'animate-spin'}`}></div>
          <p className="text-primary-600 font-medium">Loading betting interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 p-2 sm:p-4">
      <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
        
        {/* Draw Header with Countdown Timer */}
        {selectedDraw && timeRemaining && (
          <ModernCard 
            variant="elevated" 
            className={`border-l-4 ${
              timeRemaining.isCutoff && timeRemaining.total < 300000 // 5 minutes
                ? `border-danger-500 ${isOldAndroid ? '' : 'animate-pulse'}`
                : timeRemaining.isCutoff && timeRemaining.total < 600000 // 10 minutes
                ? 'border-warning-500'
                : 'border-primary-500'
            }`}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent truncate">
                    {formatDrawTimeForTicket(selectedDraw.drawTime)} Draw
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date(selectedDraw.drawDate).toLocaleDateString()}
                    {timeRemaining.isCutoff && timeRemaining.total < 300000 && (
                      <span className={`ml-2 font-bold text-danger-600 ${isOldAndroid ? '' : 'animate-pulse'}`}>⚠️ HURRY!</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <ClockIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      timeRemaining.isCutoff && timeRemaining.total < 300000
                        ? 'text-danger-500'
                        : timeRemaining.isCutoff && timeRemaining.total < 600000
                        ? 'text-warning-500'
                        : 'text-primary-500'
                    }`} />
                    <span className={`text-sm sm:text-lg font-bold ${
                      timeRemaining.isCutoff && timeRemaining.total < 300000
                        ? 'text-danger-600'
                        : timeRemaining.isCutoff && timeRemaining.total < 600000
                        ? 'text-warning-600'
                        : 'text-primary-600'
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
          </ModernCard>
        )}

        {/* 3D Lotto Betting Card */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-6">

            {/* Bet Type Selection */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <TicketIcon className="h-4 w-4 text-primary-600" />
                <p className="text-xs sm:text-sm font-semibold text-gray-700">Bet Type</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <ModernButton
                  variant={betType === 'standard' ? 'primary' : 'ghost'}
                  onClick={() => setBetType('standard')}
                  className="w-full py-2 sm:py-3 text-xs sm:text-sm"
                >
                  Standard
                </ModernButton>
                <ModernButton
                  variant={betType === 'rambolito' ? 'primary' : 'ghost'}
                  onClick={() => setBetType('rambolito')}
                  className="w-full py-2 sm:py-3 text-xs sm:text-sm"
                >
                  Rambolito
                </ModernButton>
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

            {/* Number Pad - Optimized for performance */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <ModernButton
                  key={num}
                  variant="secondary"
                  onClick={() => handleDigitInputOptimized(num)}
                  className="h-10 sm:h-12 text-sm sm:text-lg font-medium"
                >
                  {num}
                </ModernButton>
              ))}
              <ModernButton
                variant="ghost"
                onClick={handleBackspace}
                className="h-10 sm:h-12"
                icon={BackspaceIcon}
              />
              <ModernButton
                variant="secondary"
                onClick={() => handleDigitInputOptimized(0)}
                className="h-10 sm:h-12 text-sm sm:text-lg font-medium"
              >
                0
              </ModernButton>
              <ModernButton
                variant="success"
                onClick={handleAddBet}
                disabled={betDigits.includes('?')}
                className="h-10 sm:h-12"
                icon={PlusIcon}
              />
            </div>
          </div>

            {/* Bet Amount */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                <CurrencyDollarIcon className="h-4 w-4 text-primary-600" />
                <p className="text-xs sm:text-sm font-semibold text-gray-700">Bet Amount</p>
              </div>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-2 sm:mb-3">
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBetAmountChange(betAmount - 1)}
                  disabled={betAmount <= 1}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  icon={MinusIcon}
                />
                <input
                  type="number"
                  min="1"
                  value={betAmount}
                  onChange={(e) => handleBetAmountChange(parseInt(e.target.value) || 1)}
                  className="w-16 sm:w-20 px-2 sm:px-3 py-1 sm:py-2 text-center text-sm sm:text-lg font-bold text-primary-700 bg-primary-50 border-2 border-primary-200 rounded-xl focus:outline-none focus:border-primary-400 transition-all duration-200"
                />
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBetAmountChange(betAmount + 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  icon={PlusIcon}
                />
              </div>
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {availableAmounts.map(amount => (
                  <ModernButton
                    key={amount}
                    variant={betAmount === amount ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleBetAmountChange(amount)}
                    className="py-1 px-1 sm:px-2 text-xs"
                  >
                    ₱{amount}
                  </ModernButton>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              {addedBets.length > 0 && (
                <>
                  <ModernButton
                    variant="primary"
                    onClick={() => setShowViewBets(true)}
                    className="w-full py-2 sm:py-3 text-sm sm:text-lg font-bold"
                  >
                    View Bets ({addedBets.length})
                  </ModernButton>
                  
                  <ModernButton
                    variant="success"
                    onClick={handleConfirmAllBets}
                    disabled={isSubmitting || hasInsufficientBalance}
                    loading={isSubmitting}
                    className={`w-full py-3 sm:py-4 text-sm sm:text-lg font-bold ${
                      hasInsufficientBalance ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Creating Ticket...' : `Confirm All Bets (₱${totalBetAmount})`}
                  </ModernButton>
                  
                  {hasInsufficientBalance && (
                    <div className="text-center p-2 bg-danger-50 border border-danger-200 rounded-lg">
                      <p className="text-xs text-danger-600 font-medium">
                        Insufficient balance. Need ₱{totalBetAmount - (balance?.currentBalance || 0)} more.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ModernCard>

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

                {/* Unified Ticket Display */}
                <DefaultTemplatePreview
                  ticket={createdTicket}
                  user={user}
                  onShare={() => handleShareTicket(createdTicket)}
                  onPrint={() => generateAndPrintTicket(createdTicket)}
                />
                
                {/* Simplified Action Buttons */}
                <div className="mt-4 flex flex-col space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-green-700 text-center">
                      ✅ Ticket automatically sent to printer!
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleShareTicket(createdTicket)}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    📤 Share Ticket Image
                  </button>
                  
                  <button
                    onClick={() => generateAndPrintTicket(createdTicket, true)}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                  >
                    🖨️ Print Again
                  </button>
                  
                  <button
                    onClick={() => setShowMobileTicket(false)}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                  >
                    ✕ Close
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

