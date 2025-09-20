// Test script to verify winning tickets API fix
const axios = require('axios');

async function testWinningTickets() {
  try {
    console.log('🧪 Testing Winning Tickets API...');
    
    // Test the API endpoint
    const response = await axios.get('http://localhost:3001/api/v1/tickets/agent/19', {
      params: {
        startDate: '2025-08-20',
        endDate: '2025-09-19',
        drawTime: 'all',
        search: '',
        page: 1,
        limit: 20,
        status: 'won'
      }
    });
    
    console.log('✅ API Response:', response.status);
    console.log('📊 Data:', {
      success: response.data.success,
      ticketCount: response.data.data?.tickets?.length || 0,
      totalCount: response.data.data?.pagination?.totalCount || 0
    });
    
    if (response.data.data?.tickets?.length > 0) {
      console.log('🎉 Found winning tickets!');
      console.log('First ticket:', {
        id: response.data.data.tickets[0].id,
        ticketNumber: response.data.data.tickets[0].ticketNumber,
        status: response.data.data.tickets[0].derivedStatus,
        winAmount: response.data.data.tickets[0].winAmount
      });
    } else {
      console.log('ℹ️ No winning tickets found (this is normal if no tickets have won yet)');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

// Run the test
testWinningTickets();

