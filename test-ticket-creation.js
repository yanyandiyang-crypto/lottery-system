const { PrismaClient } = require('@prisma/client');

console.log('🧪 Testing Ticket Creation Endpoint');
console.log('===================================');

async function testTicketCreation() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0'
            }
        }
    });

    try {
        console.log('🔍 Checking prerequisites for ticket creation...');
        
        // Check for an agent user
        const agent = await prisma.user.findFirst({
            where: { role: 'agent' }
        });
        
        if (!agent) {
            console.log('❌ No agent user found');
            return;
        }
        console.log(`✅ Agent found: ${agent.username} (ID: ${agent.id})`);
        
        // Check for an open draw
        const openDraw = await prisma.draw.findFirst({
            where: { status: 'open' }
        });
        
        if (!openDraw) {
            console.log('❌ No open draw found');
            return;
        }
        console.log(`✅ Open draw found: ${openDraw.id} (Date: ${openDraw.drawDate})`);
        
        // Check bet limits
        const betLimits = await prisma.betLimit.findMany();
        console.log(`✅ Bet limits found: ${betLimits.length}`);
        
        // Check prize configurations
        const prizeConfigs = await prisma.prizeConfiguration.findMany();
        console.log(`✅ Prize configurations found: ${prizeConfigs.length}`);
        
        // Test creating a simple ticket
        console.log('\n🧪 Testing ticket creation...');
        
        const testTicket = await prisma.ticket.create({
            data: {
                ticketNumber: `TEST-${Date.now()}`,
                totalAmount: 10.00,
                status: 'pending',
                qrCode: `QR-${Date.now()}`,
                betDate: new Date(),
                sequenceNumber: `SEQ-${Date.now()}`,
                agentId: agent.id,
                userId: agent.id,
                drawId: openDraw.id,
                bets: {
                    create: {
                        betType: 'standard',
                        betCombination: '123',
                        betAmount: 10.00
                    }
                }
            },
            include: {
                bets: true,
                user: true,
                draw: true
            }
        });
        
        console.log('✅ Test ticket created successfully!');
        console.log(`   Ticket ID: ${testTicket.id}`);
        console.log(`   Ticket Number: ${testTicket.ticketNumber}`);
        console.log(`   Total Amount: ${testTicket.totalAmount}`);
        console.log(`   Status: ${testTicket.status}`);
        
        // Clean up test ticket
        await prisma.ticket.delete({
            where: { id: testTicket.id }
        });
        console.log('✅ Test ticket cleaned up');
        
        console.log('\n🎯 Ticket creation should work!');
        console.log('The 500 error might be due to:');
        console.log('- Missing authentication token');
        console.log('- Invalid request data format');
        console.log('- Rate limiting');
        console.log('- Validation errors');
        
    } catch (error) {
        console.error('❌ Ticket creation test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTicketCreation();
