const { PrismaClient } = require('@prisma/client');

console.log('🚀 Restoring to New Render Database');
console.log('===================================');

const NEW_RENDER_DB_URL = 'postgresql://lottery_db_5m56_user:1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4@dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com/lottery_db_5m56';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: NEW_RENDER_DB_URL
        }
    }
});

async function setupNewRenderDatabase() {
    try {
        console.log('🔗 Connecting to new Render database...');
        await prisma.$connect();
        console.log('✅ Connected to new Render database successfully');
        
        // Check current state
        console.log('\n🔍 Checking new database...');
        try {
            const userCount = await prisma.user.count();
            console.log(`👥 Users: ${userCount}`);
        } catch (error) {
            console.log('📊 Database is empty (expected for new database)');
        }
        
        console.log('\n🔄 Setting up Prisma schema...');
        
        // Set environment variable for Prisma commands
        process.env.DATABASE_URL = NEW_RENDER_DB_URL;
        
        const { execSync } = require('child_process');
        
        // Push schema to new database
        execSync('npx prisma db push', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        console.log('✅ Prisma schema applied to new database');
        
        console.log('\n🎉 New Render database is ready!');
        console.log('\n📋 Next steps:');
        console.log('1. Use pgAdmin4 to restore NEW27back.sql to this database');
        console.log('2. Or use pg_restore command with new credentials');
        console.log('3. Update backend DATABASE_URL environment variable');
        console.log('4. Test frontend connection');
        
        console.log('\n🔧 Database Connection Details:');
        console.log(`Host: dpg-d3bussb7mgec73a2p5sg-a.oregon-postgres.render.com`);
        console.log(`Port: 5432`);
        console.log(`Database: lottery_db_5m56`);
        console.log(`Username: lottery_db_5m56_user`);
        console.log(`Password: 1zMsrPkB0sJycCFWK7z25BuWR8DQeUE4`);
        
    } catch (error) {
        console.error('❌ Error setting up new Render database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupNewRenderDatabase();
