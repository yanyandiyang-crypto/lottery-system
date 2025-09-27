const { PrismaClient } = require('@prisma/client');

console.log('🧪 Testing Restored Data');
console.log('========================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function testData() {
    try {
        console.log('🔗 Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Test users
        const users = await prisma.user.findMany();
        console.log(`👥 Users: ${users.length}`);
        if (users.length > 0) {
            console.log(`   Sample: ${users[0].username} (${users[0].role})`);
        }
        
        // Test tickets
        const tickets = await prisma.ticket.findMany({ take: 3 });
        console.log(`🎫 Tickets: ${await prisma.ticket.count()}`);
        if (tickets.length > 0) {
            console.log(`   Sample: ${tickets[0].ticketNumber} - ₱${tickets[0].betAmount}`);
        }
        
        // Test draws
        const draws = await prisma.draw.findMany({ take: 3 });
        console.log(`🎲 Draws: ${await prisma.draw.count()}`);
        if (draws.length > 0) {
            console.log(`   Sample: ${draws[0].drawDate.toDateString()} ${draws[0].drawTime} - ${draws[0].status}`);
        }
        
        // Test bets
        const bets = await prisma.bet.findMany({ take: 3 });
        console.log(`🎯 Bets: ${await prisma.bet.count()}`);
        if (bets.length > 0) {
            console.log(`   Sample: ${bets[0].betType} - ₱${bets[0].betAmount}`);
        }
        
        // Test balance transactions
        const transactions = await prisma.balanceTransaction.findMany({ take: 3 });
        console.log(`💰 Transactions: ${await prisma.balanceTransaction.count()}`);
        if (transactions.length > 0) {
            console.log(`   Sample: ${transactions[0].transactionType} - ₱${transactions[0].amount}`);
        }
        
        console.log('\n🎯 Data Quality Check:');
        
        // Check if we can create a new ticket (test write access)
        try {
            const testTicket = await prisma.ticket.create({
                data: {
                    ticketNumber: 'TEST001',
                    betAmount: 1,
                    totalAmount: 1,
                    status: 'pending',
                    userId: users[0].id,
                    drawId: draws[0].id
                }
            });
            console.log('✅ Write test passed - can create new tickets');
            
            // Clean up test ticket
            await prisma.ticket.delete({ where: { id: testTicket.id } });
            console.log('✅ Cleanup successful');
            
        } catch (error) {
            console.log('❌ Write test failed:', error.message);
        }
        
        console.log('\n📊 Summary:');
        if (users.length > 0 && tickets.length > 0 && draws.length > 0) {
            console.log('🎉 Data restoration appears SUCCESSFUL!');
            console.log('✅ Your lottery system data is restored and functional');
        } else {
            console.log('❌ Data restoration appears INCOMPLETE');
            console.log('⚠️ Some essential data may be missing');
        }
        
    } catch (error) {
        console.error('❌ Error testing data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testData();
