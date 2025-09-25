const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompletedDraws() {
  try {
    console.log('=== Completed Draws ===');
    const completedDraws = await prisma.draw.findMany({
      where: { status: 'settled' },
      take: 5,
      orderBy: { drawDate: 'desc' },
      include: {
        _count: {
          select: {
            tickets: true,
            winningTickets: true
          }
        }
      }
    });

    if (completedDraws.length === 0) {
      console.log('No completed draws found.');
    } else {
      completedDraws.forEach(draw => {
        console.log(`${draw.drawTime} ${new Date(draw.drawDate).toLocaleDateString()}: Result=${draw.result}, Tickets=${draw._count.tickets}, Winners=${draw._count.winningTickets}`);
      });
    }

    console.log('\n=== Tickets from Completed Draws ===');
    if (completedDraws.length > 0) {
      const ticketsFromCompleted = await prisma.ticket.findMany({
        where: {
          drawId: { in: completedDraws.map(d => d.id) }
        },
        take: 10,
        include: {
          draw: true,
          winningTickets: true
        },
        orderBy: { createdAt: 'desc' }
      });

      ticketsFromCompleted.forEach(ticket => {
        console.log(`Ticket: ${ticket.ticketNumber}`);
        console.log(`  Status: ${ticket.status}`);
        console.log(`  Draw: ${ticket.draw?.drawTime} (${ticket.draw?.status}) - Result: ${ticket.draw?.result}`);
        console.log(`  Winner: ${ticket.winningTickets?.length > 0 ? 'YES' : 'NO'}`);
        console.log('---');
      });
    } else {
      console.log('No tickets from completed draws to check.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompletedDraws();
