import React, { useState } from 'react';
import MobileTicketUtils from '../../utils/mobileTicketUtils';

const WebShareTest = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = () => {
    const info = MobileTicketUtils.debugWebShareSupport();
    setDebugInfo(info);
  };

  const testWebShare = async () => {
    setIsLoading(true);
    try {
      const result = await MobileTicketUtils.testWebShare();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testTicketShare = async () => {
    setIsLoading(true);
    try {
      // Create a mock ticket for testing
      const mockTicket = {
        ticketNumber: '12345678901234567',
        draw: {
          drawTime: '14:00',
          drawDate: new Date().toISOString()
        },
        totalAmount: 10.00,
        bets: [{
          betType: 'standard',
          betCombination: '123',
          betAmount: 10.00
        }]
      };

      const mockUser = {
        fullName: 'Test Agent',
        username: 'testagent'
      };

      const result = await MobileTicketUtils.shareTicket(mockTicket, mockUser);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Web Share API Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <button
            onClick={runDebug}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
          >
            Run Debug Check
          </button>
          
          {debugInfo && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Web Share API Tests</h2>
          
          <div className="space-y-4">
            <button
              onClick={testWebShare}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 mr-4"
            >
              {isLoading ? 'Testing...' : 'Test Web Share API'}
            </button>
            
            <button
              onClick={testTicketShare}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Ticket Share'}
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p><strong>Success:</strong> {testResult.success ? 'Yes' : 'No'}</p>
                <p><strong>Method:</strong> {testResult.method || 'N/A'}</p>
                {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Common Issues:</h3>
              <ul className="list-disc list-inside text-yellow-700 mt-2">
                <li><strong>HTTPS Required:</strong> Web Share API only works on HTTPS sites</li>
                <li><strong>Mobile Only:</strong> Web Share API is primarily for mobile browsers</li>
                <li><strong>Browser Support:</strong> Not all browsers support Web Share API</li>
                <li><strong>User Gesture:</strong> Must be triggered by user interaction</li>
              </ul>
            </div>
            
            <div className="bg-blue-100 p-3 rounded-lg">
              <h3 className="font-semibold text-blue-800">Supported Browsers:</h3>
              <ul className="list-disc list-inside text-blue-700 mt-2">
                <li>Chrome Mobile (Android)</li>
                <li>Safari Mobile (iOS)</li>
                <li>Samsung Internet (Android)</li>
                <li>Edge Mobile (Android)</li>
              </ul>
            </div>
            
            <div className="bg-green-100 p-3 rounded-lg">
              <h3 className="font-semibold text-green-800">Fallback Methods:</h3>
              <ul className="list-disc list-inside text-green-700 mt-2">
                <li>Clipboard API (copy to clipboard)</li>
                <li>Alert dialog with shareable text</li>
                <li>Direct URL sharing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebShareTest;
