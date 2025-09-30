import React, { useState, useEffect } from 'react';
import thermalPrinter from '../../utils/thermalPrinterUtils';
import CapacitorUtils from '../../utils/capacitorUtils';

/**
 * Printer Manager Component
 * Test and manage thermal printer connections
 */
function PrinterManager() {
  const [isNative, setIsNative] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if running on native platform
    setIsNative(CapacitorUtils.isNative());
    
    // Check if already connected
    if (thermalPrinter.isConnected()) {
      setConnected(true);
      setConnectedPrinter(thermalPrinter.getConnectedPrinter());
      setStatus('✅ Printer connected');
    }
  }, []);

  // Scan for available printers
  const handleScanPrinters = async () => {
    setIsScanning(true);
    setError('');
    setStatus('🔍 Scanning for printers...');

    try {
      const foundPrinters = await thermalPrinter.scanPrinters();
      setPrinters(foundPrinters);
      
      if (foundPrinters.length === 0) {
        setStatus('⚠️ No printers found. Make sure Bluetooth is enabled and printer is in pairing mode.');
      } else {
        setStatus(`✅ Found ${foundPrinters.length} printer(s)`);
      }
    } catch (err) {
      setError(`❌ Scan failed: ${err.message}`);
      setStatus('');
      console.error('Printer scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to a printer
  const handleConnect = async (printerAddress, printerName) => {
    setError('');
    setStatus(`🔗 Connecting to ${printerName}...`);

    try {
      await thermalPrinter.connect(printerAddress);
      setConnected(true);
      setConnectedPrinter({ address: printerAddress, name: printerName });
      setStatus(`✅ Connected to ${printerName}`);
    } catch (err) {
      setError(`❌ Connection failed: ${err.message}`);
      setStatus('');
      console.error('Printer connection error:', err);
    }
  };

  // Disconnect from printer
  const handleDisconnect = async () => {
    setError('');
    setStatus('🔌 Disconnecting...');

    try {
      await thermalPrinter.disconnect();
      setConnected(false);
      setConnectedPrinter(null);
      setStatus('✅ Disconnected');
    } catch (err) {
      setError(`❌ Disconnect failed: ${err.message}`);
      console.error('Printer disconnect error:', err);
    }
  };

  // Print test page
  const handleTestPrint = async () => {
    if (!connected) {
      setError('❌ Please connect to a printer first');
      return;
    }

    setError('');
    setStatus('🖨️ Printing test page...');

    try {
      await thermalPrinter.printTestPage();
      setStatus('✅ Test page printed successfully!');
    } catch (err) {
      setError(`❌ Print failed: ${err.message}`);
      setStatus('');
      console.error('Print test error:', err);
    }
  };

  // Print sample ticket
  const handlePrintSampleTicket = async () => {
    if (!connected) {
      setError('❌ Please connect to a printer first');
      return;
    }

    setError('');
    setStatus('🖨️ Printing sample ticket...');

    try {
      const sampleTicket = {
        ticketNumber: '12345678901234567',
        drawTime: '2PM',
        drawDate: new Date().toISOString(),
        bets: [
          { combination: '123', type: 'standard', amount: 10 },
          { combination: '456', type: 'rambolito', amount: 10 },
          { combination: '789', type: 'standard', amount: 20 }
        ],
        totalAmount: 40,
        agentName: 'Test Agent',
        agentCode: 'TEST001',
        qrCode: '12345678901234567|abc123',
        createdAt: new Date().toISOString()
      };

      await thermalPrinter.printLotteryTicket(sampleTicket);
      setStatus('✅ Sample ticket printed successfully!');
    } catch (err) {
      setError(`❌ Print failed: ${err.message}`);
      setStatus('');
      console.error('Print ticket error:', err);
    }
  };

  if (!isNative) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">
          ⚠️ Thermal printer is only available on Android/iOS devices
        </p>
        <p className="text-yellow-600 text-sm mt-2">
          Please run this app on a mobile device to use printer features
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🖨️ Thermal Printer Manager
      </h2>

      {/* Status Display */}
      {status && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 font-medium">{status}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Connection Status</p>
            <p className="text-lg font-bold text-gray-800">
              {connected ? (
                <span className="text-green-600">✅ Connected</span>
              ) : (
                <span className="text-gray-400">⭕ Not Connected</span>
              )}
            </p>
            {connectedPrinter && (
              <p className="text-sm text-gray-600 mt-1">
                {connectedPrinter.name || connectedPrinter.address}
              </p>
            )}
          </div>
          {connected && (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Scan Button */}
      {!connected && (
        <button
          onClick={handleScanPrinters}
          disabled={isScanning}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed mb-6"
        >
          {isScanning ? '🔍 Scanning...' : '🔍 Scan for Printers'}
        </button>
      )}

      {/* Printer List */}
      {printers.length > 0 && !connected && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Available Printers ({printers.length})
          </h3>
          <div className="space-y-2">
            {printers.map((printer, index) => (
              <div
                key={printer.address || index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {printer.name || 'Unknown Printer'}
                  </p>
                  <p className="text-sm text-gray-600">{printer.address}</p>
                </div>
                <button
                  onClick={() => handleConnect(printer.address, printer.name)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Buttons */}
      {connected && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Test Printing
          </h3>
          <button
            onClick={handleTestPrint}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            🧪 Print Test Page
          </button>
          <button
            onClick={handlePrintSampleTicket}
            className="w-full px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
          >
            🎫 Print Sample Ticket
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">📝 Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Enable Bluetooth on your device</li>
          <li>Turn on your thermal printer</li>
          <li>Put printer in pairing mode (usually hold power button)</li>
          <li>Click "Scan for Printers"</li>
          <li>Select your printer from the list</li>
          <li>Test printing with the test buttons</li>
        </ol>
      </div>
    </div>
  );
}

export default PrinterManager;
