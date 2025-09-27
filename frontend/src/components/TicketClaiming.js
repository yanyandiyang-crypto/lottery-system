import React, { useState } from 'react';
import { QrScanner } from 'react-qr-scanner';
import { ticketsAPI } from '../utils/api';

const TicketClaiming = () => {
  const [claimMode, setClaimMode] = useState('number'); // 'number' or 'qr'
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [claimStep, setClaimStep] = useState('verify'); // 'verify', 'success'

  // Verify ticket for claiming
  const verifyTicketForClaiming = async (ticketNum, qrData = null) => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      if (qrData) {
        response = await ticketsAPI.verifyQR(qrData);
      } else {
        response = await ticketsAPI.searchTicket(ticketNum);
      }
      
      const data = response.data;
      
      if (data.success) {
        const ticket = data.data.ticket;
        setTicketData(ticket);
        if (ticket.isWinning && !ticket.isClaimed) {
          setClaimStep('details');
        } else if (ticket.isClaimed) {
          setError('This ticket has already been claimed.');
        } else {
          setError('This ticket is not a winning ticket.');
        }
        setShowCamera(false);
      } else {
        setError(data.message || 'Ticket not found');
        setTicketData(null);
      }
    } catch (err) {
      setError('Error verifying ticket. Please try again.');
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  // Verify by ticket number
  const verifyByNumber = async () => {
    if (!ticketNumber.trim()) {
      setError('Please enter a ticket number');
      return;
    }

    const cleanTicketNumber = ticketNumber.replace(/\s/g, '');
    
    if (!/^\d{17}$/.test(cleanTicketNumber)) {
      setError('Invalid ticket number format. Must be 17 digits.');
      return;
    }

    await verifyTicketForClaiming(cleanTicketNumber);
  };

  // Handle QR scan result
  const handleQRScan = (result, error) => {
    if (result) {
      const scannedData = result?.text || result;
      verifyTicketForClaiming(null, scannedData);
    }
    
    if (error) {
      console.log('QR Scan Error:', error);
    }
  };

  // Submit claim automatically after verification
  const submitClaim = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await ticketsAPI.claimTicket({
        ticketNumber: ticketData.ticketNumber,
        // Auto-filled with agent info - no manual input needed
        claimerName: 'Agent Claim',
        claimerPhone: '',
        claimerAddress: ''
      });
      
      const data = response.data;
      
      if (data.success) {
        setClaimStep('success');
      } else {
        setError(data.message || 'Failed to claim ticket');
      }
    } catch (err) {
      setError('Error claiming ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // No formatting - display ticket number as-is (no spaces)
  const formatTicketNumber = (number) => {
    return number; // Return without spacing
  };

  // Handle ticket number input
  const handleTicketNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 17) {
      setTicketNumber(value);
    }
  };

  // Reset form
  const resetForm = () => {
    setTicketNumber('');
    setTicketData(null);
    setClaimStep('verify');
    setError('');
    setShowCamera(false);
  };

  return (
    <div className="ticket-claiming" style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>🏆 Prize Claiming System</h2>
        <p style={{ color: '#6b7280' }}>Claim your winning lottery tickets securely</p>
      </div>

      {/* Step Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px',
        gap: '20px'
      }}>
        <div style={{
          padding: '10px 20px',
          backgroundColor: claimStep === 'verify' ? '#dc2626' : '#e5e7eb',
          color: claimStep === 'verify' ? 'white' : '#6b7280',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          1. Verify Ticket
        </div>
        <div style={{
          padding: '10px 20px',
          backgroundColor: claimStep === 'details' ? '#dc2626' : '#e5e7eb',
          color: claimStep === 'details' ? 'white' : '#6b7280',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          2. Claimer Details
        </div>
        <div style={{
          padding: '10px 20px',
          backgroundColor: claimStep === 'success' ? '#10b981' : '#e5e7eb',
          color: claimStep === 'success' ? 'white' : '#6b7280',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          3. Completed
        </div>
      </div>

      {/* Step 1: Verify Ticket */}
      {claimStep === 'verify' && (
        <>
          {/* Claim Mode Selection */}
          <div style={{ marginBottom: '25px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setClaimMode('number');
                setShowCamera(false);
                setError('');
              }}
              style={{
                padding: '12px 24px',
                marginRight: '15px',
                backgroundColor: claimMode === 'number' ? '#dc2626' : '#f3f4f6',
                color: claimMode === 'number' ? 'white' : '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🔢 Enter Ticket Number
            </button>
            <button
              onClick={() => {
                setClaimMode('qr');
                setShowCamera(true);
                setError('');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: claimMode === 'qr' ? '#dc2626' : '#f3f4f6',
                color: claimMode === 'qr' ? 'white' : '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📱 Scan QR Code
            </button>
          </div>

          {/* Enter Ticket Number */}
          {claimMode === 'number' && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              padding: '25px', 
              borderRadius: '12px', 
              border: '2px solid #fecaca',
              marginBottom: '25px' 
            }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#991b1b'
                }}>
                  Enter Winning Ticket Number:
                </label>
                <input
                  type="text"
                  value={formatTicketNumber(ticketNumber)}
                  onChange={handleTicketNumberChange}
                  placeholder="17588678923527981"
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '18px',
                    border: '2px solid #f87171',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    textAlign: 'center',
                    backgroundColor: 'white'
                  }}
                  maxLength={17}
                />
              </div>
              <button
                onClick={verifyByNumber}
                disabled={loading || ticketNumber.length < 17}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: loading || ticketNumber.length < 17 ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || ticketNumber.length < 17 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '🔍 Verifying...' : '🔍 Verify for Claiming'}
              </button>
            </div>
          )}

          {/* QR Scanner */}
          {claimMode === 'qr' && showCamera && (
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                border: '3px solid #dc2626', 
                borderRadius: '15px', 
                overflow: 'hidden',
                backgroundColor: '#fef2f2'
              }}>
                <div style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  📱 Scan winning ticket QR code
                </div>
                <QrScanner
                  onDecode={handleQRScan}
                  style={{ width: '100%' }}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
              <button
                onClick={() => setShowCamera(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  marginTop: '15px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ❌ Stop Camera
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 2: Claimer Details */}
      {claimStep === 'details' && ticketData && (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '25px',
          borderRadius: '15px',
          border: '2px solid #bbf7d0'
        }}>
          <h3 style={{ color: '#059669', marginBottom: '20px', textAlign: 'center' }}>
            🏆 Winning Ticket Verified!
          </h3>
          
          {/* Ticket Summary */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #d1fae5'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <strong>Ticket:</strong> {formatTicketNumber(ticketData.ticketNumber)}
              </div>
              <div>
                <strong>Amount:</strong> ₱{ticketData.totalAmount.toFixed(2)}
              </div>
            </div>
            {ticketData.agent && (
              <div style={{ 
                backgroundColor: '#f0f9ff', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '15px',
                border: '1px solid #bae6fd'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Agent Information:</h5>
                <div><strong>Name:</strong> {ticketData.agent.name}</div>
                {ticketData.agent.phone && <div><strong>Phone:</strong> {ticketData.agent.phone}</div>}
                {ticketData.agent.address && <div><strong>Address:</strong> {ticketData.agent.address}</div>}
              </div>
            )}
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669', textAlign: 'center' }}>
              🎉 This ticket is eligible for claiming!
            </div>
          </div>

          {/* Quick Claim Confirmation */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', border: '1px solid #d1fae5' }}>
            <h4 style={{ marginBottom: '20px', color: '#374151' }}>🏆 Ready to Claim Prize!</h4>
            
            <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                ✅ This claim will be automatically sent to admin for approval.<br/>
                📋 Admin will review: Agent, Time, Ticket Number, Winning Combination & Bet Type
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setClaimStep('verify')}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={submitClaim}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '15px',
                  backgroundColor: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Submitting Claim...' : '🏆 Claim Prize Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {claimStep === 'success' && (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '40px',
          borderRadius: '15px',
          border: '3px solid #10b981',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h3 style={{ color: '#059669', marginBottom: '15px', fontSize: '24px' }}>
            Claim Submitted Successfully!
          </h3>
          <p style={{ color: '#374151', marginBottom: '25px', fontSize: '16px' }}>
            Your prize claim has been processed. Please keep this confirmation for your records.
          </p>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '10px', 
            marginBottom: '25px',
            border: '1px solid #d1fae5'
          }}>
            <div><strong>Ticket:</strong> {formatTicketNumber(ticketData?.ticketNumber || '')}</div>
            <div><strong>Claimed by:</strong> Agent</div>
            <div><strong>Date:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Status:</strong> Pending Admin Approval</div>
          </div>

          <button
            onClick={resetForm}
            style={{
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🎫 Claim Another Ticket
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '2px solid #fecaca',
          borderRadius: '10px',
          marginBottom: '25px',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#fef7ff',
        borderRadius: '10px',
        border: '1px solid #e9d5ff'
      }}>
        <h4 style={{ color: '#7c3aed', marginBottom: '15px' }}>🏆 Claiming Process:</h4>
        <ol style={{ color: '#6b7280', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li><strong>Verify Ticket:</strong> Enter ticket number or scan QR code</li>
          <li><strong>Check Eligibility:</strong> System confirms if ticket is a winner</li>
          <li><strong>Provide Details:</strong> Enter claimer information</li>
          <li><strong>Submit Claim:</strong> Complete the claiming process</li>
        </ol>
      </div>
    </div>
  );
};

export default TicketClaiming;
