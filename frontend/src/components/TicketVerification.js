import React, { useState } from 'react';
import { QrScanner } from 'react-qr-scanner';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  XMarkIcon,
  TrophyIcon,
  TicketIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CameraIcon as QrIcon
} from '@heroicons/react/24/outline';

const TicketVerification = () => {
  const [verificationMode, setVerificationMode] = useState('search'); // 'search' or 'scan'
  const [ticketNumber, setTicketNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);

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

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraPermission('granted');
      setShowCamera(true);
      // Stop the stream immediately as QrScanner will handle it
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log('Camera permission denied:', error);
      setCameraPermission('denied');
      setError('Camera access is required for QR scanning. Please allow camera permissions in your browser settings.');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Ticket Verification & Claiming
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Verify ticket authenticity and claim prizes securely with our advanced verification system
          </p>
        </div>
      
        {/* Mode Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => {
                setVerificationMode('search');
                setShowCamera(false);
                setError('');
                setVerificationResult(null);
              }}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                verificationMode === 'search'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Search by Number
            </button>
            <button
              onClick={() => {
                setVerificationMode('scan');
                setError('');
                setVerificationResult(null);
                requestCameraPermission();
              }}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                verificationMode === 'scan'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <QrIcon className="w-5 h-5 mr-2" />
              Scan QR Code
            </button>
          </div>

          {/* Search by Ticket Number */}
          {verificationMode === 'search' && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border-2 border-emerald-200">
              <label className="block text-sm font-semibold text-emerald-800 mb-3">
                Ticket Number (17 digits):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatTicketNumber(ticketNumber)}
                  onChange={handleTicketNumberChange}
                  placeholder="17588678923527981"
                  className="w-full px-4 py-4 text-lg font-mono tracking-wider text-center bg-white border-2 border-emerald-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
                  maxLength={17}
                />
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
              </div>
              <button
                onClick={verifyByTicketNumber}
                disabled={loading || ticketNumber.length < 17}
                className={`w-full mt-4 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                  loading || ticketNumber.length < 17
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg'
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

          {/* Camera Permission Status */}
          {verificationMode === 'scan' && cameraPermission === 'denied' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start">
                <CameraIcon className="w-6 h-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
                  <p className="text-red-700 mb-4">
                    To scan QR codes, please allow camera access in your browser. Click the camera icon in your address bar or check your browser settings.
                  </p>
                  <button 
                    onClick={requestCameraPermission}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    <CameraIcon className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Scanner */}
          {verificationMode === 'scan' && showCamera && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-200">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-xl mb-4 text-center font-semibold flex items-center justify-center">
                <CameraIcon className="w-5 h-5 mr-2" />
                Point camera at ticket QR code
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-900">
                <QrScanner
                  onDecode={handleQRScan}
                  onError={(error) => {
                    console.log('QR Scanner Error:', error);
                    setError('Camera access denied or not available. Please allow camera permissions.');
                  }}
                  style={{ width: '100%', height: '300px' }}
                  constraints={{
                    facingMode: 'environment',
                    video: {
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }
                  }}
                  videoStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
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

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Ticket Found!</h2>
              <p className="text-green-600">Ticket verification completed successfully</p>
            </div>
          
            {/* Ticket Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <TicketIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Ticket Number</span>
                </div>
                <div className="font-mono text-lg font-bold text-gray-900">
                  {formatTicketNumber(verificationResult.ticketNumber)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-green-800">Total Amount</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  ₱{verificationResult.totalAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center mb-2">
                  <ClockIcon className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">Draw Date</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(verificationResult.drawDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-600">at {verificationResult.drawTime}</div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-amber-800">Agent</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {verificationResult.agent.name}
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
                {verificationResult.bets.map((bet, index) => (
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

            {/* Winning Status */}
            <div className={`p-6 rounded-xl text-center mb-6 ${
              verificationResult.isWinning 
                ? verificationResult.isClaimed
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300'
            }`}>
              {verificationResult.isWinning ? (
                <div>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg mb-4 ${
                    verificationResult.isClaimed 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                      : 'bg-gradient-to-br from-green-400 to-emerald-500'
                  }`}>
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`text-2xl font-bold mb-2 ${
                    verificationResult.isClaimed ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {verificationResult.isClaimed ? 'ALREADY CLAIMED' : 'WINNING TICKET!'}
                  </div>
                  <div className="text-lg font-semibold text-gray-800 mb-3">
                    Win Amount: ₱{verificationResult.winAmount.toFixed(2)}
                  </div>
                  {verificationResult.isClaimed ? (
                    <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      This ticket has already been claimed
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Ready to claim prize
                    </div>
                  )}
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

            {/* Claim Button */}
            {verificationResult.isWinning && !verificationResult.isClaimed && (
              <button
                onClick={claimTicket}
                disabled={loading}
                className={`w-full px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <TrophyIcon className="w-5 h-5 mr-2" />
                    Claim This Ticket
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="w-6 h-6 text-teal-600 mr-2" />
            <h3 className="text-lg font-semibold text-teal-800">Instructions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-teal-600 font-bold text-sm">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Search by Number</h4>
              <p className="text-sm text-gray-600">Enter 17-digit ticket number</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-teal-600 font-bold text-sm">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Scan QR Code</h4>
              <p className="text-sm text-gray-600">Use camera for QR scanning</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-teal-600 font-bold text-sm">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Auto Claiming</h4>
              <p className="text-sm text-gray-600">Agent info used automatically</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-teal-600 font-bold text-sm">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Secure Verification</h4>
              <p className="text-sm text-gray-600">Encrypted QR data protection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketVerification;
