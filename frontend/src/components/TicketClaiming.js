import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { ticketsAPI } from '../utils/api';
import {
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  XMarkIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const TicketClaiming = () => {
  const [claimMode, setClaimMode] = useState('number'); // 'number' or 'qr'
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [claimStep, setClaimStep] = useState('verify'); // 'verify', 'success'
  
  // QR Scanner refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

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

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please allow camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setShowCamera(false);
  };

  // Start QR code scanning
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log('QR Code found:', code.data);
          stopCamera();
          verifyTicketForClaiming(null, code.data);
        }
      }
    }, 300); // Scan every 300ms
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Prize Claiming System
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Claim your winning lottery tickets securely with our streamlined verification process
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex flex-col sm:flex-row justify-center items-center mb-8 space-y-2 sm:space-y-0 sm:space-x-4">
          <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            claimStep === 'verify' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 shadow-sm'
          }`}>
            <span className="w-6 h-6 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs font-bold mr-2">1</span>
            Verify Ticket
          </div>
          <div className="hidden sm:block w-8 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            claimStep === 'details' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 shadow-sm'
          }`}>
            <span className="w-6 h-6 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs font-bold mr-2">2</span>
            Review Details
          </div>
          <div className="hidden sm:block w-8 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
            claimStep === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105' 
              : 'bg-white text-gray-500 shadow-sm'
          }`}>
            <span className="w-6 h-6 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs font-bold mr-2">3</span>
            Completed
          </div>
        </div>

        {/* Step 1: Verify Ticket */}
        {claimStep === 'verify' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Mode Selection */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => {
                  setClaimMode('number');
                  setShowCamera(false);
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  claimMode === 'number'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Enter Ticket Number
              </button>
              <button
                onClick={() => {
                  setClaimMode('qr');
                  setShowCamera(true);
                  setError('');
                  startCamera();
                }}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  claimMode === 'qr'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Scan QR Code
              </button>
            </div>

            {/* Enter Ticket Number */}
            {claimMode === 'number' && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-200">
                <label className="block text-sm font-semibold text-amber-800 mb-3">
                  Enter Winning Ticket Number:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatTicketNumber(ticketNumber)}
                    onChange={handleTicketNumberChange}
                    placeholder="17588678923527981"
                    className="w-full px-4 py-4 text-lg font-mono tracking-wider text-center bg-white border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-200 transition-all duration-300"
                    maxLength={17}
                  />
                  <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-500" />
                </div>
                <button
                  onClick={verifyByNumber}
                  disabled={loading || ticketNumber.length < 17}
                  className={`w-full mt-4 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                    loading || ticketNumber.length < 17
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Verify for Claiming
                    </>
                  )}
                </button>
              </div>
            )}

            {/* QR Scanner */}
            {claimMode === 'qr' && showCamera && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl mb-4 text-center font-semibold flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 mr-2" />
                  Scan winning ticket QR code
                </div>
                <div className="relative rounded-xl overflow-hidden shadow-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <div className="absolute inset-0 border-2 border-white border-dashed opacity-50 m-8"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                      Point camera at QR code on ticket
                    </p>
                  </div>
                </div>
                <button
                  onClick={stopCamera}
                  className="w-full mt-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Claimer Details */}
        {claimStep === 'details' && ticketData && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Winning Ticket Verified!</h2>
              <p className="text-green-600">Your ticket is eligible for prize claiming</p>
            </div>
          
            {/* Ticket Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Ticket Number</div>
                  <div className="font-mono text-lg font-bold text-gray-900">{formatTicketNumber(ticketData.ticketNumber)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-lg font-bold text-green-600">₱{ticketData.totalAmount.toFixed(2)}</div>
                </div>
              </div>
              {ticketData.agent && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <h5 className="text-blue-800 font-semibold mb-2">Agent Information</h5>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {ticketData.agent.name}</div>
                    {ticketData.agent.phone && <div><span className="font-medium">Phone:</span> {ticketData.agent.phone}</div>}
                    {ticketData.agent.address && <div><span className="font-medium">Address:</span> {ticketData.agent.address}</div>}
                  </div>
                </div>
              )}
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  This ticket is eligible for claiming!
                </div>
              </div>
            </div>

            {/* Quick Claim Confirmation */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <TrophyIcon className="w-6 h-6 text-amber-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Ready to Claim Prize!</h3>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="mb-1">This claim will be automatically sent to admin for approval.</p>
                    <p className="text-xs text-blue-600">Admin will review: Agent, Time, Ticket Number, Winning Combination & Bet Type</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setClaimStep('verify')}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back
                </button>
                <button
                  onClick={submitClaim}
                  disabled={loading}
                  className={`flex-2 flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting Claim...
                    </>
                  ) : (
                    <>
                      <TrophyIcon className="w-5 h-5 mr-2" />
                      Claim Prize Now
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>
      )}

        {/* Step 3: Success */}
        {claimStep === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg mb-6">
              <CheckCircleIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              Claim Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your prize claim has been processed and sent for admin approval. Please keep this confirmation for your records.
            </p>
          
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Ticket Number</div>
                  <div className="font-mono text-lg font-bold text-gray-900">{formatTicketNumber(ticketData?.ticketNumber || '')}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Claimed By</div>
                  <div className="text-lg font-semibold text-gray-900">Agent</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Date & Time</div>
                  <div className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                    Pending Admin Approval
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <TrophyIcon className="w-5 h-5 mr-2" />
              Claim Another Ticket
            </button>
        </div>
      )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-purple-800">Claiming Process</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-sm">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Verify Ticket</h4>
              <p className="text-sm text-gray-600">Enter number or scan QR code</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-sm">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Check Eligibility</h4>
              <p className="text-sm text-gray-600">System confirms winner status</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-sm">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Review Details</h4>
              <p className="text-sm text-gray-600">Confirm ticket information</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-sm">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">Submit Claim</h4>
              <p className="text-sm text-gray-600">Complete the process</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketClaiming;
