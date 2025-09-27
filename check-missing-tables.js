const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function checkMissingTables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        // Get all tables that exist
        const existingTables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`📊 Current tables: ${existingTables.length}`);
        existingTables.forEach(table => {
            console.log(`- ${table.table_name}`);
        });
        
        // Expected tables from Prisma schema (31 total)
        const expectedTables = [
            'regions', 'users', 'system_functions', 'ticket_templates', 'bet_limits',
            'prize_configurations', 'system_settings', 'draws', 'draw_results', 'user_balances',
            'tickets', 'bets', 'sales', 'commissions', 'winning_tickets', 'winning_prizes',
            'balance_transactions', 'agent_ticket_templates', 'bet_limits_per_draw',
            'current_bet_totals', 'user_bet_limits', 'audit_log', 'login_audit', 'claims_audit',
            'notifications', '_prisma_migrations', 'user_bet_limits', 'audit_logs',
            'login_audits', 'claims_audits', 'notification_settings'
        ];
        
        console.log('\n🔍 Checking for missing tables...');
        
        const existingTableNames = existingTables.map(t => t.table_name);
        const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`\n❌ Missing ${missingTables.length} tables:`);
            missingTables.forEach(table => {
                console.log(`- ${table}`);
            });
        } else {
            console.log('\n✅ All expected tables exist!');
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`- Existing: ${existingTables.length} tables`);
        console.log(`- Expected: ${expectedTables.length} tables`);
        console.log(`- Missing: ${missingTables.length} tables`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMissingTables();
