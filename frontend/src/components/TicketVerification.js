import React, { useState } from 'react';
import { QrScanner } from 'react-qr-scanner';

const TicketVerification = () => {
  const [verificationMode, setVerificationMode] = useState('search'); // 'search' or 'scan'
  const [ticketNumber, setTicketNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Verify ticket by number
  const verifyByTicketNumber = async () => {
    if (!ticketNumber.trim()) {
      setError('Please enter a ticket number');
      return;
    }

    // Clean ticket number (remove spaces)
    const cleanTicketNumber = ticketNumber.replace(/\s/g, '');
    
    // Validate format (17 digits)
    if (!/^\d{17}$/.test(cleanTicketNumber)) {
      setError('Invalid ticket number format. Must be 17 digits.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/v1/tickets/search/${cleanTicketNumber}`);
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult(data.ticket);
      } else {
        setError(data.message || 'Ticket not found');
        setVerificationResult(null);
      }
    } catch (err) {
      setError('Error searching for ticket. Please try again.');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Verify ticket by QR code
  const verifyByQRCode = async (qrData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/tickets/verify-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult(data.ticket);
        setShowCamera(false);
      } else {
        setError(data.message || 'QR code verification failed');
        setVerificationResult(null);
      }
    } catch (err) {
      setError('Error verifying QR code. Please try again.');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle QR scan result
  const handleQRScan = (result, error) => {
    if (result) {
      const scannedData = result?.text || result;
      verifyByQRCode(scannedData);
    }
    
    if (error) {
      console.log('QR Scan Error:', error);
    }
  };

  // No formatting - display ticket number as-is (no spaces)
  const formatTicketNumber = (number) => {
    return number; // Return without spacing
  };

  // Handle ticket number input with auto-formatting
  const handleTicketNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 17) {
      setTicketNumber(value);
    }
  };

  // Claim ticket (automatic agent information)
  const claimTicket = async () => {
    if (!verificationResult || !verificationResult.isWinning || verificationResult.isClaimed) {
      return;
    }

    // Confirm claim with agent information
    const confirmMessage = `Claim this winning ticket?\n\nAgent: ${verificationResult.agent.name}\nTicket: ${verificationResult.ticketNumber}\n\nAgent information will be used automatically.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/tickets/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: verificationResult.ticketNumber
          // No claimer information needed - automatic agent info
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Claim submitted successfully!\n\n${data.message}\n\nAgent: ${data.ticket.agent.name}`);
        setVerificationResult({
          ...verificationResult,
          isClaimed: true,
          status: 'pending_approval'
        });
      } else {
        alert(`❌ ${data.message || 'Failed to claim ticket'}`);
      }
    } catch (err) {
      alert('❌ Error claiming ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-verification" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🎫 Ticket Verification & Claiming</h2>
      
      {/* Mode Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={() => {
            setVerificationMode('search');
            setShowCamera(false);
            setError('');
            setVerificationResult(null);
          }}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: verificationMode === 'search' ? '#007bff' : '#f8f9fa',
            color: verificationMode === 'search' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔍 Search by Number
        </button>
        <button
          onClick={() => {
            setVerificationMode('scan');
            setShowCamera(true);
            setError('');
            setVerificationResult(null);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: verificationMode === 'scan' ? '#007bff' : '#f8f9fa',
            color: verificationMode === 'scan' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📱 Scan QR Code
        </button>
      </div>

      {/* Search by Ticket Number */}
      {verificationMode === 'search' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Ticket Number (17 digits):
            </label>
            <input
              type="text"
              value={formatTicketNumber(ticketNumber)}
              onChange={handleTicketNumberChange}
              placeholder="17588678923527981"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
              maxLength={17} // 17 digits only
            />
          </div>
          <button
            onClick={verifyByTicketNumber}
            disabled={loading || ticketNumber.length < 17}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Searching...' : 'Search Ticket'}
          </button>
        </div>
      )}

      {/* QR Code Scanner */}
      {verificationMode === 'scan' && showCamera && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            border: '2px solid #ddd', 
            borderRadius: '10px', 
            overflow: 'hidden',
            backgroundColor: '#f8f9fa'
          }}>
            <QrScanner
              onDecode={handleQRScan}
              style={{ width: '100%' }}
              constraints={{
                facingMode: 'environment' // Use back camera
              }}
            />
          </div>
          <button
            onClick={() => setShowCamera(false)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            Stop Camera
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div style={{
          border: '2px solid #28a745',
          borderRadius: '10px',
          padding: '20px',
          backgroundColor: '#f8fff9'
        }}>
          <h3 style={{ color: '#28a745', marginBottom: '15px' }}>✅ Ticket Found!</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Ticket Number:</strong> {formatTicketNumber(verificationResult.ticketNumber)}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Total Amount:</strong> ₱{verificationResult.totalAmount.toFixed(2)}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Draw Date:</strong> {new Date(verificationResult.drawDate).toLocaleDateString()} at {verificationResult.drawTime}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Agent:</strong> {verificationResult.agent.name}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Bets:</strong>
            <ul style={{ marginTop: '5px' }}>
              {verificationResult.bets.map((bet, index) => (
                <li key={index}>
                  {bet.betCombination} ({bet.betType}) - ₱{bet.betAmount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>

          {/* Winning Status */}
          {verificationResult.isWinning ? (
            <div style={{
              padding: '15px',
              backgroundColor: verificationResult.isClaimed ? '#fff3cd' : '#d1ecf1',
              border: `1px solid ${verificationResult.isClaimed ? '#ffeaa7' : '#bee5eb'}`,
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <h4 style={{ 
                color: verificationResult.isClaimed ? '#856404' : '#0c5460',
                marginBottom: '10px' 
              }}>
                {verificationResult.isClaimed ? '🏆 Already Claimed' : '🎉 WINNING TICKET!'}
              </h4>
              <div><strong>Win Amount:</strong> ₱{verificationResult.winAmount.toFixed(2)}</div>
              {verificationResult.isClaimed && (
                <div style={{ marginTop: '5px', fontSize: '14px' }}>
                  This ticket has already been claimed.
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <div>📋 This ticket is not a winner.</div>
            </div>
          )}

          {/* Claim Button */}
          {verificationResult.isWinning && !verificationResult.isClaimed && (
            <button
              onClick={claimTicket}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : '🏆 Claim This Ticket'}
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>📋 Instructions:</h4>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li><strong>Search by Number:</strong> Enter the 17-digit ticket number to verify</li>
          <li><strong>Scan QR Code:</strong> Use your camera to scan the QR code on the ticket</li>
          <li><strong>Claiming:</strong> Winning tickets use agent information automatically</li>
          <li><strong>Security:</strong> QR codes contain encrypted verification data</li>
        </ul>
      </div>
    </div>
  );
};

export default TicketVerification;
