import React, { useState } from 'react';
import { QrScanner } from 'react-qr-scanner';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  XMarkIcon,
  TrophyIcon,
  TicketIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CameraIcon as QrIcon
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <MagnifyingGlassIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Ticket Search & Verification
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Search for tickets by number or scan QR code to verify details and status
          </p>
        </div>
      
        {/* Search Mode Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => {
                setSearchMode('number');
                setShowCamera(false);
                setError('');
                setSearchResult(null);
              }}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                searchMode === 'number'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Search by Number
            </button>
            <button
              onClick={() => {
                setSearchMode('qr');
                setShowCamera(true);
                setError('');
                setSearchResult(null);
              }}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                searchMode === 'qr'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <QrIcon className="w-5 h-5 mr-2" />
              Scan QR Code
            </button>
          </div>

          {/* Search by Ticket Number */}
          {searchMode === 'number' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Enter 17-digit Ticket Number:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatTicketNumber(ticketNumber)}
                  onChange={handleTicketNumberChange}
                  placeholder="17588678923527981"
                  className="w-full px-4 py-4 text-lg font-mono tracking-wider text-center bg-white border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                  maxLength={17}
                />
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
              </div>
              <button
                onClick={searchByTicketNumber}
                disabled={loading || ticketNumber.length < 17}
                className={`w-full mt-4 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                  loading || ticketNumber.length < 17
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                    Search Ticket
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code Scanner */}
          {searchMode === 'qr' && showCamera && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-xl mb-4 text-center font-semibold flex items-center justify-center">
                <CameraIcon className="w-5 h-5 mr-2" />
                Point camera at QR code
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <QrScanner
                  onDecode={handleQRScan}
                  style={{ width: '100%' }}
                  constraints={{
                    facingMode: 'environment'
                  }}
                />
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="w-full mt-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Stop Camera
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Search Result */}
        {searchResult && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Ticket Details Found</h2>
              <p className="text-green-600">Complete ticket information retrieved successfully</p>
            </div>
          
            {/* Ticket Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <TicketIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Ticket Number</span>
                </div>
                <div className="font-mono text-lg font-bold text-gray-900">
                  {formatTicketNumber(searchResult.ticketNumber)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-green-800">Total Amount</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  ₱{searchResult.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-purple-800">Draw Date</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(searchResult.drawDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-600">at {searchResult.drawTime}</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-amber-800">Agent</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {searchResult.agent.name}
                </div>
              </div>
            </div>

            {/* Bets Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TicketIcon className="w-5 h-5 mr-2" />
                Bet Details
              </h3>
              <div className="space-y-3">
                {searchResult.bets.map((bet, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{bet.betCombination}</div>
                      <div className="text-sm text-gray-600">({bet.betType})</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ₱{bet.betAmount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Display */}
            <div className={`p-6 rounded-xl text-center ${
              searchResult.isWinning 
                ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300'
            }`}>
              {searchResult.isWinning ? (
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg mb-4">
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-700 mb-2">
                    WINNING TICKET!
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    searchResult.isClaimed 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      searchResult.isClaimed ? 'bg-gray-400' : 'bg-green-400 animate-pulse'
                    }`}></div>
                    {searchResult.isClaimed ? 'Already Claimed' : 'Ready to Claim'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-300 rounded-full mb-4">
                    <TicketIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-lg font-medium text-gray-600">
                    This ticket is not a winner
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-indigo-800">How to Use</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-indigo-600 font-bold text-sm">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Search by Number</h4>
              <p className="text-sm text-gray-600">Enter 17-digit ticket number</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-indigo-600 font-bold text-sm">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Scan QR Code</h4>
              <p className="text-sm text-gray-600">Use camera to scan QR code</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-indigo-600 font-bold text-sm">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">View Details</h4>
              <p className="text-sm text-gray-600">Complete ticket information</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-indigo-600 font-bold text-sm">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Check Status</h4>
              <p className="text-sm text-gray-600">Winning status & eligibility</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSearch;
