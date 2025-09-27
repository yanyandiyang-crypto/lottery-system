const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingClaims() {
  try {
    console.log('🔍 Checking for pending approval tickets...\n');
    
    // Check all ticket statuses
    const allStatuses = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('📊 Ticket statuses:');
    allStatuses.forEach(({ status, _count }) => {
      console.log(`  ${status}: ${_count.id} tickets`);
    });
    console.log('');
    
    // Check for pending_approval specifically
    const pendingClaims = await prisma.ticket.findMany({
      where: { 
        status: 'pending_approval'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        bets: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎯 Found ${pendingClaims.length} tickets with pending_approval status\n`);
    
    if (pendingClaims.length > 0) {
      console.log('📋 Pending approval tickets:');
      pendingClaims.forEach((ticket, index) => {
        console.log(`${index + 1}. Ticket: ${ticket.ticketNumber}`);
        console.log(`   User: ${ticket.user?.fullName || ticket.user?.username || 'Unknown'}`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Amount: ₱${ticket.totalAmount}`);
        console.log(`   Created: ${ticket.createdAt}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No tickets found with pending_approval status');
      console.log('💡 This could mean:');
      console.log('   - No claims have been made yet');
      console.log('   - Claims are using a different status');
      console.log('   - The claim process is not working properly');
    }
    
  } catch (error) {
    console.error('❌ Error checking pending claims:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingClaims();
