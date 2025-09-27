const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚨 COMPLETE LOCAL DATABASE RESTORATION');
console.log('=====================================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:admin123@localhost:5432/lottery_system_local'
        }
    }
});

async function extractDataFromBackup() {
    try {
        console.log('\n🔄 Extracting data from backup...');
        
        const backupFile = path.join(__dirname, 'backups', 'pg-dump-complete-2025-09-25.sql');
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        
        console.log(`📄 Read ${sqlContent.length} characters from backup file`);
        
        // Extract INSERT statements for each table
        const insertStatements = {};
        const lines = sqlContent.split('\n');
        
        let currentTable = null;
        let currentData = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('INSERT INTO')) {
                // Save previous table data
                if (currentTable && currentData.length > 0) {
                    insertStatements[currentTable] = currentData;
                }
                
                // Start new table
                const match = trimmed.match(/INSERT INTO "?(\w+)"?/);
                if (match) {
                    currentTable = match[1];
                    currentData = [trimmed];
                }
            } else if (trimmed.startsWith('VALUES') || trimmed.startsWith('(')) {
                if (currentTable) {
                    currentData.push(trimmed);
                }
            } else if (trimmed === ';' && currentTable) {
                // End of INSERT statement
                if (currentData.length > 0) {
                    insertStatements[currentTable] = currentData;
                }
                currentTable = null;
                currentData = [];
            }
        }
        
        // Save last table if exists
        if (currentTable && currentData.length > 0) {
            insertStatements[currentTable] = currentData;
        }
        
        console.log(`📝 Found INSERT statements for ${Object.keys(insertStatements).length} tables`);
        
        // Show what we found
        for (const [table, statements] of Object.entries(insertStatements)) {
            console.log(`  - ${table}: ${statements.length} statements`);
        }
        
        return insertStatements;
        
    } catch (error) {
        console.error('❌ Error extracting data:', error.message);
        return {};
    }
}

async function restoreTableData(tableName, statements) {
    try {
        console.log(`\n🔄 Restoring ${tableName}...`);
        
        // Clear existing data first
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
            console.log(`🗑️ Cleared existing ${tableName} data`);
        } catch (error) {
            console.log(`⚠️ Could not clear ${tableName}: ${error.message}`);
        }
        
        // Execute INSERT statements
        let successCount = 0;
        let errorCount = 0;
        
        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
            } catch (error) {
                errorCount++;
                if (errorCount <= 3) { // Only show first 3 errors
                    console.log(`⚠️ Statement failed: ${error.message.substring(0, 100)}...`);
                }
            }
        }
        
        console.log(`✅ ${tableName}: ${successCount} successful, ${errorCount} failed`);
        return successCount > 0;
        
    } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error.message);
        return false;
    }
}

async function restoreAllData() {
    try {
        console.log('\n🔄 Starting complete data restoration...');
        
        // Extract data from backup
        const insertStatements = await extractDataFromBackup();
        
        if (Object.keys(insertStatements).length === 0) {
            console.log('❌ No data found in backup');
            return false;
        }
        
        // Restore data in dependency order
        const restoreOrder = [
            'regions',
            'users', 
            'bet_limits',
            'prize_configurations',
            'ticket_templates',
            'draws',
            'tickets',
            'bets',
            'sales',
            'balance_transactions',
            'winning_tickets',
            'audit_log',
            'login_audit',
            'notifications',
            'commissions',
            'agent_ticket_templates',
            'current_bet_totals',
            'draw_results',
            'rate_limits',
            'claims_audit'
        ];
        
        let totalSuccess = 0;
        let totalFailed = 0;
        
        for (const tableName of restoreOrder) {
            if (insertStatements[tableName]) {
                const success = await restoreTableData(tableName, insertStatements[tableName]);
                if (success) totalSuccess++;
                else totalFailed++;
            }
        }
        
        console.log(`\n📊 Restoration Summary:`);
        console.log(`✅ Tables restored: ${totalSuccess}`);
        console.log(`❌ Tables failed: ${totalFailed}`);
        
        return totalSuccess > 0;
        
    } catch (error) {
        console.error('❌ Error in complete restoration:', error.message);
        return false;
    }
}

async function checkFinalData() {
    try {
        console.log('\n🔍 Final data check...');
        
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
        console.error('❌ Error checking final data:', error.message);
    }
}

async function main() {
    try {
        console.log('🔗 Connecting to LOCAL database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Restore all data
        const success = await restoreAllData();
        
        if (success) {
            // Check what was restored
            await checkFinalData();
            
            console.log('\n🎉 COMPLETE LOCAL DATABASE RESTORATION FINISHED!');
            console.log('All your data should now be restored.');
        } else {
            console.log('\n❌ Restoration had issues. Some data may be missing.');
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
