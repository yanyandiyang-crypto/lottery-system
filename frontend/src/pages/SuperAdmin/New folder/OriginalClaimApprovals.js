import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
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

  const loadPendingClaims = useCallback(async () => {
    try {
      const response = await api.get('/claim-approvals/pending');
      
      if (response.data.success) {
        setPendingClaims(response.data.claims);
      } else {
        setError(response.data.message || 'Error loading pending claims');
      }
    } catch (err) {
      setError('Error loading pending claims');
      console.error('Pending claims error:', err);
    }
  }, []);

  const loadApprovalHistory = useCallback(async () => {
    try {
      const response = await api.get('/claim-approvals/history?limit=50');
      
      if (response.data.success) {
        setApprovalHistory(response.data.history);
      }
    } catch (err) {
      console.error('History error:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/claim-approvals/stats');
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Stats error:', err);
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
    
    // Get winning numbers from DrawResult table
    const winningNumbers = ticket.draw?.drawResult?.winningNumber ? 
                          [ticket.draw.drawResult.winningNumber] : 
                          [];

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Claim Approvals Dashboard"
          subtitle="Review and approve winning ticket claims from agents"
          icon={CheckCircleIcon}
        />

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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Claims</h3>
                <p className="text-gray-600">All claims have been processed!</p>
              </div>
            ) : (
              <div>
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Claim Requests</h3>
                  <p className="text-sm text-gray-600 mt-1">{pendingClaims.length} claims awaiting review</p>
                </div>
              
                <div className="divide-y divide-gray-200">
                  {pendingClaims.map((claim, index) => (
                    <div key={claim.id} className={`p-4 sm:p-6 transition-colors hover:bg-gray-50 ${
                      claim.daysPending > 2 ? 'bg-red-50 border-l-4 border-red-400' : ''
                    }`}>
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 items-start lg:items-center">
                        {/* Ticket Info */}
                        <div className="space-y-2">
                          <div className="font-bold text-lg text-gray-900">
                            {formatTicketNumber(claim.ticketNumber)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {claim.user?.fullName || claim.user?.username}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {formatCurrency(claim.totalAmount)}
                          </div>
                        </div>

                        {/* Claimer Info */}
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900">
                            {claim.claimerName}
                          </div>
                          <div className="text-sm text-gray-600">
                            📞 {claim.claimerPhone}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            📍 {claim.claimerAddress}
                          </div>
                        </div>

                        {/* Prize & Timing */}
                        <div className="space-y-2">
                          <div className="text-xl font-bold text-red-600">
                            {formatCurrency(calculateActualPrizeAmount(claim))}
                          </div>
                          <div className="text-sm text-gray-600">
                            🕒 {formatDate(claim?.approvalRequestedAt || claim?.createdAt)}
                          </div>
                          <div className={`text-xs font-medium ${
                            (claim?.daysPending || 0) > 2 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            ⏱️ {claim?.daysPending || 0} days pending
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
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
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
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Review Claim Request</h3>
                <p className="text-sm text-gray-600 mt-1">Verify claim details and approve or reject</p>
              </div>
              <div className="p-6 space-y-6">

                {/* Claim Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                      <div className="text-gray-900">{selectedClaim.user?.fullName || selectedClaim.user?.username}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Number</label>
                      <div className="font-mono text-gray-900">{selectedClaim.ticketNumber}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Claim Time</label>
                      <div className="text-gray-900">{formatDate(selectedClaim?.approvalRequestedAt || selectedClaim?.createdAt)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount</label>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(calculateActualPrizeAmount(selectedClaim))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Winning Combinations & Bet Types</label>
                    {(() => {
                      const winningNumbers = selectedClaim.draw?.drawResult?.winningNumber ? 
                                            [selectedClaim.draw.drawResult.winningNumber] : 
                                            [];
                      
                      const winningBets = selectedClaim.bets?.filter(bet => {
                        const isWinning = checkIfBetIsWinning(bet.betCombination, bet.betType, winningNumbers);
                        return isWinning;
                      }) || [];

                      if (winningBets.length === 0) {
                        return <div className="text-gray-500 italic">No winning combinations found</div>;
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
