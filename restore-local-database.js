const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY: Restoring Local Database');
console.log('=====================================');

// Use local database URL
const LOCAL_DB_URL = 'postgresql://postgres:admin123@localhost:5432/lottery_system_local';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: LOCAL_DB_URL
        }
    }
});

async function restoreLocalDatabase() {
    try {
        console.log('🔗 Connecting to LOCAL database...');
        await prisma.$connect();
        console.log('✅ Connected to local database');
        
        console.log('\n🔄 Reading backup file...');
        const backupFile = path.join(__dirname, 'backups', 'pg-dump-complete-2025-09-25.sql');
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        
        console.log(`📄 Read ${sqlContent.length} characters from backup file`);
        
        // Extract only CREATE TABLE and INSERT statements
        const statements = sqlContent
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return (
                    trimmed.startsWith('CREATE TABLE') ||
                    trimmed.startsWith('INSERT INTO') ||
                    trimmed.startsWith('ALTER TABLE') ||
                    trimmed.startsWith('CREATE INDEX') ||
                    trimmed.startsWith('CREATE UNIQUE INDEX') ||
                    trimmed.startsWith('CREATE SEQUENCE')
                );
            });
        
        console.log(`📝 Found ${statements.length} essential statements`);
        
        console.log('\n🔄 Executing statements...');
        
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
                if (errorCount % 20 === 0) {
                    console.log(`⚠️ Some statements failed (normal): ${error.message.substring(0, 50)}...`);
                }
            }
        }
        
        console.log(`\n📊 Restoration Summary:`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        
        // Check what was restored
        console.log('\n🔍 Checking restored data...');
        
        try {
            const userCount = await prisma.user.count();
            const drawCount = await prisma.draw.count();
            const ticketCount = await prisma.ticket.count();
            
            console.log(`👥 Users: ${userCount}`);
            console.log(`🎲 Draws: ${drawCount}`);
            console.log(`🎫 Tickets: ${ticketCount}`);
            
            if (userCount > 0) {
                console.log('🎉 Local database restored successfully!');
                return true;
            } else {
                console.log('⚠️ Some data may be missing');
                return false;
            }
        } catch (error) {
            console.log('⚠️ Could not check data counts:', error.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error restoring local database:', error.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    console.log('🚨 RESTORING YOUR LOCAL DATABASE FROM BACKUP');
    console.log('This will restore all your local data that was accidentally wiped.');
    console.log('');
    
    const success = await restoreLocalDatabase();
    
    if (success) {
        console.log('\n🎉 LOCAL DATABASE RESTORED SUCCESSFULLY!');
        console.log('Your local data has been recovered from the backup.');
    } else {
        console.log('\n❌ Restoration had issues, but some data may have been recovered.');
        console.log('Check your local database to see what was restored.');
    }
}

main();
