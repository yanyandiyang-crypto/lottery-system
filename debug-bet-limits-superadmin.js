const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';

async function debugBetLimitsSuperadmin() {
  try {
    console.log('🔍 Debugging Bet Limits access for superadmin...\n');
    
    // First, login as superadmin
    console.log('1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'superadmin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Logged in as: ${user.username} (${user.role})`);
    
    // Create axios instance with auth
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check function permissions
    console.log('\n2. Checking function permissions...');
    try {
      const functionsResponse = await api.get('/function-management/functions');
      const functions = functionsResponse.data.data;
      console.log(`Found ${functions.length} system functions`);
      
      const betLimitsFunction = functions.find(f => f.key === 'bet_limits');
      if (betLimitsFunction) {
        console.log('✅ Bet Limits function found:', betLimitsFunction.name);
        console.log('   Permissions:', betLimitsFunction.rolePermissions);
      } else {
        console.log('❌ Bet Limits function not found in system functions');
      }
    } catch (error) {
      console.log('❌ Error checking functions:', error.response?.status, error.response?.data?.message);
    }
    
    // Test bet limits endpoints
    console.log('\n3. Testing bet limits endpoints...');
    
    const betLimitsEndpoints = [
      { name: 'Get Bet Limits', method: 'GET', url: '/bet-limits' },
      { name: 'Get Bet Limits Dashboard', method: 'GET', url: '/bet-limits/dashboard' }
    ];
    
    for (const endpoint of betLimitsEndpoints) {
      try {
        console.log(`   Testing: ${endpoint.method} ${endpoint.url}`);
        const response = await api.request({
          method: endpoint.method,
          url: endpoint.url
        });
        console.log(`   ✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Check if bet limits route exists
    console.log('\n4. Checking route registration...');
    try {
      const response = await api.get('/bet-limits');
      console.log('✅ Bet limits route is accessible');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Bet limits route not found (404) - Route may not be registered');
      } else if (error.response?.status === 403) {
        console.log('❌ Bet limits route forbidden (403) - Permission issue');
      } else {
        console.log(`❌ Bet limits route error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    if (error.response?.status === 401) {
      console.log('   Login failed - check superadmin credentials');
    }
  }
}

debugBetLimitsSuperadmin();
