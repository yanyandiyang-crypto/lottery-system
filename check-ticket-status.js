const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketStatus() {
  try {
    console.log('=== Recent Tickets Status ===');
    const tickets = await prisma.ticket.findMany({
      take: 10,
      include: { 
        draw: true,
        winningTickets: true
      },
      orderBy: { createdAt: 'desc' }
    });

    tickets.forEach(ticket => {
      console.log(`Ticket: ${ticket.ticketNumber}`);
      console.log(`  Status: ${ticket.status}`);
      console.log(`  Draw: ${ticket.draw?.drawTime} (${ticket.draw?.status})`);
      console.log(`  Winner: ${ticket.winningTickets?.length > 0 ? 'YES' : 'NO'}`);
      console.log(`  Created: ${ticket.createdAt.toISOString()}`);
      console.log('---');
    });

    console.log('\n=== Draw Status Summary ===');
    const draws = await prisma.draw.findMany({
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

    draws.forEach(draw => {
      console.log(`Draw: ${draw.drawTime} ${new Date(draw.drawDate).toLocaleDateString()}`);
      console.log(`  Status: ${draw.status}`);
      console.log(`  Result: ${draw.result || 'Not set'}`);
      console.log(`  Tickets: ${draw._count.tickets}`);
      console.log(`  Winners: ${draw._count.winningTickets}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketStatus();
