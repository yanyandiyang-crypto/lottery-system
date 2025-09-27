const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Restoring to Fresh Render Database');
console.log('===================================');

const FRESH_DB_URL = 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: FRESH_DB_URL
        }
    }
});

async function restoreToFreshDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to fresh Render database');
        
        // Check if the plain SQL file exists
        const sqlFilePath = 'C:\\Users\\Lags\\Desktop\\NEW27back plain .sql';
        
        if (!fs.existsSync(sqlFilePath)) {
            console.log('❌ SQL file not found at:', sqlFilePath);
            return;
        }
        
        console.log('📁 Found SQL file:', sqlFilePath);
        
        // Check current database state
        console.log('\n🔍 Checking fresh database state...');
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`📊 Current tables: ${tables[0].count}`);
        
        if (tables[0].count > 0) {
            console.log('⚠️ Database is not empty. Clearing it first...');
            await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
            await prisma.$executeRaw`CREATE SCHEMA public`;
            console.log('✅ Database cleared');
        }
        
        // Now use psql to restore the plain SQL file
        console.log('\n🔄 Restoring plain SQL file to fresh database...');
        
        // Set password environment variable
        process.env.PGPASSWORD = 'FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7';
        
        // Use the correct psql path
        const psqlPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';
        const psqlCommand = `"${psqlPath}" -h dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com -p 5432 -U lottery_db_k3w0_user -d lottery_db_k3w0 -f "${sqlFilePath}"`;
        
        console.log('📋 Running psql command...');
        console.log('Command:', psqlCommand);
        
        try {
            execSync(psqlCommand, { 
                stdio: 'inherit',
                cwd: __dirname,
                shell: true
            });
            
            console.log('\n🎉 SQL file restored successfully to fresh database!');
            
            // Verify restoration
            console.log('\n🔍 Verifying restoration...');
            const finalTables = await prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `;
            
            console.log(`📊 Final tables: ${finalTables[0].count}`);
            
            // Check for users
            try {
                const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
                console.log(`👥 Users restored: ${userCount[0].count}`);
            } catch (error) {
                console.log('⚠️ Could not count users (table might not exist yet)');
            }
            
            console.log('\n📋 Next steps:');
            console.log('1. Update Render backend DATABASE_URL to:');
            console.log('   postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0');
            console.log('2. Redeploy backend service');
            console.log('3. Test Vercel frontend login');
            
        } catch (psqlError) {
            console.log('\n⚠️ psql command failed:', psqlError.message);
            console.log('\n💡 Alternative: Use pgAdmin4 Query Tool');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lottery_db_k3w0');
            console.log('3. Open Query Tool');
            console.log('4. Copy and paste the contents of NEW27back plain .sql');
            console.log('5. Execute the SQL commands');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

restoreToFreshDatabase();
