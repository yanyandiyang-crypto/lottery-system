const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugReprint() {
  try {
    console.log('🔍 Debugging reprint issue...');
    
    // Check if ticket 3 exists
    const ticket = await prisma.ticket.findFirst({
      where: { id: 3 },
      include: {
        agent: true,
        user: true
      }
    });
    
    if (!ticket) {
      console.log('❌ Ticket 3 not found');
      return;
    }
    
    console.log('✅ Found ticket 3:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      agentId: ticket.agentId,
      userId: ticket.userId,
      reprintCount: ticket.reprintCount,
      status: ticket.status
    });
    
    if (ticket.agent) {
      console.log('✅ Agent relation works:', ticket.agent.fullName);
    } else {
      console.log('❌ Agent relation broken');
    }
    
    // Test the reprint logic directly
    if (ticket.reprintCount >= 2) {
      console.log('❌ Reprint limit reached');
    } else if (ticket.status === 'won' || ticket.status === 'settled') {
      console.log('❌ Cannot reprint settled tickets');
    } else {
      console.log('✅ Ticket can be reprinted');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugReprint();
