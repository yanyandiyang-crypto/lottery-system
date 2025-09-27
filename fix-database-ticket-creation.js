const { PrismaClient } = require('@prisma/client');

console.log('🔧 Fixing Database Ticket Creation Issue');
console.log('=======================================');

async function fixDatabaseTicketCreation() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0'
            }
        }
    });

    try {
        console.log('🔍 Checking database state...');
        
        // Check essential data
        const regions = await prisma.region.count();
        const users = await prisma.user.count();
        const draws = await prisma.draw.count();
        const betLimits = await prisma.betLimit.count();
        const prizeConfigs = await prisma.prizeConfiguration.count();
        const ticketTemplates = await prisma.ticketTemplate.count();
        
        console.log('📊 Database Status:');
        console.log(`   Regions: ${regions}`);
        console.log(`   Users: ${users}`);
        console.log(`   Draws: ${draws}`);
        console.log(`   Bet Limits: ${betLimits}`);
        console.log(`   Prize Configs: ${prizeConfigs}`);
        console.log(`   Ticket Templates: ${ticketTemplates}`);
        
        // Check if we have essential data
        if (regions === 0) {
            console.log('🔧 Creating default region...');
            await prisma.region.create({
                data: { name: 'Default Region' }
            });
            console.log('✅ Default region created');
        }
        
        if (betLimits === 0) {
            console.log('🔧 Creating default bet limits...');
            await prisma.betLimit.createMany({
                data: [
                    { betType: 'standard', maxAmount: 1000, minAmount: 1 },
                    { betType: 'rambolito', maxAmount: 500, minAmount: 1 }
                ]
            });
            console.log('✅ Default bet limits created');
        }
        
        if (prizeConfigs === 0) {
            console.log('🔧 Creating default prize configurations...');
            await prisma.prizeConfiguration.createMany({
                data: [
                    { betType: 'standard', prizeAmount: 5000, winningNumbers: 3 },
                    { betType: 'rambolito', prizeAmount: 2500, winningNumbers: 3 }
                ]
            });
            console.log('✅ Default prize configurations created');
        }
        
        if (ticketTemplates === 0) {
            console.log('🔧 Creating default ticket template...');
            await prisma.ticketTemplate.create({
                data: {
                    name: 'Default Template',
                    template: '{"type":"default","layout":"standard"}',
                    isActive: true,
                    createdById: 1
                }
            });
            console.log('✅ Default ticket template created');
        }
        
        // Check for active draws
        const activeDraws = await prisma.draw.findMany({
            where: { status: 'open' },
            take: 1
        });
        
        if (activeDraws.length === 0) {
            console.log('🔧 Creating a test draw...');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            await prisma.draw.create({
                data: {
                    drawDate: tomorrow,
                    drawTime: '17:00:00',
                    status: 'open',
                    cutoffTime: tomorrow,
                    createdById: 1
                }
            });
            console.log('✅ Test draw created');
        }
        
        console.log('\n✅ Database fix completed!');
        console.log('🎯 Ticket creation should now work');
        
    } catch (error) {
        console.error('❌ Database fix failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixDatabaseTicketCreation();
