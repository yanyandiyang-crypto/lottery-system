const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing claim approval endpoint...\n');
    
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/v1/health');
      console.log('✅ Server is running:', healthResponse.status);
    } catch (err) {
      console.log('❌ Server health check failed:', err.message);
      return;
    }
    
    // Test 2: Test the approval endpoint (without auth - should get 401)
    console.log('\n2️⃣ Testing approval endpoint (no auth)...');
    try {
      const response = await axios.post('http://localhost:3001/api/v1/claim-approvals/73/approve', {
        notes: 'test',
        prizeAmount: 750
      });
      console.log('Unexpected success:', response.status);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Endpoint reachable (401 Unauthorized as expected)');
      } else {
        console.log('❌ Unexpected error:', err.response?.status, err.message);
      }
    }
    
    console.log('\n🎯 Endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoint();
