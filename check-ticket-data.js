const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketData() {
  try {
    const recentTickets = await prisma.ticket.findMany({
      include: {
        draw: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Recent tickets with draw data:');
    recentTickets.forEach(ticket => {
      console.log(`Ticket ${ticket.id}: drawDate=${ticket.draw?.drawDate}, drawTime=${ticket.draw?.drawTime}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkTicketData();
