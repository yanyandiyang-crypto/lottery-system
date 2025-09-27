const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚨 RESTORING BINARY BACKUP');
console.log('==========================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function restoreBinaryBackup() {
    try {
        console.log('\n🔄 Attempting to restore binary backup...');
        
        // First, let's try to use pg_restore if available
        try {
            console.log('🔄 Trying pg_restore...');
            
            // Set environment variables
            process.env.PGPASSWORD = 'admin123';
            
            // Try to restore using pg_restore
            const command = `pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=lottery_system_local NEW27back.sql`;
            
            console.log(`Command: ${command}`);
            
            const result = execSync(command, { 
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 30000 // 30 second timeout
            });
            
            console.log('✅ pg_restore completed successfully');
            console.log('Output:', result);
            return true;
            
        } catch (error) {
            console.log('⚠️ pg_restore failed:', error.message);
            
            // If pg_restore fails, try alternative approach
            console.log('\n🔄 Trying alternative approach...');
            
            // Try to convert binary to SQL first
            try {
                const convertCommand = `pg_restore --schema-only NEW27back.sql > schema.sql`;
                execSync(convertCommand, { stdio: 'pipe' });
                console.log('✅ Converted schema to SQL');
                
                const dataCommand = `pg_restore --data-only NEW27back.sql > data.sql`;
                execSync(dataCommand, { stdio: 'pipe' });
                console.log('✅ Converted data to SQL');
                
                // Now try to execute the SQL files
                if (fs.existsSync('schema.sql')) {
                    console.log('🔄 Executing schema...');
                    const schemaContent = fs.readFileSync('schema.sql', 'utf8');
                    await executeSQLStatements(schemaContent);
                }
                
                if (fs.existsSync('data.sql')) {
                    console.log('🔄 Executing data...');
                    const dataContent = fs.readFileSync('data.sql', 'utf8');
                    await executeSQLStatements(dataContent);
                }
                
                return true;
                
            } catch (convertError) {
                console.log('⚠️ Conversion failed:', convertError.message);
                return false;
            }
        }
        
    } catch (error) {
        console.error('❌ Error restoring binary backup:', error.message);
        return false;
    }
}

async function executeSQLStatements(sqlContent) {
    try {
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (statement.length === 0) continue;
            
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
                
                if (successCount % 10 === 0) {
                    console.log(`✅ Executed ${successCount}/${statements.length} statements`);
                }
            } catch (error) {
                errorCount++;
                if (errorCount <= 5) {
                    console.log(`⚠️ Statement failed: ${error.message.substring(0, 100)}...`);
                }
            }
        }
        
        console.log(`📊 Executed ${successCount} statements successfully, ${errorCount} failed`);
        
    } catch (error) {
        console.error('❌ Error executing SQL statements:', error.message);
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
        
        // Try to restore the binary backup
        const success = await restoreBinaryBackup();
        
        if (success) {
            // Check what was restored
            await checkRestoredData();
            
            console.log('\n🎉 BINARY BACKUP RESTORATION COMPLETED!');
            console.log('Your data should now be restored from NEW27back.sql');
        } else {
            console.log('\n❌ Restoration failed. The binary backup format may not be supported.');
            console.log('You may need to use pgAdmin4 or install PostgreSQL tools.');
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
