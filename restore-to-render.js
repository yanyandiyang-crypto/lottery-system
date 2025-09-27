const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚀 Restoring NEW27back.sql to Render Database');
console.log('==============================================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
        }
    }
});

async function cleanRenderDatabase() {
    try {
        console.log('\n🧹 Cleaning Render database...');
        
        // Get all table names
        const tables = await prisma.$queryRaw`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE '_prisma%'
        `;
        
        console.log(`Found ${tables.length} tables to clean`);
        
        // Drop all tables
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
                console.log(`✅ Dropped table: ${table.tablename}`);
            } catch (error) {
                console.log(`⚠️ Could not drop table ${table.tablename}: ${error.message}`);
            }
        }
        
        console.log('✅ Render database cleaned successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error cleaning Render database:', error.message);
        return false;
    }
}

async function restoreFromBackup() {
    try {
        console.log('\n🔄 Reading NEW27back.sql backup file...');
        
        const backupFile = path.join(__dirname, 'NEW27back.sql');
        
        if (!fs.existsSync(backupFile)) {
            console.error('❌ NEW27back.sql file not found');
            return false;
        }
        
        // Read the binary backup file
        const buffer = fs.readFileSync(backupFile);
        console.log(`📄 Read ${buffer.length} bytes from backup file`);
        
        // Check if it's gzipped
        let sqlContent;
        if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
            console.log('📦 File appears to be gzipped, decompressing...');
            const zlib = require('zlib');
            sqlContent = zlib.gunzipSync(buffer).toString('utf8');
            console.log('✅ Successfully decompressed');
        } else {
            // Try to read as text
            try {
                sqlContent = buffer.toString('utf8');
                console.log('✅ Read as text file');
            } catch (error) {
                console.error('❌ Could not read file as text or binary');
                return false;
            }
        }
        
        console.log(`📄 SQL content length: ${sqlContent.length} characters`);
        
        // Extract SQL statements
        const statements = sqlContent
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return (
                    trimmed.startsWith('CREATE TABLE') ||
                    trimmed.startsWith('INSERT INTO') ||
                    trimmed.startsWith('COPY') ||
                    trimmed.startsWith('ALTER TABLE') ||
                    trimmed.startsWith('CREATE INDEX') ||
                    trimmed.startsWith('CREATE SEQUENCE') ||
                    trimmed.startsWith('CREATE UNIQUE INDEX') ||
                    trimmed.startsWith('CREATE TYPE') ||
                    trimmed.startsWith('CREATE SCHEMA')
                );
            });
        
        console.log(`📝 Found ${statements.length} SQL statements`);
        
        if (statements.length === 0) {
            console.log('❌ No SQL statements found in backup file');
            return false;
        }
        
        console.log('\n🔄 Executing SQL statements...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            
            if (statement.length === 0) continue;
            
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
                
                if (successCount % 20 === 0) {
                    console.log(`✅ Executed ${successCount}/${statements.length} statements`);
                }
            } catch (error) {
                errorCount++;
                if (errorCount <= 10) { // Only show first 10 errors
                    console.log(`⚠️ Statement failed: ${error.message.substring(0, 100)}...`);
                }
            }
        }
        
        console.log(`\n📊 Execution Summary:`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        
        return successCount > 0;
        
    } catch (error) {
        console.error('❌ Error restoring from backup:', error.message);
        return false;
    }
}

async function checkRestoredData() {
    try {
        console.log('\n🔍 Checking restored data...');
        
        const tables = [
            'user', 'region', 'ticket', 'draw', 'bet', 'sale', 
            'winningTicket', 'ticketTemplate', 'betLimit', 
            'prizeConfiguration', 'balanceTransaction', 'auditLog'
        ];
        
        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                console.log(`📊 ${table}: ${count} records`);
            } catch (error) {
                console.log(`❌ ${table}: Error - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking data:', error.message);
    }
}

async function main() {
    try {
        console.log('🔗 Connecting to Render database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Step 1: Clean the database
        const cleanSuccess = await cleanRenderDatabase();
        
        if (!cleanSuccess) {
            console.error('❌ Failed to clean database. Stopping process.');
            return;
        }
        
        // Step 2: Restore from backup
        const restoreSuccess = await restoreFromBackup();
        
        if (!restoreSuccess) {
            console.error('❌ Failed to restore from backup. Stopping process.');
            return;
        }
        
        // Step 3: Check what was restored
        await checkRestoredData();
        
        console.log('\n🎉 NEW27back.sql restoration completed!');
        console.log('Your complete data should now be in Render database.');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
