const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const zlib = require('zlib');

console.log('🚨 RESTORING FROM NEW27back.sql');
console.log('===============================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function tryRestoreBackup() {
    try {
        console.log('\n🔄 Attempting to restore NEW27back.sql...');
        
        // Try reading as regular file first
        let sqlContent;
        try {
            sqlContent = fs.readFileSync('NEW27back.sql', 'utf8');
            console.log('✅ Read as text file');
        } catch (error) {
            console.log('⚠️ Could not read as text, trying as binary...');
            
            // Try reading as binary and check if it's compressed
            const buffer = fs.readFileSync('NEW27back.sql');
            
            // Check if it starts with gzip magic number
            if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
                console.log('📦 File appears to be gzipped, decompressing...');
                sqlContent = zlib.gunzipSync(buffer).toString('utf8');
                console.log('✅ Successfully decompressed');
            } else {
                console.log('❌ File format not recognized');
                return false;
            }
        }
        
        console.log(`📄 Read ${sqlContent.length} characters from backup file`);
        
        // Check if it contains SQL statements
        if (sqlContent.includes('COPY') || sqlContent.includes('INSERT') || sqlContent.includes('CREATE TABLE')) {
            console.log('✅ File contains SQL statements');
            
            // Extract and execute SQL statements
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
                        trimmed.startsWith('CREATE UNIQUE INDEX')
                    );
                });
            
            console.log(`📝 Found ${statements.length} SQL statements`);
            
            if (statements.length > 0) {
                console.log('\n🔄 Executing SQL statements...');
                
                let successCount = 0;
                let errorCount = 0;
                
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i].trim();
                    
                    if (statement.length === 0) continue;
                    
                    try {
                        await prisma.$executeRawUnsafe(statement);
                        successCount++;
                        
                        if (successCount % 10 === 0) {
                            console.log(`✅ Executed ${successCount}/${statements.length} statements`);
                        }
                    } catch (error) {
                        errorCount++;
                        if (errorCount <= 5) { // Only show first 5 errors
                            console.log(`⚠️ Statement failed: ${error.message.substring(0, 100)}...`);
                        }
                    }
                }
                
                console.log(`\n📊 Execution Summary:`);
                console.log(`✅ Successful: ${successCount}`);
                console.log(`❌ Failed: ${errorCount}`);
                
                return successCount > 0;
            } else {
                console.log('❌ No SQL statements found in file');
                return false;
            }
        } else {
            console.log('❌ File does not appear to contain SQL statements');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error restoring backup:', error.message);
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
        console.log('🔗 Connecting to LOCAL database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Try to restore the backup
        const success = await tryRestoreBackup();
        
        if (success) {
            // Check what was restored
            await checkRestoredData();
            
            console.log('\n🎉 BACKUP RESTORATION COMPLETED!');
            console.log('Your data should now be restored from NEW27back.sql');
        } else {
            console.log('\n❌ Restoration failed. The backup file format may not be supported.');
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
