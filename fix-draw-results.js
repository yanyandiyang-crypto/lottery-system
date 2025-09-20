const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDrawResults() {
  try {
    console.log('=== Fixing Draw Results ===');
    
    // Find settled draws that need ticket status updates
    const settledDraws = await prisma.draw.findMany({
      where: {
        status: 'settled',
        winningNumber: { not: null }
      }
    });

    console.log(`Found ${settledDraws.length} settled draws`);

    settledDraws.forEach(draw => {
      console.log(`Settled draw: ${draw.drawTime} ${new Date(draw.drawDate).toLocaleDateString()}: ${draw.winningNumber}`);
    });

    console.log('\n=== Fixing Ticket Status ===');
    
    // Find tickets in settled draws that are still pending
    const ticketsToFix = await prisma.ticket.findMany({
      where: {
        status: 'pending',
        draw: {
          status: 'settled'
        }
      },
      include: {
        draw: true
      }
    });

    console.log(`Found ${ticketsToFix.length} tickets to update`);

    for (const ticket of ticketsToFix) {
      console.log(`Updating ticket ${ticket.ticketNumber} from draw ${ticket.draw.drawTime} ${new Date(ticket.draw.drawDate).toLocaleDateString()}`);
      
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'validated'
        }
      });
    }

    console.log('\n=== Verification ===');
    
    // Verify the fixes
    const verifyDraws = await prisma.draw.findMany({
      where: { status: 'settled' },
      take: 3,
      orderBy: { drawDate: 'desc' }
    });

    verifyDraws.forEach(draw => {
      console.log(`Draw ${draw.drawTime} ${new Date(draw.drawDate).toLocaleDateString()}: winningNumber=${draw.winningNumber}`);
    });

    const verifyTickets = await prisma.ticket.findMany({
      where: {
        draw: { status: 'settled' }
      },
      take: 5,
      include: { draw: true }
    });

    console.log('\nSample tickets from settled draws:');
    verifyTickets.forEach(ticket => {
      console.log(`  ${ticket.ticketNumber}: ${ticket.status} (draw: ${ticket.draw.drawTime})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDrawResults();
