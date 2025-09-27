const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function fixAllColumnNames() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Fixing all column names to match NEW27back.sql exactly...');
        
        // Drop and recreate all tables with correct column names from the backup
        const tableDefinitions = [
            {
                name: 'agent_ticket_templates',
                sql: `
                    CREATE TABLE agent_ticket_templates (
                        id SERIAL PRIMARY KEY,
                        agent_id INTEGER NOT NULL,
                        template_id INTEGER NOT NULL,
                        assigned_at TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'audit_log',
                sql: `
                    CREATE TABLE audit_log (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER,
                        table_name VARCHAR(255),
                        record_id INTEGER,
                        details JSONB,
                        ip_address VARCHAR(45),
                        user_agent TEXT,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        operation VARCHAR(50),
                        new_values JSONB,
                        old_values JSONB,
                        action VARCHAR(50) NOT NULL
                    )
                `
            },
            {
                name: 'balance_transactions',
                sql: `
                    CREATE TABLE balance_transactions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        amount DECIMAL(10,2) NOT NULL,
                        transaction_type VARCHAR(50) NOT NULL,
                        description TEXT,
                        reference_id VARCHAR(255),
                        processed_by INTEGER,
                        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                        status VARCHAR(20) DEFAULT 'completed'
                    )
                `
            },
            {
                name: 'bet_limits',
                sql: `
                    CREATE TABLE bet_limits (
                        id SERIAL PRIMARY KEY,
                        bet_type VARCHAR(50) NOT NULL,
                        limit_amount DECIMAL(10,2) NOT NULL,
                        is_active BOOLEAN DEFAULT true,
                        created_by INTEGER,
                        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'bet_limits_per_draw',
                sql: `
                    CREATE TABLE bet_limits_per_draw (
                        id SERIAL PRIMARY KEY,
                        draw_id INTEGER NOT NULL,
                        bet_combination VARCHAR(100),
                        bet_type VARCHAR(50) NOT NULL,
                        current_amount DECIMAL(10,2) DEFAULT 0,
                        limit_amount DECIMAL(10,2) NOT NULL,
                        is_sold_out BOOLEAN DEFAULT false,
                        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'bets',
                sql: `
                    CREATE TABLE bets (
                        id SERIAL PRIMARY KEY,
                        ticket_id INTEGER NOT NULL,
                        bet_type VARCHAR(50) NOT NULL,
                        bet_combination VARCHAR(100) NOT NULL,
                        bet_amount DECIMAL(10,2) NOT NULL,
                        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'claims_audit',
                sql: `
                    CREATE TABLE claims_audit (
                        id SERIAL PRIMARY KEY,
                        ticket_id INTEGER NOT NULL,
                        action VARCHAR(50) NOT NULL,
                        performed_by INTEGER,
                        notes TEXT,
                        old_status VARCHAR(50),
                        new_status VARCHAR(50),
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        claimer_name VARCHAR(255),
                        claimer_phone VARCHAR(50),
                        claimer_address TEXT,
                        prize_amount DECIMAL(10,2)
                    )
                `
            },
            {
                name: 'commissions',
                sql: `
                    CREATE TABLE commissions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        draw_id INTEGER NOT NULL,
                        commission_rate DECIMAL(5,2) NOT NULL,
                        commission_amount DECIMAL(10,2) NOT NULL,
                        "createdAt" TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'current_bet_totals',
                sql: `
                    CREATE TABLE current_bet_totals (
                        id SERIAL PRIMARY KEY,
                        draw_id INTEGER NOT NULL,
                        bet_type VARCHAR(50) NOT NULL,
                        total_amount DECIMAL(10,2) DEFAULT 0,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            },
            {
                name: 'rate_limits',
                sql: `
                    CREATE TABLE rate_limits (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(255) NOT NULL,
                        count INTEGER DEFAULT 0,
                        expires_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                `
            }
        ];
        
        // Drop and recreate each table
        for (const tableDef of tableDefinitions) {
            await prisma.$executeRaw`DROP TABLE IF EXISTS ${prisma.$queryRawUnsafe(`"${tableDef.name}"`)}`;
            await prisma.$executeRawUnsafe(tableDef.sql);
            console.log(`✅ Fixed ${tableDef.name} table structure`);
        }
        
        console.log('\n🎉 All column names fixed to match NEW27back.sql');
        console.log('\n📋 Key fixes applied:');
        console.log('- agent_ticket_templates: added assigned_at column');
        console.log('- audit_log: added details, operation, new_values, old_values columns');
        console.log('- balance_transactions: changed createdAt to "createdAt"');
        console.log('- bet_limits: added is_active, changed to "createdAt"/"updatedAt"');
        console.log('- bet_limits_per_draw: added bet_combination, current_amount, is_sold_out');
        console.log('- bets: added ticket_id, bet_combination columns');
        console.log('- claims_audit: added notes, old_status, new_status, claimer_* columns');
        console.log('- commissions: added draw_id, commission_rate columns');
        console.log('- rate_limits: fixed to key, count, expires_at columns');
        
        console.log('\n🔄 Now try restoring NEW27back.sql again with pgAdmin4');
        console.log('📋 The column mismatches should be resolved');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAllColumnNames();
