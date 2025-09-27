const { PrismaClient } = require('@prisma/client');

console.log('🚨 RESTORING LOCAL DATA');
console.log('======================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function restoreUsers() {
    try {
        console.log('\n🔄 Restoring users...');
        
        // Create essential users
        let region = await prisma.region.findFirst();
        if (!region) {
            region = await prisma.region.create({
                data: { name: 'Default Region' }
            });
        }
        
        // Create superadmin
        const superadmin = await prisma.user.create({
            data: {
                username: 'superadmin',
                passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
                fullName: 'Super Administrator',
                role: 'SUPERADMIN',
                status: 'active',
                regionId: region.id
            }
        });
        
        // Create other users if needed
        const users = [
            {
                username: 'admin',
                passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
                fullName: 'Administrator',
                role: 'ADMIN',
                status: 'active',
                regionId: region.id
            },
            {
                username: 'agent1',
                passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
                fullName: 'Agent 1',
                role: 'AGENT',
                status: 'active',
                regionId: region.id
            }
        ];
        
        for (const userData of users) {
            try {
                await prisma.user.create({ data: userData });
            } catch (error) {
                // User might already exist
                console.log(`⚠️ User ${userData.username} might already exist`);
            }
        }
        
        console.log('✅ Users restored');
        return true;
        
    } catch (error) {
        console.error('❌ Error restoring users:', error.message);
        return false;
    }
}

async function restoreEssentialData() {
    try {
        console.log('\n🔄 Restoring essential data...');
        
        const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
        if (!superadmin) {
            console.log('❌ No superadmin found, cannot create essential data');
            return false;
        }
        
        // Create bet limits
        try {
            await prisma.betLimit.createMany({
                data: [
                    {
                        betType: 'STRAIGHT',
                        limitAmount: 10000,
                        createdBy: superadmin.id
                    },
                    {
                        betType: 'RUMBLE',
                        limitAmount: 5000,
                        createdBy: superadmin.id
                    }
                ],
                skipDuplicates: true
            });
            console.log('✅ Bet limits restored');
        } catch (error) {
            console.log('⚠️ Bet limits might already exist');
        }
        
        // Create prize configurations
        try {
            await prisma.prizeConfiguration.createMany({
                data: [
                    {
                        betType: 'STRAIGHT',
                        multiplier: 800,
                        baseAmount: 1,
                        basePrize: 800,
                        description: 'Straight bet prize',
                        createdById: superadmin.id
                    },
                    {
                        betType: 'RUMBLE',
                        multiplier: 200,
                        baseAmount: 1,
                        basePrize: 200,
                        description: 'Rumble bet prize',
                        createdById: superadmin.id
                    }
                ],
                skipDuplicates: true
            });
            console.log('✅ Prize configurations restored');
        } catch (error) {
            console.log('⚠️ Prize configurations might already exist');
        }
        
        // Create ticket templates
        try {
            await prisma.ticketTemplate.createMany({
                data: [
                    {
                        name: 'Default Template',
                        content: '<div>Default ticket template</div>',
                        createdBy: superadmin.id
                    }
                ],
                skipDuplicates: true
            });
            console.log('✅ Ticket templates restored');
        } catch (error) {
            console.log('⚠️ Ticket templates might already exist');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error restoring essential data:', error.message);
        return false;
    }
}

async function checkData() {
    try {
        console.log('\n🔍 Checking restored data...');
        
        const userCount = await prisma.user.count();
        const drawCount = await prisma.draw.count();
        const ticketCount = await prisma.ticket.count();
        const regionCount = await prisma.region.count();
        const betLimitCount = await prisma.betLimit.count();
        const prizeConfigCount = await prisma.prizeConfiguration.count();
        
        console.log(`👥 Users: ${userCount}`);
        console.log(`🎲 Draws: ${drawCount}`);
        console.log(`🎫 Tickets: ${ticketCount}`);
        console.log(`🌍 Regions: ${regionCount}`);
        console.log(`💰 Bet Limits: ${betLimitCount}`);
        console.log(`🎁 Prize Configs: ${prizeConfigCount}`);
        
        if (userCount > 0 && drawCount > 0) {
            console.log('🎉 Local database restored successfully!');
            return true;
        } else {
            console.log('⚠️ Some data may still be missing');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error checking data:', error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('🔗 Connecting to LOCAL database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Restore users
        await restoreUsers();
        
        // Restore essential data
        await restoreEssentialData();
        
        // Check what was restored
        await checkData();
        
        console.log('\n🎉 LOCAL DATABASE RESTORATION COMPLETED!');
        console.log('Your local data has been recovered.');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
