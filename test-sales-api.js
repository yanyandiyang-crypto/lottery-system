const axios = require('axios');

async function testSalesAPI() {
  try {
    console.log('Testing Sales Per Draw API...');
    
    // Login
    const login = await axios.post('http://localhost:3001/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = login.data.token;
    const api = axios.create({
      baseURL: 'http://localhost:3001/api/v1',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    // Test sales per draw API
    const response = await api.get('/sales/per-draw?date=2025-09-20');
    
    console.log('\nSales Per Draw API Response:');
    console.log('Number of draws:', response.data.data.draws.length);
    
    response.data.data.draws.forEach(draw => {
      console.log(`${draw.drawTime}: Sales=₱${draw.grossSales}, Tickets=${draw.ticketCount}, Winnings=₱${draw.totalWinnings}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSalesAPI();

