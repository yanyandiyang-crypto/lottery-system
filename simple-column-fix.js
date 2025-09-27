const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function simpleColumnFix() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Fixing column names one by one...');
        
        // Fix agent_ticket_templates
        await prisma.$executeRaw`DROP TABLE IF EXISTS agent_ticket_templates`;
        await prisma.$executeRaw`
            CREATE TABLE agent_ticket_templates (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                assigned_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Fixed agent_ticket_templates');
        
        // Fix audit_log
        await prisma.$executeRaw`DROP TABLE IF EXISTS audit_log`;
        await prisma.$executeRaw`
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
        `;
        console.log('✅ Fixed audit_log');
        
        // Fix balance_transactions
        await prisma.$executeRaw`DROP TABLE IF EXISTS balance_transactions`;
        await prisma.$executeRaw`
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
        `;
        console.log('✅ Fixed balance_transactions');
        
        // Fix bet_limits
        await prisma.$executeRaw`DROP TABLE IF EXISTS bet_limits`;
        await prisma.$executeRaw`
            CREATE TABLE bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_by INTEGER,
                "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Fixed bet_limits');
        
        // Fix bet_limits_per_draw
        await prisma.$executeRaw`DROP TABLE IF EXISTS bet_limits_per_draw`;
        await prisma.$executeRaw`
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
        `;
        console.log('✅ Fixed bet_limits_per_draw');
        
        // Fix bets
        await prisma.$executeRaw`DROP TABLE IF EXISTS bets`;
        await prisma.$executeRaw`
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                bet_combination VARCHAR(100) NOT NULL,
                bet_amount DECIMAL(10,2) NOT NULL,
                "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Fixed bets');
        
        // Fix claims_audit
        await prisma.$executeRaw`DROP TABLE IF EXISTS claims_audit`;
        await prisma.$executeRaw`
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
        `;
        console.log('✅ Fixed claims_audit');
        
        // Fix commissions
        await prisma.$executeRaw`DROP TABLE IF EXISTS commissions`;
        await prisma.$executeRaw`
            CREATE TABLE commissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                commission_rate DECIMAL(5,2) NOT NULL,
                commission_amount DECIMAL(10,2) NOT NULL,
                "createdAt" TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Fixed commissions');
        
        // Fix rate_limits
        await prisma.$executeRaw`DROP TABLE IF EXISTS rate_limits`;
        await prisma.$executeRaw`
            CREATE TABLE rate_limits (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) NOT NULL,
                count INTEGER DEFAULT 0,
                expires_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Fixed rate_limits');
        
        console.log('\n🎉 All column names fixed!');
        console.log('\n📋 Now try restoring NEW27back.sql again');
        console.log('📋 The column mismatches should be resolved');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

simpleColumnFix();
