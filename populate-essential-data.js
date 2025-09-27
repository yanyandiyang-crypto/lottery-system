const { PrismaClient } = require('@prisma/client');

console.log('🚀 Populating Essential Data');
console.log('============================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
        }
    }
});

async function createEssentialData() {
    try {
        console.log('\n🔄 Creating essential data...');
        
        // Create regions
        const region = await prisma.region.create({
            data: {
                name: 'Default Region'
            }
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
        
        // Create bet limits
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
            ]
        });
        console.log('✅ Created bet limits');
        
        // Create prize configurations
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
        
        console.log('✅ Essential data created successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error creating essential data:', error.message);
        return false;
    }
}

async function checkData() {
    try {
        console.log('\n🔍 Checking database...');
        
        const userCount = await prisma.user.count();
        const regionCount = await prisma.region.count();
        const betLimitCount = await prisma.betLimit.count();
        const prizeConfigCount = await prisma.prizeConfiguration.count();
        
        console.log(`👥 Users: ${userCount}`);
        console.log(`🌍 Regions: ${regionCount}`);
        console.log(`💰 Bet Limits: ${betLimitCount}`);
        console.log(`🎁 Prize Configs: ${prizeConfigCount}`);
        
        if (userCount > 0) {
            console.log('🎉 Database is ready!');
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
        console.log('🔗 Connecting to Render database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Create essential data
        const dataSuccess = await createEssentialData();
        
        if (!dataSuccess) {
            console.error('❌ Failed to create essential data. Stopping process.');
            return;
        }
        
        // Check data
        await checkData();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Test frontend: https://lottery-system-gamma.vercel.app');
        console.log('2. Login with username: superadmin');
        console.log('3. Check if all functionality works');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
