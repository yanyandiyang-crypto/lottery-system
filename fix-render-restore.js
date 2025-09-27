const { PrismaClient } = require('@prisma/client');

console.log('🔧 Fixing Render Database Restore Issues');
console.log('========================================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
        }
    }
});

async function fixRenderDatabase() {
    try {
        console.log('🔗 Connecting to Render database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        console.log('\n🔄 Resetting Render database completely...');
        
        // Drop all tables and recreate schema
        await prisma.$executeRawUnsafe(`
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO lottery_db_nqw0_user;
            GRANT ALL ON SCHEMA public TO public;
        `);
        
        console.log('✅ Database schema reset');
        
        // Now push the Prisma schema
        console.log('\n🔄 Applying Prisma schema...');
        const { execSync } = require('child_process');
        
        // Set environment variable for this command
        process.env.DATABASE_URL = 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0';
        
        // Push schema to database
        execSync('npx prisma db push --force-reset', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        console.log('✅ Prisma schema applied');
        
        // Create essential data
        console.log('\n🔄 Creating essential data...');
        
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
        
        // Create other users
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
        
        console.log('\n🎉 Render database fixed and ready!');
        
        // Check final status
        console.log('\n📊 Final Render Database Status:');
        const userCount = await prisma.user.count();
        const regionCount = await prisma.region.count();
        const betLimitCount = await prisma.betLimit.count();
        const prizeConfigCount = await prisma.prizeConfiguration.count();
        
        console.log(`👥 Users: ${userCount}`);
        console.log(`🌍 Regions: ${regionCount}`);
        console.log(`💰 Bet Limits: ${betLimitCount}`);
        console.log(`🎁 Prize Configs: ${prizeConfigCount}`);
        
        console.log('\n📋 Next steps:');
        console.log('1. Test frontend: https://lottery-system-gamma.vercel.app');
        console.log('2. Try logging in with: superadmin');
        console.log('3. If you need your complete data, we can migrate from local database');
        
    } catch (error) {
        console.error('❌ Error fixing Render database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixRenderDatabase();
