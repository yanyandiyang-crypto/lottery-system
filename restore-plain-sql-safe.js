const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🔄 Safe Plain SQL Restoration');
console.log('============================');

const RENDER_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: RENDER_DB_URL
        }
    }
});

async function restorePlainSQLSafe() {
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
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        console.log(`📊 SQL file size: ${sqlContent.length} characters`);
        
        // First, let's apply the Prisma schema to ensure all tables exist
        console.log('\n🔄 Applying Prisma schema first...');
        process.env.DATABASE_URL = RENDER_DB_URL;
        
        const { execSync } = require('child_process');
        execSync('npx prisma db push', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        console.log('✅ Prisma schema applied');
        
        // Now let's process the SQL file in chunks
        console.log('\n🔄 Processing SQL file...');
        
        // Split by semicolon and process in smaller batches
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SET'));
        
        console.log(`📋 Found ${statements.length} SQL statements to process`);
        
        let successCount = 0;
        let errorCount = 0;
        const batchSize = 50; // Process in batches of 50
        
        for (let i = 0; i < statements.length; i += batchSize) {
            const batch = statements.slice(i, i + batchSize);
            
            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} statements)...`);
            
            for (let j = 0; j < batch.length; j++) {
                const statement = batch[j];
                
                try {
                    // Skip problematic statements
                    if (statement.includes('CREATE EXTENSION') || 
                        statement.includes('CREATE TYPE') ||
                        statement.includes('ALTER TABLE') ||
                        statement.includes('CREATE INDEX') ||
                        statement.includes('CREATE SEQUENCE') ||
                        statement.includes('ALTER SEQUENCE')) {
                        continue;
                    }
                    
                    // Only process INSERT statements
                    if (statement.toUpperCase().startsWith('INSERT')) {
                        await prisma.$executeRawUnsafe(statement);
                        successCount++;
                    }
                    
                } catch (error) {
                    errorCount++;
                    // Continue with next statement
                    continue;
                }
            }
            
            console.log(`✅ Batch completed. Success: ${successCount}, Errors: ${errorCount}`);
        }
        
        console.log('\n📊 Final Summary:');
        console.log(`✅ Successful INSERTs: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('\n🎉 Data restoration completed!');
            console.log('\n📋 Next steps:');
            console.log('1. Update Render backend DATABASE_URL');
            console.log('2. Redeploy backend service');
            console.log('3. Test Vercel frontend login');
        } else {
            console.log('\n⚠️ No data was restored');
            console.log('📋 Try the essential data approach instead');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

restorePlainSQLSafe();
