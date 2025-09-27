const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking Restored Tables');
console.log('===========================');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function checkRestoredTables() {
    try {
        console.log('🔗 Connecting to clean database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        console.log('\n📊 Checking all tables and their data...');
        console.log('==========================================');
        
        // List all tables
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`📋 Found ${tables.length} tables in database:`);
        
        for (const table of tables) {
            const tableName = table.table_name;
            
            try {
                // Get count for each table
                const countResult = await prisma.$queryRaw`
                    SELECT COUNT(*) as count 
                    FROM ${prisma.$queryRawUnsafe(`"${tableName}"`)}
                `;
                
                const count = countResult[0]?.count || 0;
                console.log(`📊 ${tableName}: ${count} records`);
                
            } catch (error) {
                console.log(`❌ ${tableName}: Error checking count - ${error.message}`);
            }
        }
        
        console.log('\n🔍 Expected tables from NEW27back.sql:');
        console.log('=====================================');
        
        const expectedTables = [
            'users', 'regions', 'tickets', 'draws', 'bets', 
            'draw_results', 'user_balances', 'balance_transactions',
            'sales', 'commissions', 'winning_tickets', 'winning_prizes',
            'bet_limits', 'prize_configurations', 'ticket_templates',
            'system_functions', 'system_settings', 'agent_ticket_templates',
            'bet_limits_per_draw', 'current_bet_totals', 'user_bet_limits'
        ];
        
        for (const expectedTable of expectedTables) {
            try {
                const countResult = await prisma.$queryRaw`
                    SELECT COUNT(*) as count 
                    FROM ${prisma.$queryRawUnsafe(`"${expectedTable}"`)}
                `;
                
                const count = countResult[0]?.count || 0;
                const status = count > 0 ? '✅' : '❌';
                console.log(`${status} ${expectedTable}: ${count} records`);
                
            } catch (error) {
                console.log(`❌ ${expectedTable}: Table not found or error`);
            }
        }
        
        console.log('\n💡 Possible Issues:');
        console.log('==================');
        console.log('1. pgAdmin4 restore failed partially');
        console.log('2. Some tables had constraint violations');
        console.log('3. NEW27back.sql is missing some data');
        console.log('4. Restore process was interrupted');
        
        console.log('\n🔧 Solutions:');
        console.log('============');
        console.log('1. Check pgAdmin4 restore logs for errors');
        console.log('2. Try restoring again with different options');
        console.log('3. Use --disable-triggers flag if using pg_restore');
        console.log('4. Check if NEW27back.sql contains all expected data');
        
    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkRestoredTables();
