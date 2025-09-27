const { PrismaClient } = require('@prisma/client');

console.log('🧹 Setting Up Clean Render Database');
console.log('===================================');

const CLEAN_DB_URL = 'postgresql://lottery_db_nfow_user:8vEuBfC9JMTwwgpAJAgFn9apqMQHcZBW@dpg-d3bv3s8gjchc738pr6k0-a.oregon-postgres.render.com/lottery_db_nfow';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function setupCleanDatabase() {
    try {
        console.log('🔗 Connecting to clean database...');
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
            process.env.DATABASE_URL = CLEAN_DB_URL;
            
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
            process.env.DATABASE_URL = CLEAN_DB_URL;
            
            const { execSync } = require('child_process');
            
            execSync('npx prisma db push --force-reset', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            console.log('✅ Database reset and schema applied');
        }
        
        console.log('\n🎉 Clean database is ready!');
        console.log('\n📋 Database Connection Details:');
        console.log(`Host: dpg-d3bv3s8gjchc738pr6k0-a.oregon-postgres.render.com`);
        console.log(`Port: 5432`);
        console.log(`Database: lottery_db_nfow`);
        console.log(`Username: lottery_db_nfow_user`);
        console.log(`Password: 8vEuBfC9JMTwwgpAJAgFn9apqMQHcZBW`);
        
        console.log('\n🔄 Next Steps:');
        console.log('1. Use pgAdmin4 to restore NEW27back.sql');
        console.log('2. Update Render backend DATABASE_URL environment variable');
        console.log('3. Redeploy backend service');
        console.log('4. Test Vercel frontend login');
        
    } catch (error) {
        console.error('❌ Error setting up clean database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupCleanDatabase();
