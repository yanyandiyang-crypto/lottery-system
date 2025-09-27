const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Restoring Plain SQL with Correct psql Path');
console.log('============================================');

const RENDER_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: RENDER_DB_URL
        }
    }
});

async function restoreWithCorrectPsql() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to Render database');
        
        // Check if the plain SQL file exists
        const sqlFilePath = 'C:\\Users\\Lags\\Desktop\\NEW27back plain .sql';
        
        if (!fs.existsSync(sqlFilePath)) {
            console.log('❌ SQL file not found at:', sqlFilePath);
            return;
        }
        
        console.log('📁 Found SQL file:', sqlFilePath);
        
        // First, clear the database completely
        console.log('\n🔄 Clearing database completely...');
        await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
        await prisma.$executeRaw`CREATE SCHEMA public`;
        console.log('✅ Database cleared');
        
        // Now use the correct psql path to restore the plain SQL file
        console.log('\n🔄 Restoring plain SQL file with psql...');
        
        // Set password environment variable
        process.env.PGPASSWORD = 'cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV';
        
        // Use the correct psql path
        const psqlPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';
        const psqlCommand = `"${psqlPath}" -h dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com -p 5432 -U lotterydb_a6w5_user -d lotterydb_a6w5 -f "${sqlFilePath}"`;
        
        console.log('📋 Running psql command...');
        console.log('Command:', psqlCommand);
        
        try {
            execSync(psqlCommand, { 
                stdio: 'inherit',
                cwd: __dirname,
                shell: true
            });
            
            console.log('\n🎉 SQL file restored successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Update Render backend DATABASE_URL');
            console.log('2. Redeploy backend service');
            console.log('3. Test Vercel frontend login');
            
        } catch (psqlError) {
            console.log('\n⚠️ psql command failed:', psqlError.message);
            console.log('\n💡 Alternative: Use pgAdmin4 Query Tool');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lotterydb_a6w5');
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

restoreWithCorrectPsql();
