const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClaimApprovals() {
  try {
    console.log('🔍 Testing Claim Approvals System...\n');
    
    // Check current ticket statuses
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('📊 Current ticket statuses:');
    statusCounts.forEach(({ status, _count }) => {
      console.log(`  ${status}: ${_count.id} tickets`);
    });
    console.log('');
    
    // Check for pending_approval tickets
    const pendingClaims = await prisma.ticket.findMany({
      where: { status: 'pending_approval' },
      include: {
        user: { select: { username: true, fullName: true } }
      }
    });
    
    console.log(`🎯 Found ${pendingClaims.length} tickets with pending_approval status`);
    
    if (pendingClaims.length === 0) {
      console.log('\n💡 No pending claims found. Let me create a test claim...');
      
      // Find a winning ticket to use for testing
      const winningTicket = await prisma.ticket.findFirst({
        where: { 
          status: 'validated' // or 'won' 
        },
        include: {
          user: { select: { username: true, fullName: true } }
        }
      });
      
      if (winningTicket) {
        console.log(`📋 Found ticket ${winningTicket.ticketNumber} to use for testing`);
        
        // Update it to pending_approval for testing
        await prisma.ticket.update({
          where: { id: winningTicket.id },
          data: { 
            status: 'pending_approval',
            claimerName: 'Test Claimer',
            claimerPhone: '09123456789',
            claimerAddress: 'Test Address'
          }
        });
        
        console.log('✅ Created test claim with pending_approval status');
        console.log(`   Ticket: ${winningTicket.ticketNumber}`);
        console.log(`   User: ${winningTicket.user?.fullName || winningTicket.user?.username}`);
        console.log('');
        console.log('🎯 Now you can test the Claim Approvals page!');
      } else {
        console.log('❌ No suitable tickets found for testing');
        console.log('💡 Create some winning tickets first, then try claiming them');
      }
    } else {
      console.log('\n📋 Pending claims found:');
      pendingClaims.forEach((ticket, index) => {
        console.log(`${index + 1}. Ticket: ${ticket.ticketNumber}`);
        console.log(`   User: ${ticket.user?.fullName || ticket.user?.username}`);
        console.log(`   Amount: ₱${ticket.totalAmount}`);
        console.log('');
      });
      console.log('🎯 These should now appear in the Claim Approvals page!');
    }
    
  } catch (error) {
    console.error('❌ Error testing claim approvals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClaimApprovals();
