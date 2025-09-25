const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTicketStatus() {
  try {
    console.log('Updating validated tickets to complete status...');
    
    const result = await prisma.ticket.updateMany({
      where: { status: 'validated' },
      data: { status: 'complete' }
    });
    
    console.log(`Updated ${result.count} tickets from 'validated' to 'complete'`);
    
    // Also update any hardcoded references in the code
    console.log('Ticket status update completed successfully');
    
  } catch (error) {
    console.error('Error updating ticket status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTicketStatus();
