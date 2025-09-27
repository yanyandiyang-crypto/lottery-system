const { PrismaClient } = require('@prisma/client');

console.log('🚀 Setting up Render Database');
console.log('=============================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
        }
    }
});

async function setupRenderDatabase() {
    try {
        console.log('🔗 Connecting to Render database...');
        await prisma.$connect();
        console.log('✅ Connected to Render database successfully');
        
        // Check current data
        console.log('\n🔍 Checking current Render database...');
        const userCount = await prisma.user.count();
        const regionCount = await prisma.region.count();
        const drawCount = await prisma.draw.count();
        
        console.log(`👥 Users: ${userCount}`);
        console.log(`🌍 Regions: ${regionCount}`);
        console.log(`🎲 Draws: ${drawCount}`);
        
        if (userCount === 0) {
            console.log('\n🔄 Creating essential data for Render...');
            
            // Create region
            const region = await prisma.region.create({
                data: { name: 'Default Region' }
            });
            console.log('✅ Created region');
            
            // Create superadmin user
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
            console.log('✅ Created superadmin user');
            
            // Create other essential users
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
                await prisma.user.create({ data: userData });
                console.log(`✅ Created user: ${userData.username}`);
            }
            
            // Create bet limits
            await prisma.betLimit.createMany({
                data: [
                    {
                        betType: 'standard',
                        limitAmount: 10000,
                        createdBy: superadmin.id
                    },
                    {
                        betType: 'rambolito',
                        limitAmount: 5000,
                        createdBy: superadmin.id
                    }
                ]
            });
            console.log('✅ Created bet limits');
            
            // Create prize configurations
            await prisma.prizeConfiguration.createMany({
                data: [
                    {
                        betType: 'standard',
                        multiplier: 800,
                        baseAmount: 1,
                        basePrize: 800,
                        description: 'Standard bet prize',
                        createdById: superadmin.id
                    },
                    {
                        betType: 'rambolito',
                        multiplier: 200,
                        baseAmount: 1,
                        basePrize: 200,
                        description: 'Rambolito bet prize',
                        createdById: superadmin.id
                    }
                ]
            });
            console.log('✅ Created prize configurations');
            
            // Create ticket templates
            await prisma.ticketTemplate.createMany({
                data: [
                    {
                        name: 'Default Template',
                        content: '<div>Default ticket template</div>',
                        createdBy: superadmin.id
                    }
                ]
            });
            console.log('✅ Created ticket templates');
            
            console.log('\n🎉 Render database setup completed!');
            
        } else {
            console.log('✅ Render database already has data');
        }
        
        // Final check
        console.log('\n📊 Final Render Database Status:');
        const finalUserCount = await prisma.user.count();
        const finalRegionCount = await prisma.region.count();
        const finalBetLimitCount = await prisma.betLimit.count();
        const finalPrizeConfigCount = await prisma.prizeConfiguration.count();
        
        console.log(`👥 Users: ${finalUserCount}`);
        console.log(`🌍 Regions: ${finalRegionCount}`);
        console.log(`💰 Bet Limits: ${finalBetLimitCount}`);
        console.log(`🎁 Prize Configs: ${finalPrizeConfigCount}`);
        
        if (finalUserCount > 0) {
            console.log('\n🎉 Render database is ready for frontend!');
            console.log('\n📋 Next steps:');
            console.log('1. Check Render service status');
            console.log('2. Test frontend: https://lottery-system-gamma.vercel.app');
            console.log('3. Try logging in with: superadmin');
        }
        
    } catch (error) {
        console.error('❌ Error setting up Render database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupRenderDatabase();
