const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestTicket() {
  try {
    // Get a user to use as agent
    const agent = await prisma.user.findFirst({
      where: { role: 'agent' }
    });
    
    if (!agent) {
      console.log('No agent found in database');
      return;
    }
    
    // Get a draw
    const draw = await prisma.draw.findFirst();
    
    if (!draw) {
      console.log('No draw found in database');
      return;
    }
    
    // Create a test ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TEST${Date.now()}`,
        userId: agent.id,
        agentId: agent.id,
        drawId: draw.id,
        betType: 'standard',
        betCombination: '123',
        betAmount: 10.0,
        totalAmount: 10.0,
        qrCode: `QR${Date.now()}`,
        sequenceNumber: `SEQ${Date.now()}`,
        betDate: new Date(),
        status: 'pending'
      }
    });
    
    console.log('Created test ticket:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      agentId: ticket.agentId
    });
    
  } catch (error) {
    console.error('Error creating test ticket:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTicket();
