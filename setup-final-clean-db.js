const { PrismaClient } = require('@prisma/client');

console.log('🧹 Setting Up Final Clean Database');
console.log('===================================');

const FINAL_CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: FINAL_CLEAN_DB_URL
        }
    }
});

async function setupFinalCleanDatabase() {
    try {
        console.log('🔗 Connecting to final clean database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        console.log('\n🔍 Checking database state...');
        
        // Check what tables exist
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`📊 Found ${tables.length} tables in database`);
        
        if (tables.length === 0) {
            console.log('\n🔄 Database is completely clean - applying schema...');
            
            // Set environment variable for Prisma commands
            process.env.DATABASE_URL = FINAL_CLEAN_DB_URL;
            
            const { execSync } = require('child_process');
            
            // Push schema to create all tables
            execSync('npx prisma db push', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            console.log('✅ Clean schema applied successfully');
        } else {
            console.log('⚠️ Database already has tables - resetting...');
            
            // Force reset the database
            process.env.DATABASE_URL = FINAL_CLEAN_DB_URL;
            
            const { execSync } = require('child_process');
            
            execSync('npx prisma db push --force-reset', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            console.log('✅ Database reset and schema applied');
        }
        
        console.log('\n🎉 Final clean database is ready!');
        console.log('\n📋 Database Connection Details:');
        console.log(`Host: dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com`);
        console.log(`Port: 5432`);
        console.log(`Database: lotterydb_a6w5`);
        console.log(`Username: lotterydb_a6w5_user`);
        console.log(`Password: cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV`);
        
        console.log('\n🔄 Next Steps:');
        console.log('1. ✅ Use pgAdmin4 to restore NEW27back.sql');
        console.log('2. ✅ Update Render backend DATABASE_URL environment variable');
        console.log('3. ✅ Redeploy backend service');
        console.log('4. ✅ Test Vercel frontend login');
        
        console.log('\n📋 pgAdmin4 Connection Settings:');
        console.log('==================================');
        console.log('Host: dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com');
        console.log('Port: 5432');
        console.log('Database: lotterydb_a6w5');
        console.log('Username: lotterydb_a6w5_user');
        console.log('Password: cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV');
        
    } catch (error) {
        console.error('❌ Error setting up final clean database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupFinalCleanDatabase();
