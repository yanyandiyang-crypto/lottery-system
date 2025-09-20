const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test with different user credentials
const testUsers = [
  { username: 'testcor', password: '123456', role: 'coordinator' },
  { username: 'testagent', password: '123456', role: 'agent' },
  { username: 'superadmin', password: 'admin123', role: 'superadmin' }
];

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${credentials.username}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function testPerDrawAPI(token, role) {
  try {
    console.log(`\n=== Testing Per Draw API (${role}) ===`);
    const response = await axios.get(`${BASE_URL}/sales/per-draw?date=2025-09-17`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status:', response.status);
    console.log('Data structure:', response.data.success ? 'SUCCESS' : 'FAILED');
    
    if (response.data.success && response.data.data.draws) {
      console.log('Draws found:', response.data.data.draws.length);
      response.data.data.draws.forEach(draw => {
        console.log(`  ${draw.drawTime}: ₱${draw.grossSales} (${draw.ticketCount} tickets)`);
      });
    } else {
      console.log('No draws data found');
    }
    
    return response.data;
  } catch (error) {
    console.log('Error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testDailyAPI(token, role) {
  try {
    console.log(`\n=== Testing Daily API (${role}) ===`);
    const response = await axios.get(`${BASE_URL}/sales/daily?date=2025-09-17`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status:', response.status);
    console.log('Data structure:', response.data.success ? 'SUCCESS' : 'FAILED');
    
    if (response.data.success && response.data.data.summary) {
      const summary = response.data.data.summary;
      console.log(`Summary: ₱${summary.totalSales} total, ${summary.totalTickets} tickets, ${summary.totalAgents} agents`);
    } else {
      console.log('No summary data found');
    }
    
    return response.data;
  } catch (error) {
    console.log('Error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing Frontend API Compatibility with Different Roles...\n');
  
  for (const user of testUsers) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${user.role.toUpperCase()} (${user.username})`);
    console.log(`${'='.repeat(50)}`);
    
    const token = await login(user);
    if (!token) {
      console.log(`Skipping ${user.role} - login failed`);
      continue;
    }
    
    console.log('✅ Login successful');
    
    await testPerDrawAPI(token, user.role);
    await testDailyAPI(token, user.role);
  }
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
