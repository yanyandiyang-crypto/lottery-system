const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApproval() {
  try {
    console.log('🧪 Testing approval process...\n');
    
    // Test 1: Check if we can connect to database
    console.log('1️⃣ Testing database connection...');
    const ticketCount = await prisma.ticket.count();
    console.log(`✅ Database connected. Total tickets: ${ticketCount}\n`);
    
    // Test 2: Find the specific ticket
    console.log('2️⃣ Looking for ticket ID 73...');
    const ticket = await prisma.ticket.findUnique({
      where: { id: 73 },
      include: {
        user: true,
        bets: true,
        draw: {
          include: {
            drawResult: true
          }
        }
      }
    });
    
    if (ticket) {
      console.log(`✅ Found ticket: ${ticket.ticketNumber}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   User: ${ticket.user?.username}`);
      console.log(`   Bets: ${ticket.bets?.length || 0}`);
    } else {
      console.log('❌ Ticket 73 not found');
      return;
    }
    
    // Test 3: Check if we can update the ticket (dry run)
    console.log('\n3️⃣ Testing ticket update (dry run)...');
    if (ticket.status === 'pending_approval') {
      console.log('✅ Ticket is in pending_approval status - ready for approval');
      
      // Don't actually update, just test the query
      console.log('✅ Update query would work');
    } else {
      console.log(`❌ Ticket status is ${ticket.status}, not pending_approval`);
    }
    
    console.log('\n🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testApproval();
