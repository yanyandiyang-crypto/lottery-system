const { PrismaClient } = require('@prisma/client');

const RENDER_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: RENDER_DB_URL
        }
    }
});

async function createEssentialRenderData() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to Render database');
        
        console.log('\n🔄 Creating essential data for Render database...');
        
        // First, apply the Prisma schema
        console.log('📋 Applying Prisma schema...');
        process.env.DATABASE_URL = RENDER_DB_URL;
        
        const { execSync } = require('child_process');
        execSync('npx prisma db push', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        console.log('✅ Prisma schema applied');
        
        // Create essential data
        console.log('\n🔄 Creating essential data...');
        
        // Create region
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
        
        // Create ticket template
        await prisma.ticketTemplate.create({
            data: {
                name: 'Default Template',
                content: '<div>Default ticket template</div>',
                createdBy: superadmin.id
            }
        });
        console.log('✅ Created ticket template');
        
        // Create user balance for superadmin
        await prisma.userBalance.create({
            data: {
                userId: superadmin.id,
                currentBalance: 0
            }
        });
        console.log('✅ Created user balance');
        
        console.log('\n🎉 Essential data created successfully!');
        console.log('\n📋 Database now has:');
        console.log('- 1 region');
        console.log('- 1 superadmin user');
        console.log('- 2 bet limits');
        console.log('- 2 prize configurations');
        console.log('- 1 ticket template');
        console.log('- 1 user balance');
        
        console.log('\n🔄 Next steps:');
        console.log('1. Update Render backend DATABASE_URL');
        console.log('2. Redeploy backend service');
        console.log('3. Test Vercel frontend login');
        console.log('4. Add more data as needed');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createEssentialRenderData();
