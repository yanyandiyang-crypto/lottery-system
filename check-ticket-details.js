const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketDetails() {
  try {
    console.log('🔍 Checking ticket details for pending approval tickets...\n');
    
    // Get the pending approval tickets with full details
    const pendingTickets = await prisma.ticket.findMany({
      where: { 
        status: 'pending_approval'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        bets: true,
        draw: {
          include: {
            drawResult: {
              select: {
                winningNumber: true,
                isOfficial: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Found ${pendingTickets.length} pending tickets\n`);
    
    pendingTickets.forEach((ticket, index) => {
      console.log(`=== TICKET ${index + 1} ===`);
      console.log(`ID: ${ticket.id}`);
      console.log(`Ticket Number: ${ticket.ticketNumber}`);
      console.log(`User: ${ticket.user?.fullName || ticket.user?.username}`);
      console.log(`Status: ${ticket.status}`);
      console.log(`Total Amount: ₱${ticket.totalAmount}`);
      console.log(`Created: ${ticket.createdAt}`);
      console.log(`Draw ID: ${ticket.drawId}`);
      
      if (ticket.draw?.drawResult?.winningNumber) {
        console.log(`🎯 Winning Number: ${ticket.draw.drawResult.winningNumber}`);
      } else {
        console.log('❌ No winning number found');
      }
      
      console.log(`\n📋 BETS (${ticket.bets.length} total):`);
      ticket.bets.forEach((bet, betIndex) => {
        console.log(`  Bet ${betIndex + 1}:`);
        console.log(`    Combination: ${bet.betCombination}`);
        console.log(`    Type: ${bet.betType}`);
        console.log(`    Amount: ₱${bet.betAmount || bet.amount || 'N/A'}`);
        
        // Check if this bet is winning
        if (ticket.draw?.drawResult?.winningNumber) {
          const winningNumber = ticket.draw.drawResult.winningNumber;
          const betCombination = bet.betCombination.toString().replace(/\s+/g, '');
          const cleanWinning = winningNumber.toString().replace(/\s+/g, '');
          
          let isWinning = false;
          if (bet.betType === 'rambolito') {
            // Check if digits match in any order
            const betDigits = betCombination.split('').sort();
            const winningDigits = cleanWinning.split('').sort();
            isWinning = JSON.stringify(betDigits) === JSON.stringify(winningDigits);
          } else {
            // Check exact match
            isWinning = betCombination === cleanWinning;
          }
          
          if (isWinning) {
            const multiplier = bet.betType === 'rambolito' ? 75 : 450;
            const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
            const prize = betAmount * multiplier;
            console.log(`    🎉 WINNING! Prize: ₱${prize} (₱${betAmount} × ${multiplier})`);
          } else {
            console.log(`    ❌ Not winning`);
          }
        }
      });
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Error checking ticket details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketDetails();
