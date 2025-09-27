const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketSchema() {
  try {
    console.log('🔍 Checking ticket table schema...\n');
    
    // Get a sample ticket to see its structure
    const sampleTicket = await prisma.ticket.findFirst({
      where: { id: 73 }
    });
    
    if (sampleTicket) {
      console.log('📋 Ticket table columns:');
      Object.keys(sampleTicket).forEach(key => {
        console.log(`  ${key}: ${typeof sampleTicket[key]} = ${sampleTicket[key]}`);
      });
    } else {
      console.log('❌ No ticket found with ID 73');
    }
    
    console.log('\n🔍 Checking if approval-related columns exist...');
    
    // Check if the ticket has approval-related fields
    const approvalFields = [
      'approvedAt', 
      'approvedBy', 
      'approvalNotes', 
      'approvalRequestedAt', 
      'approvalRequestedBy',
      'prizeAmount'
    ];
    
    approvalFields.forEach(field => {
      const exists = sampleTicket && sampleTicket.hasOwnProperty(field);
      console.log(`  ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketSchema();
