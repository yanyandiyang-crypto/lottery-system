const { PrismaClient } = require('@prisma/client');

console.log('🔧 Fixing pg_restore Errors');
console.log('==========================');

const NEW_RENDER_DB_URL = 'postgresql://lottery_db_5m56_user:1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4@dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com/lottery_db_5m56';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: NEW_RENDER_DB_URL
        }
    }
});

async function fixPgRestoreErrors() {
    try {
        console.log('🔗 Connecting to new Render database...');
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
            console.log('\n⚠️ Database is empty - need to create schema first');
            console.log('\n🔄 Creating Prisma schema...');
            
            // Set environment variable for Prisma commands
            process.env.DATABASE_URL = NEW_RENDER_DB_URL;
            
            const { execSync } = require('child_process');
            
            // Push schema to create all tables
            execSync('npx prisma db push', { 
                stdio: 'inherit',
                cwd: __dirname 
            });
            
            console.log('✅ Schema created successfully');
        } else {
            console.log('✅ Tables already exist');
        }
        
        console.log('\n🎯 Solution for pg_restore errors:');
        console.log('===================================');
        console.log('The errors you saw are normal when restoring to a clean database.');
        console.log('pg_restore tries to drop constraints from tables that don\'t exist yet.');
        console.log('\n📋 Recommended approach:');
        console.log('1. ✅ Schema is now created (tables exist)');
        console.log('2. 🔄 Try pg_restore again with these flags:');
        console.log('   --no-owner --no-privileges --disable-triggers --data-only');
        console.log('\n💡 Alternative: Use pgAdmin4 restore (usually handles this better)');
        
        console.log('\n🔧 Updated pg_restore command:');
        console.log('set PGPASSWORD=1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4');
        console.log('pg_restore --verbose --no-owner --no-privileges --disable-triggers --data-only --dbname=lottery_db_5m56 --host=dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com --port=5432 --username=lottery_db_5m56_user NEW27back.sql');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixPgRestoreErrors();
