const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001';

async function check5PMDraw() {
  console.log('=== CHECKING 5PM DRAW FOR TESTING ===\n');
  
  try {
    // Login as admin
    const token = await login('superadmin', 'admin123');
    if (!token) return;
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Find today's 5PM draw
    const today = new Date().toISOString().split('T')[0];
    
    const fivePMDraw = await prisma.draw.findFirst({
      where: {
        drawDate: new Date(today),
        drawTime: 'fivePM'
      }
    });
    
    if (!fivePMDraw) {
      console.log('❌ No 5PM draw found for today');
      return;
    }
    
    console.log(`✅ Found 5PM draw: ID ${fivePMDraw.id}`);
    console.log(`   Date: ${fivePMDraw.drawDate}`);
    console.log(`   Status: ${fivePMDraw.status}`);
    console.log(`   Winning Number: ${fivePMDraw.winningNumber || 'Not set'}`);
    
    // Find tickets for this draw
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: fivePMDraw.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });
    
    console.log(`\n📋 TICKETS FOR 5PM DRAW (${tickets.length} total):`);
    
    if (tickets.length === 0) {
      console.log('❌ No tickets found for 5PM draw');
      console.log('Creating a test ticket...');
      
      // Get an agent
      const agent = await prisma.user.findFirst({
        where: { role: 'agent' }
      });
      
      if (agent) {
        // Create test ticket
        const testTicket = await prisma.ticket.create({
          data: {
            ticketNumber: `TKT${Date.now()}`,
            userId: agent.id,
            drawId: fivePMDraw.id,
            betType: 'standard',
            betCombination: '555',
            betAmount: 10,
            totalAmount: 10,
            qrCode: 'test-qr',
            templateId: 1,
            sequenceNumber: '1',
            agentId: agent.id.toString(),
            status: 'pending'
          }
        });
        
        console.log(`✅ Created test ticket: ${testTicket.id} with bet: 555`);
        console.log(`   Agent: ${agent.fullName}`);
        
        return { drawId: fivePMDraw.id, testBet: '555', agentId: agent.id, agentName: agent.fullName };
      }
    } else {
      // Show existing tickets
      tickets.forEach((ticket, index) => {
        console.log(`${index + 1}. Ticket ${ticket.id}`);
        console.log(`   Agent: ${ticket.user.fullName} (${ticket.user.role})`);
        console.log(`   Bet: ${ticket.betCombination} (${ticket.betType})`);
        console.log(`   Amount: ₱${ticket.betAmount}`);
        console.log(`   Status: ${ticket.status}`);
        console.log('');
      });
      
      // Use first ticket for testing
      const firstTicket = tickets[0];
      return {
        drawId: fivePMDraw.id,
        testBet: firstTicket.betCombination,
        agentId: firstTicket.userId,
        agentName: firstTicket.user.fullName,
        ticketId: firstTicket.id
      };
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function setWinningResult(drawId, winningNumber) {
  console.log(`\n🎯 SETTING WINNING RESULT FOR DRAW ${drawId}`);
  console.log(`   Winning Number: ${winningNumber}`);
  
  try {
    const token = await login('superadmin', 'admin123');
    const headers = { Authorization: `Bearer ${token}` };
    
    // First close the draw
    await prisma.draw.update({
      where: { id: drawId },
      data: { status: 'closed' }
    });
    
    console.log('✅ Draw closed for betting');
    
    // Set the winning number
    const response = await axios.post(`${BASE_URL}/api/v1/draws/${drawId}/result`, {
      winningNumber: winningNumber
    }, { headers });
    
    if (response.data.success) {
      console.log('✅ Winning number set successfully!');
      console.log(`   Winners found: ${response.data.data.totalWinners}`);
      console.log(`   Total prize: ₱${response.data.data.totalPrize}`);
      
      if (response.data.data.totalWinners > 0) {
        console.log('\n🎉 WINNERS DETECTED!');
        console.log('📱 Agent notification should popup now if they are logged in!');
        
        // Check winning tickets
        const winningTickets = await prisma.ticket.findMany({
          where: {
            drawId: drawId,
            isWinner: true
          },
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        });
        
        console.log('\n🏆 WINNING TICKETS:');
        winningTickets.forEach(ticket => {
          console.log(`- ${ticket.user.fullName}: ₱${ticket.winningPrize} (Ticket ${ticket.ticketNumber})`);
        });
      }
    } else {
      console.log('❌ Failed to set winning number:', response.data.message);
    }
    
  } catch (error) {
    console.error('Error setting result:', error.response?.data || error.message);
  }
}

async function login(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      username, password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  const drawInfo = await check5PMDraw();
  
  if (drawInfo) {
    console.log(`\n🎲 READY TO TEST NOTIFICATION:`);
    console.log(`   Draw ID: ${drawInfo.drawId}`);
    console.log(`   Test Bet: ${drawInfo.testBet}`);
    console.log(`   Agent: ${drawInfo.agentName}`);
    
    console.log('\n📱 TO TEST NOTIFICATION:');
    console.log('1. Make sure the agent is logged into the frontend');
    console.log('2. Open browser console to see socket messages');
    console.log('3. Run the winning result now...\n');
    
    // Set the winning result
    await setWinningResult(drawInfo.drawId, drawInfo.testBet);
  }
}

main();
