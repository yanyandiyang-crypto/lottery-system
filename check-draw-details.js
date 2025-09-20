const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrawDetails() {
  try {
    console.log('=== Settled Draw Details ===');
    const settledDraw = await prisma.draw.findFirst({
      where: { status: 'settled' },
      include: { 
        drawResult: true, 
        tickets: { take: 5 },
        winningTickets: { take: 3 }
      }
    });

    if (!settledDraw) {
      console.log('No settled draws found.');
      return;
    }

    console.log(`Draw: ${settledDraw.drawTime} ${new Date(settledDraw.drawDate).toLocaleDateString()}`);
    console.log(`Status: ${settledDraw.status}`);
    console.log(`Result field: ${settledDraw.result}`);
    console.log(`WinningNumber field: ${settledDraw.winningNumber}`);
    console.log(`DrawResult record:`, settledDraw.drawResult);
    
    console.log('\nSample tickets:');
    settledDraw.tickets.forEach(ticket => {
      console.log(`  ${ticket.ticketNumber}: ${ticket.status}`);
    });

    console.log('\nWinning tickets:');
    settledDraw.winningTickets.forEach(winner => {
      console.log(`  Ticket ID ${winner.ticketId}: Prize ₱${winner.prizeAmount}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrawDetails();
