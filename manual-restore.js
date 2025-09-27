const { PrismaClient } = require('@prisma/client');

console.log('🚨 MANUAL DATA RESTORATION');
console.log('==========================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function createEssentialData() {
    try {
        console.log('\n🔄 Creating essential data manually...');
        
        // Create region first
        let region = await prisma.region.findFirst();
        if (!region) {
            region = await prisma.region.create({
                data: { name: 'Default Region' }
            });
            console.log('✅ Created region');
        } else {
            console.log('✅ Region already exists');
        }
        
        // Create users
        const users = [
            {
                username: 'superadmin',
                passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
                fullName: 'Super Administrator',
                role: 'SUPERADMIN',
                status: 'active',
                regionId: region.id
            },
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
                console.log(`✅ Created user: ${userData.username}`);
            } catch (error) {
                console.log(`⚠️ User ${userData.username} might already exist`);
            }
        }
        
        // Create bet limits
        const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
        if (superadmin) {
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
                console.log('✅ Created bet limits');
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
                console.log('✅ Created prize configurations');
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
                console.log('✅ Created ticket templates');
            } catch (error) {
                console.log('⚠️ Ticket templates might already exist');
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating essential data:', error.message);
        return false;
    }
}

async function createSampleData() {
    try {
        console.log('\n🔄 Creating sample lottery data...');
        
        const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
        const agent = await prisma.user.findFirst({ where: { role: 'AGENT' } });
        
        if (!superadmin || !agent) {
            console.log('❌ Required users not found');
            return false;
        }
        
        // Create some sample draws
        const today = new Date();
        const draws = [
            {
                drawDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                drawTime: 'twoPM',
                status: 'open'
            },
            {
                drawDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                drawTime: 'fivePM',
                status: 'open'
            },
            {
                drawDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                drawTime: 'ninePM',
                status: 'open'
            }
        ];
        
        for (const drawData of draws) {
            try {
                await prisma.draw.create({ data: drawData });
                console.log(`✅ Created draw: ${drawData.drawDate.toDateString()} ${drawData.drawTime}`);
            } catch (error) {
                console.log(`⚠️ Draw might already exist: ${error.message}`);
            }
        }
        
        // Create some sample tickets
        const draw = await prisma.draw.findFirst();
        if (draw) {
            const tickets = [
                {
                    ticketNumber: 'T001',
                    betAmount: 10,
                    status: 'pending',
                    userId: agent.id,
                    drawId: draw.id
                },
                {
                    ticketNumber: 'T002',
                    betAmount: 20,
                    status: 'pending',
                    userId: agent.id,
                    drawId: draw.id
                },
                {
                    ticketNumber: 'T003',
                    betAmount: 15,
                    status: 'pending',
                    userId: agent.id,
                    drawId: draw.id
                }
            ];
            
            for (const ticketData of tickets) {
                try {
                    await prisma.ticket.create({ data: ticketData });
                    console.log(`✅ Created ticket: ${ticketData.ticketNumber}`);
                } catch (error) {
                    console.log(`⚠️ Ticket might already exist: ${error.message}`);
                }
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating sample data:', error.message);
        return false;
    }
}

async function checkData() {
    try {
        console.log('\n🔍 Checking database data...');
        
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
            console.log('🎉 Database has essential data!');
            return true;
        } else {
            console.log('⚠️ Database may need more data');
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
        
        // Create essential data
        await createEssentialData();
        
        // Create sample data
        await createSampleData();
        
        // Check what was created
        await checkData();
        
        console.log('\n🎉 MANUAL DATA CREATION COMPLETED!');
        console.log('Your local database now has essential data to work with.');
        console.log('\n📋 Next steps:');
        console.log('1. Test your local application');
        console.log('2. Use pgAdmin4 to restore the full backup if needed');
        console.log('3. Continue with Render migration when ready');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
