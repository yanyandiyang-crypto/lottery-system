import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const ClaimApprovals = () => {
  const { user } = useAuth();
  const [pendingClaims, setPendingClaims] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: getCurrentDatePH()
  });

  const loadPendingClaims = useCallback(async () => {
    try {
      const params = {};
      if (dateFilters.startDate) params.startDate = dateFilters.startDate;
      if (dateFilters.endDate) params.endDate = dateFilters.endDate;
      
      const response = await api.get('/claim-approvals/pending', { params });
      
      if (response.data.success) {
        setPendingClaims(response.data.claims || []);
      } else {
        setPendingClaims([]);
      }
    } catch (err) {
      console.error('Pending claims error:', err);
      // Silently fail - show empty state instead of error
      setPendingClaims([]);
    }
  }, [dateFilters]);

  const loadApprovalHistory = useCallback(async () => {
    try {
      const response = await api.get('/claim-approvals/history?limit=50');
      
      if (response.data.success) {
        setApprovalHistory(response.data.history || []);
      } else {
        setApprovalHistory([]);
      }
    } catch (err) {
      console.error('History error:', err);
      // Silently fail - show empty state
      setApprovalHistory([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/claim-approvals/stats');
      
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Stats error:', err);
      // Silently fail - stats are optional
      setStats(null);
    }
  }, []);

  // Calculate actual prize amount based on prize configuration for WINNING bets only
  const calculateActualPrizeAmount = useCallback((ticket) => {
    if (!ticket?.bets || !Array.isArray(ticket.bets)) {
      return 0;
    }

    // Debug: Log the ticket data to see structure
    console.log('🔍 Ticket data for prize calculation:', {
      ticketNumber: ticket.ticketNumber,
      draw: ticket.draw,
      bets: ticket.bets
    });

    // Prize structure based on bet type and amount
    const prizeStructure = {
      'standard': {
        '3D': 450,      // 450x multiplier for standard 3D
        'rambolito': 75  // 75x multiplier for rambolito
      },
      'straight': {
        '3D': 450,
        'rambolito': 75
      }
    };

    let totalPrize = 0;
    
    // Get winning number from draw (primary) or drawResult (fallback)
    const winningNumber = ticket.draw?.winningNumber || ticket.draw?.drawResult?.winningNumber;
    const winningNumbers = winningNumber ? [winningNumber] : [];

    console.log('🎯 Winning numbers found:', winningNumbers);

    ticket.bets.forEach(bet => {
      const betCombination = bet.betCombination;
      const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
      const betType = (bet.betType || 'standard').toLowerCase();
      
      console.log('🎲 Checking bet:', { betCombination, betType, betAmount });
      
      // Check if this specific bet is a winner
      const isWinning = checkIfBetIsWinning(betCombination, betType, winningNumbers);
      
      console.log('✅ Is winning:', isWinning);
      
      if (isWinning) {
        // Determine multiplier based on bet type
        let multiplier = 0;
        if (betType === 'rambolito') {
          multiplier = prizeStructure.standard.rambolito || 75;
        } else {
          multiplier = prizeStructure.standard['3D'] || 450;
        }

        // Calculate prize: bet amount × multiplier (only for winning bets)
        const betPrize = betAmount * multiplier;
        totalPrize += betPrize;
        
        console.log('💰 Prize calculated:', { betPrize, multiplier, totalPrize });
      }
    });

    console.log('🏁 Final total prize:', totalPrize);
    
    return totalPrize;
  }, []);

  // Helper function to check if a specific bet combination is winning
  const checkIfBetIsWinning = (betCombination, betType, winningNumbers) => {
    if (!betCombination || !winningNumbers || winningNumbers.length === 0) {
      console.log('❌ Missing data:', { betCombination, betType, winningNumbers });
      return false;
    }

    // Clean bet combination
    const cleanBetCombination = betCombination.toString().replace(/\s+/g, '');
    const betDigits = cleanBetCombination.split('').sort();
    
    console.log('🔍 Checking combination:', { 
      original: betCombination, 
      clean: cleanBetCombination, 
      betType, 
      winningNumbers 
    });

    // Handle different winning number formats
    const numbersToCheck = Array.isArray(winningNumbers) ? winningNumbers : [winningNumbers];
    
    return numbersToCheck.some(winningNumber => {
      if (!winningNumber) return false;
      
      const cleanWinningNumber = winningNumber.toString().replace(/\s+/g, '');
      const winningDigits = cleanWinningNumber.split('');
      
      console.log('🎯 Comparing:', { 
        bet: cleanBetCombination, 
        winning: cleanWinningNumber,
        betType 
      });
      
      if (betType === 'rambolito') {
        // For rambolito, check if bet digits match winning digits in any order
        const sortedWinningDigits = winningDigits.sort();
        const match = JSON.stringify(betDigits) === JSON.stringify(sortedWinningDigits);
        console.log('🔄 Rambolito check:', { 
          betDigits, 
          sortedWinningDigits, 
          match 
        });
        return match;
      } else {
        // For standard/straight, check exact match
        const match = cleanBetCombination === cleanWinningNumber;
        console.log('🎯 Standard check:', { 
          bet: cleanBetCombination, 
          winning: cleanWinningNumber, 
          match 
        });
        return match;
      }
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadPendingClaims(),
          loadApprovalHistory(),
          loadStats()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load claim data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadPendingClaims, loadApprovalHistory, loadStats]);

  const handleApprove = async (ticketId) => {
    try {
      const calculatedAmount = calculateActualPrizeAmount(selectedClaim);
      const finalPrizeAmount = prizeAmount ? parseFloat(prizeAmount) : calculatedAmount;
      
      const response = await api.post(`/claim-approvals/${ticketId}/approve`, {
        notes: approvalNotes,
        prizeAmount: finalPrizeAmount
      });
      
      if (response.data.success) {
        alert('Claim approved successfully!');
        setSelectedClaim(null);
        setApprovalNotes('');
        setPrizeAmount('');
        loadPendingClaims();
        loadStats();
      } else {
        alert(response.data.message || 'Error approving claim');
      }
    } catch (err) {
      alert('Error approving claim');
      console.error('Approve error:', err);
    }
  };

  const handleReject = async (ticketId, reason) => {
    const rejectionReason = reason || prompt('Enter rejection reason:');
    if (!rejectionReason) return;

    try {
      const response = await api.post(`/claim-approvals/${ticketId}/reject`, {
        reason: rejectionReason,
        notes: approvalNotes
      });
      
      if (response.data.success) {
        alert('Claim rejected successfully!');
        setSelectedClaim(null);
        setApprovalNotes('');
        loadPendingClaims();
        loadStats();
      } else {
        alert(response.data.message || 'Error rejecting claim');
      }
    } catch (err) {
      alert('Error rejecting claim');
      console.error('Reject error:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTicketNumber = (number) => {
    return number || '';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading claim approvals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Claim Approvals Dashboard"
          icon={CheckCircleIcon}
        />

        {/* Date Filters - Collapsible */}
        <ModernCard variant="glass" className="mb-4 sm:mb-6 animate-fade-in">
          <div className="p-3 sm:p-6">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-100 to-accent-100">
                  <FunnelIcon className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
                </div>
                <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Date Filters</h3>
              </div>
              <button 
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label={filtersExpanded ? "Collapse filters" : "Expand filters"}
              >
                {filtersExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                )}
              </button>
            </div>
            
            {filtersExpanded && (
              <div className="flex flex-col space-y-3 lg:flex-row lg:items-end lg:space-y-0 lg:space-x-4 mt-4 sm:mt-6 animate-fade-in">
                {/* Start Date */}
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilters.startDate}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilters.endDate}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setDateFilters({ startDate: getCurrentDatePH(), endDate: getCurrentDatePH() })}
                    className="!py-2.5"
                  >
                    Today
                  </ModernButton>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const end = getCurrentDatePH();
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      setDateFilters({ 
                        startDate: start.toISOString().split('T')[0], 
                        endDate: end 
                      });
                    }}
                    className="!py-2.5"
                  >
                    Last 7 Days
                  </ModernButton>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const end = getCurrentDatePH();
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      setDateFilters({ 
                        startDate: start.toISOString().split('T')[0], 
                        endDate: end 
                      });
                    }}
                    className="!py-2.5"
                  >
                    Last 30 Days
                  </ModernButton>
                  {(dateFilters.startDate || dateFilters.endDate !== getCurrentDatePH()) && (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateFilters({ startDate: '', endDate: getCurrentDatePH() })}
                      icon={XMarkIcon}
                      className="!py-2.5"
                    >
                      Clear
                    </ModernButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Modern Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={ClockIcon}
              color="warning"
              trend="⏳ Awaiting Review"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircleIcon}
              color="success"
              trend="✅ Processed"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={XCircleIcon}
              color="danger"
              trend="❌ Declined"
            />
            <StatCard
              title="Avg Time"
              value={`${stats.averageApprovalTimeHours.toFixed(1)}h`}
              icon={DocumentTextIcon}
              color="primary"
              trend="⏱️ Processing Time"
            />
          </div>
        )}

        {/* Modern Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
          <ModernButton
            onClick={() => setActiveTab('pending')}
            variant={activeTab === 'pending' ? 'primary' : 'secondary'}
            size="md"
            className="flex-1 sm:flex-none justify-center"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Pending Claims ({pendingClaims.length})
          </ModernButton>
          <ModernButton
            onClick={() => setActiveTab('history')}
            variant={activeTab === 'history' ? 'primary' : 'secondary'}
            size="md"
            className="flex-1 sm:flex-none justify-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Approval History
          </ModernButton>
        </div>

        {/* Pending Claims Tab */}
        {activeTab === 'pending' && (
          <ModernCard className="overflow-hidden">
            {pendingClaims.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-6xl mb-6">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Winning Ticket Claims</h3>
                <p className="text-gray-600 mb-2">All winning ticket claims have been processed!</p>
                <div className="text-xs text-gray-500 mt-4 max-w-md mx-auto bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold mb-1">ℹ️ What appears here:</p>
                  <p>• Validated tickets (status: validated)</p>
                  <p>• With matching winning numbers from draw results</p>
                  <p>• Claimed by agents and awaiting admin approval</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">🏆 Winning Tickets - Pending Claim Approval</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pendingClaims.length} winning tickets awaiting claim approval from agents
                  </p>
                </div>
              
                <div className="divide-y divide-gray-200">
                  {pendingClaims.map((claim, index) => (
                    <div key={claim.id} className={`p-4 sm:p-6 transition-colors hover:bg-gray-50 ${
                      claim.daysPending > 2 ? 'bg-red-50 border-l-4 border-red-400' : ''
                    }`}>
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 items-start lg:items-center">
                        {/* Ticket Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrophyIcon className="h-5 w-5 text-yellow-500" />
                            <div className="font-bold text-lg text-gray-900">
                              {formatTicketNumber(claim.ticketNumber)}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {claim.user?.fullName || claim.user?.username}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {formatCurrency(claim.totalAmount)}
                          </div>
                          {claim.draw?.winningNumber && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center w-fit">
                              🎯 Winning #: {claim.draw.winningNumber}
                            </div>
                          )}
                        </div>

                        {/* Agent Who Claimed */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 mb-1">CLAIMED BY:</div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {claim.user?.fullName || claim.user?.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                @{claim.user?.username}
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-block mt-1">
                                {claim.user?.role?.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>
                          </div>
                          {claim.user?.email && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              ✉️ {claim.user.email}
                            </div>
                          )}
                          {claim.user?.phone && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              📞 {claim.user.phone}
                            </div>
                          )}
                        </div>

                        {/* Prize & Timing */}
                        <div className="space-y-2">
                          <div className="text-xl font-bold text-red-600">
                            {formatCurrency(calculateActualPrizeAmount(claim))}
                          </div>
                          <div className="text-sm text-gray-600">
                            🕒 {formatDate(claim?.approvalRequestedAt || claim?.createdAt)}
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            ⏱️ Status: {claim.status}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 lg:justify-end">
                          <ModernButton
                            onClick={() => setSelectedClaim(claim)}
                            variant="success"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Review
                          </ModernButton>
                          <ModernButton
                            onClick={() => handleReject(claim.id)}
                            variant="danger"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </ModernButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ModernCard>
        )}

        {/* Approval History Tab */}
        {activeTab === 'history' && (
          <ModernCard className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Approval History</h3>
              <p className="text-sm text-gray-600 mt-1">Complete audit trail of all approval actions</p>
            </div>
            <div className="overflow-x-auto">
              <ModernTable
                headers={[
                  { key: 'date', label: 'Date' },
                  { key: 'ticket', label: 'Ticket' },
                  { key: 'claimer', label: 'Claimer' },
                  { key: 'action', label: 'Action' },
                  { key: 'by', label: 'By' },
                  { key: 'amount', label: 'Amount' }
                ]}
                data={approvalHistory.map((record) => ({
                  date: formatDate(record.createdAt),
                  ticket: formatTicketNumber(record.ticket?.ticketNumber),
                  claimer: record.ticket?.claimerName,
                  action: (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.action.toUpperCase()}
                    </span>
                  ),
                  by: record.performedByUser?.fullName || record.performedByUser?.username,
                  amount: formatCurrency(record.ticket?.prizeAmount || 0)
                }))}
                emptyMessage="No approval history found"
              />
            </div>
          </ModernCard>
        )}

        {/* Modern Approval Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModernCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  Review Winning Ticket Claim
                </h3>
                <p className="text-sm text-gray-600 mt-1">Verify winning ticket details and approve or reject the claim</p>
              </div>
              <div className="p-6 space-y-6">

                {/* Draw Winning Number - Prominent Display */}
                {selectedClaim.draw?.winningNumber && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 text-center">
                    <div className="text-sm font-medium text-green-700 mb-2">🎯 Draw Winning Number</div>
                    <div className="text-4xl font-bold text-green-600 font-mono tracking-wider">
                      {selectedClaim.draw.winningNumber}
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      {selectedClaim.draw.drawDate ? new Date(selectedClaim.draw.drawDate).toLocaleDateString() : ''} - {selectedClaim.draw.drawTime}
                    </div>
                  </div>
                )}

                {/* Agent Information - Who Claimed the Ticket */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">Agent Who Claimed This Winning Ticket</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">{selectedClaim.user?.fullName || selectedClaim.user?.username}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="text-xs text-gray-600">@{selectedClaim.user?.username}</div>
                        <span className="text-gray-400">•</span>
                        <div className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-semibold">
                          {selectedClaim.user?.role?.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2">
                        {selectedClaim.user?.email && (
                          <div className="text-xs text-gray-700 flex items-center gap-1">
                            ✉️ {selectedClaim.user.email}
                          </div>
                        )}
                        {selectedClaim.user?.phone && (
                          <div className="text-xs text-gray-700 flex items-center gap-1">
                            📞 {selectedClaim.user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Number</label>
                      <div className="font-mono text-lg font-bold text-gray-900">{selectedClaim.ticketNumber}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Prize Amount</label>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculateActualPrizeAmount(selectedClaim))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Created</label>
                      <div className="text-sm text-gray-900">{formatDate(selectedClaim?.createdAt)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Bet Amount</label>
                      <div className="text-gray-900">{formatCurrency(selectedClaim.totalAmount)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏆 Winning Combinations & Bet Types</label>
                    {(() => {
                      // Get winning number from draw (primary) or drawResult (fallback)
                      const winningNumber = selectedClaim.draw?.winningNumber || selectedClaim.draw?.drawResult?.winningNumber;
                      const winningNumbers = winningNumber ? [winningNumber] : [];
                      
                      const winningBets = selectedClaim.bets?.filter(bet => {
                        const isWinning = checkIfBetIsWinning(bet.betCombination, bet.betType, winningNumbers);
                        return isWinning;
                      }) || [];

                      if (winningBets.length === 0) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="text-amber-700 text-sm">
                              ⚠️ No winning combinations detected. Please verify the draw result and ticket bets.
                            </div>
                          </div>
                        );
                      }

                      return winningBets.map((bet, index) => {
                        const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
                        const betType = (bet.betType || 'standard').toLowerCase();
                        const multiplier = betType === 'rambolito' ? 75 : 450;
                        const betPrize = betAmount * multiplier;
                        
                        return (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold">{bet.betType}: {bet.betCombination}</div>
                                <div className="text-xs text-green-600 font-medium">✅ WINNING BET</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-600">₱{betAmount} × {multiplier}x</div>
                                <div className="text-lg font-bold text-red-600">₱{betPrize.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Approval Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prize Amount (Optional - will use calculated amount if empty)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      placeholder={calculateActualPrizeAmount(selectedClaim)?.toString() || '0.00'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Notes
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Enter any notes about this approval..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <ModernButton
                    onClick={() => setSelectedClaim(null)}
                    variant="secondary"
                    size="md"
                    className="order-3 sm:order-1"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    onClick={() => handleReject(selectedClaim.id, 'Rejected after review')}
                    variant="danger"
                    size="md"
                    className="order-2"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </ModernButton>
                  <ModernButton
                    onClick={() => handleApprove(selectedClaim.id)}
                    variant="success"
                    size="md"
                    className="order-1 sm:order-3"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimApprovals;
