const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function directTicketTest() {
  try {
    console.log('🎫 Testing direct ticket creation...');
    
    // Get agent and draw
    const agent = await prisma.user.findFirst({ where: { role: 'agent' } });
    const draw = await prisma.draw.findFirst({ where: { status: 'open' } });
    
    if (!agent || !draw) {
      console.log('❌ Missing agent or draw');
      return;
    }
    
    // Direct database insert to test schema
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TEST${Date.now()}`,
        userId: agent.id,
        agentId: agent.id,  // Now Int instead of String
        drawId: draw.id,
        betType: 'standard',
        betCombination: '123',
        betAmount: 10.0,
        totalAmount: 10.0,
        qrCode: `QR${Date.now()}`,
        sequenceNumber: 'A',
        betDate: new Date(),
        status: 'pending'
      }
    });
    
    console.log('✅ Ticket created successfully:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      agentId: ticket.agentId,
      userId: ticket.userId
    });
    
    // Clean up
    await prisma.ticket.delete({ where: { id: ticket.id } });
    console.log('✅ Test ticket cleaned up');
    
  } catch (error) {
    console.error('❌ Schema error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

directTicketTest();
