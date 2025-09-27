import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const TicketSearch = () => {
  const [searchMode, setSearchMode] = useState('number'); // 'number' or 'qr'
  const [ticketNumber, setTicketNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  // Search ticket by number
  const searchByTicketNumber = async () => {
    if (!ticketNumber.trim()) {
      setError('Please enter a ticket number');
      return;
    }

    const cleanTicketNumber = ticketNumber.replace(/\s/g, '');
    
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
        setSearchResult(data.ticket);
      } else {
        setError(data.message || 'Ticket not found');
        setSearchResult(null);
      }
    } catch (err) {
      setError('Error searching for ticket. Please try again.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Search ticket by QR code
  const searchByQRCode = async (qrData) => {
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
        setSearchResult(data.ticket);
        setShowCamera(false);
      } else {
        setError(data.message || 'QR code verification failed');
        setSearchResult(null);
      }
    } catch (err) {
      setError('Error verifying QR code. Please try again.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle QR scan result
  const handleQRScan = (result, error) => {
    if (result) {
      const scannedData = result?.text || result;
      searchByQRCode(scannedData);
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
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 17) {
      setTicketNumber(value);
    }
  };

  return (
    <div className="ticket-search" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2563eb', marginBottom: '10px' }}>🔍 Ticket Search & Verification</h2>
        <p style={{ color: '#6b7280' }}>Search for tickets by number or scan QR code to verify details</p>
      </div>
      
      {/* Search Mode Selection */}
      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <button
          onClick={() => {
            setSearchMode('number');
            setShowCamera(false);
            setError('');
            setSearchResult(null);
          }}
          style={{
            padding: '12px 24px',
            marginRight: '15px',
            backgroundColor: searchMode === 'number' ? '#2563eb' : '#f3f4f6',
            color: searchMode === 'number' ? 'white' : '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          🔢 Search by Number
        </button>
        <button
          onClick={() => {
            setSearchMode('qr');
            setShowCamera(true);
            setError('');
            setSearchResult(null);
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: searchMode === 'qr' ? '#2563eb' : '#f3f4f6',
            color: searchMode === 'qr' ? 'white' : '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          📱 Scan QR Code
        </button>
      </div>

      {/* Search by Ticket Number */}
      {searchMode === 'number' && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '25px', 
          borderRadius: '12px', 
          border: '2px solid #e2e8f0',
          marginBottom: '25px' 
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Enter 17-digit Ticket Number:
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
                border: '2px solid #d1d5db',
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
            onClick={searchByTicketNumber}
            disabled={loading || ticketNumber.length < 17}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading || ticketNumber.length < 17 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || ticketNumber.length < 17 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '🔍 Searching...' : '🔍 Search Ticket'}
          </button>
        </div>
      )}

      {/* QR Code Scanner */}
      {searchMode === 'qr' && showCamera && (
        <div style={{ marginBottom: '25px' }}>
          <div style={{ 
            border: '3px solid #2563eb', 
            borderRadius: '15px', 
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            position: 'relative'
          }}>
            <div style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '10px',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              📱 Point camera at QR code
            </div>
            <QrReader
              onResult={handleQRScan}
              style={{ width: '100%' }}
              constraints={{
                facingMode: 'environment'
              }}
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

      {/* Search Result */}
      {searchResult && (
        <div style={{
          border: '3px solid #10b981',
          borderRadius: '15px',
          padding: '25px',
          backgroundColor: '#f0fdf4'
        }}>
          <h3 style={{ color: '#059669', marginBottom: '20px', textAlign: 'center' }}>
            ✅ Ticket Details Found
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
              <strong style={{ color: '#374151' }}>Ticket Number:</strong>
              <div style={{ fontSize: '18px', fontFamily: 'monospace', color: '#059669', fontWeight: '600' }}>
                {formatTicketNumber(searchResult.ticketNumber)}
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
              <strong style={{ color: '#374151' }}>Total Amount:</strong>
              <div style={{ fontSize: '18px', color: '#059669', fontWeight: '600' }}>
                ₱{searchResult.totalAmount.toFixed(2)}
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
              <strong style={{ color: '#374151' }}>Draw Date:</strong>
              <div style={{ fontSize: '16px', color: '#374151' }}>
                {new Date(searchResult.drawDate).toLocaleDateString()} at {searchResult.drawTime}
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
              <strong style={{ color: '#374151' }}>Agent:</strong>
              <div style={{ fontSize: '16px', color: '#374151' }}>
                {searchResult.agent.name}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #d1fae5' }}>
            <strong style={{ color: '#374151', marginBottom: '10px', display: 'block' }}>Bets:</strong>
            <div style={{ display: 'grid', gap: '10px' }}>
              {searchResult.bets.map((bet, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    {bet.betCombination} ({bet.betType})
                  </span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>
                    ₱{bet.betAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Display */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: searchResult.isWinning ? '#dbeafe' : '#f3f4f6',
            border: `2px solid ${searchResult.isWinning ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            {searchResult.isWinning ? (
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1d4ed8', marginBottom: '5px' }}>
                  🏆 WINNING TICKET!
                </div>
                <div style={{ color: '#1e40af' }}>
                  Status: {searchResult.isClaimed ? 'Already Claimed' : 'Ready to Claim'}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '16px', color: '#6b7280' }}>
                📋 This ticket is not a winner
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ color: '#374151', marginBottom: '15px' }}>📋 How to Use:</h4>
        <ul style={{ color: '#6b7280', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li><strong>Search by Number:</strong> Enter the 17-digit ticket number to view details</li>
          <li><strong>Scan QR Code:</strong> Use your camera to scan the QR code on the ticket</li>
          <li><strong>Verification:</strong> System will show complete ticket information and status</li>
          <li><strong>Winning Status:</strong> Displays if ticket won and claiming eligibility</li>
        </ul>
      </div>
    </div>
  );
};

export default TicketSearch;
