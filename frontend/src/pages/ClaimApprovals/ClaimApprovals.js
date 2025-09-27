import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadPendingClaims(),
        loadApprovalHistory(),
        loadStats()
      ]);
      setLoading(false);
    };

    loadData();
  }, [loadPendingClaims, loadApprovalHistory, loadStats]);

  const handleApprove = async (ticketId) => {
    try {
      const response = await api.post(`/claim-approvals/${ticketId}/approve`, {
        notes: approvalNotes,
        prizeAmount: prizeAmount ? parseFloat(prizeAmount) : null
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
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>
          ✅ Claim Approvals Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Review and approve winning ticket claims from agents
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #f59e0b'
          }}>
            <h3 style={{ color: '#92400e', marginBottom: '10px' }}>⏳ Pending</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
              {stats.pending}
            </div>
          </div>

          <div style={{
            backgroundColor: '#d1fae5',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #10b981'
          }}>
            <h3 style={{ color: '#065f46', marginBottom: '10px' }}>✅ Approved</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
              {stats.approved}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fecaca',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #ef4444'
          }}>
            <h3 style={{ color: '#991b1b', marginBottom: '10px' }}>❌ Rejected</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
              {stats.rejected}
            </div>
          </div>

          <div style={{
            backgroundColor: '#dbeafe',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #3b82f6'
          }}>
            <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>⏱️ Avg Time</h3>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
              {stats.averageApprovalTimeHours.toFixed(1)}h
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            backgroundColor: activeTab === 'pending' ? '#dc2626' : '#f3f4f6',
            color: activeTab === 'pending' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ⏳ Pending Claims ({pendingClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'history' ? '#dc2626' : '#f3f4f6',
            color: activeTab === 'history' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📋 Approval History
        </button>
      </div>

      {/* Pending Claims Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingClaims.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px',
              backgroundColor: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
              <h3 style={{ color: '#374151', marginBottom: '10px' }}>No Pending Claims</h3>
              <p style={{ color: '#6b7280' }}>All claims have been processed!</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '20px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{ color: '#374151', margin: 0 }}>Pending Claim Requests</h3>
              </div>
              
              {pendingClaims.map((claim, index) => (
                <div key={claim.id} style={{
                  padding: '20px',
                  borderBottom: index < pendingClaims.length - 1 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: claim.daysPending > 2 ? '#fef2f2' : 'white'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Ticket Info */}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '5px' }}>
                        {formatTicketNumber(claim.ticketNumber)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Agent: {claim.user?.fullName || claim.user?.username}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Total: {formatCurrency(claim.totalAmount)}
                      </div>
                    </div>

                    {/* Claimer Info */}
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                        {claim.claimerName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {claim.claimerPhone}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {claim.claimerAddress}
                      </div>
                    </div>

                    {/* Prize & Timing */}
                    <div>
                      <div style={{ 
                        fontWeight: '700', 
                        fontSize: '18px', 
                        color: '#dc2626',
                        marginBottom: '5px'
                      }}>
                        {formatCurrency(claim.calculatedPrizeAmount)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Requested: {formatDate(claim.approvalRequestedAt)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: claim.daysPending > 2 ? '#dc2626' : '#6b7280',
                        fontWeight: claim.daysPending > 2 ? '600' : 'normal'
                      }}>
                        {claim.daysPending} days pending
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ✅ Review
                      </button>
                      <button
                        onClick={() => handleReject(claim.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval History Tab */}
      {activeTab === 'history' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: 0 }}>Recent Approval History</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Ticket</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Claimer</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>By</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {approvalHistory.map((record, index) => (
                  <tr key={record.id} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                      {formatDate(record.createdAt)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600' }}>
                        {formatTicketNumber(record.ticket?.ticketNumber)}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {record.ticket?.claimerName}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: record.action === 'approved' ? '#d1fae5' : '#fecaca',
                        color: record.action === 'approved' ? '#065f46' : '#991b1b'
                      }}>
                        {record.action.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                      {record.performedByUser?.fullName || record.performedByUser?.username}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {formatCurrency(record.ticket?.prizeAmount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedClaim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#374151' }}>
              Review Claim Request
            </h3>

            {/* Claim Details */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Ticket Number:</strong><br />
                  {formatTicketNumber(selectedClaim.ticketNumber)}
                </div>
                <div>
                  <strong>Agent:</strong><br />
                  {selectedClaim.user?.fullName || selectedClaim.user?.username}
                </div>
                <div>
                  <strong>Claimer:</strong><br />
                  {selectedClaim.claimerName}
                </div>
                <div>
                  <strong>Phone:</strong><br />
                  {selectedClaim.claimerPhone}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Address:</strong><br />
                  {selectedClaim.claimerAddress}
                </div>
                <div>
                  <strong>Calculated Prize:</strong><br />
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                    {formatCurrency(selectedClaim.calculatedPrizeAmount)}
                  </span>
                </div>
                <div>
                  <strong>Requested:</strong><br />
                  {formatDate(selectedClaim.approvalRequestedAt)}
                </div>
              </div>
            </div>

            {/* Approval Form */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Prize Amount (Optional - will use calculated amount if empty):
              </label>
              <input
                type="number"
                step="0.01"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                placeholder={selectedClaim.calculatedPrizeAmount.toString()}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Approval Notes:
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Enter any notes about this approval..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedClaim(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedClaim.id, 'Rejected after review')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleApprove(selectedClaim.id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimApprovals;
