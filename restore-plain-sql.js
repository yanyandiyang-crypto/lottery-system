const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🔄 Restoring Plain SQL Backup');
console.log('============================');

const RENDER_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: RENDER_DB_URL
        }
    }
});

async function restorePlainSQL() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to Render database');
        
        // Check if the plain SQL file exists
        const sqlFilePath = 'C:\\Users\\Lags\\Desktop\\NEW27back plain .sql';
        
        if (!fs.existsSync(sqlFilePath)) {
            console.log('❌ SQL file not found at:', sqlFilePath);
            console.log('📋 Please check the file path');
            return;
        }
        
        console.log('📁 Found SQL file:', sqlFilePath);
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`📊 SQL file size: ${sqlContent.length} characters`);
        
        // Split SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 Found ${statements.length} SQL statements`);
        
        console.log('\n🔄 Executing SQL statements...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                // Skip comments and empty statements
                if (statement.startsWith('--') || statement.length < 10) {
                    continue;
                }
                
                // Execute the statement
                await prisma.$executeRawUnsafe(statement);
                successCount++;
                
                if (successCount % 10 === 0) {
                    console.log(`✅ Executed ${successCount} statements...`);
                }
                
            } catch (error) {
                errorCount++;
                console.log(`❌ Error in statement ${i + 1}: ${error.message.substring(0, 100)}...`);
                
                // Continue with next statement
                continue;
            }
        }
        
        console.log('\n📊 Execution Summary:');
        console.log(`✅ Successful: ${successCount} statements`);
        console.log(`❌ Errors: ${errorCount} statements`);
        
        if (successCount > 0) {
            console.log('\n🎉 SQL restoration completed!');
            console.log('\n📋 Next steps:');
            console.log('1. Update Render backend DATABASE_URL');
            console.log('2. Redeploy backend service');
            console.log('3. Test Vercel frontend login');
        } else {
            console.log('\n⚠️ No statements were executed successfully');
            console.log('📋 Check the SQL file format and try again');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

restorePlainSQL();
