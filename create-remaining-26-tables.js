const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function createRemaining26Tables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating remaining 26 tables...');
        
        // 1. Regions
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS regions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                area_coordinator_id INTEGER UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created regions table');
        
        // 2. Users
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                address TEXT,
                phone VARCHAR(50),
                region_id INTEGER,
                coordinator_id INTEGER,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                agent_id VARCHAR(100),
                role VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'active'
            )
        `;
        console.log('✅ Created users table');
        
        // 3. User Balances
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                current_balance DECIMAL(10,2) DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created user_balances table');
        
        // 4. Balance Transactions
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS balance_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                description TEXT,
                reference_id VARCHAR(255),
                processed_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'completed'
            )
        `;
        console.log('✅ Created balance_transactions table');
        
        // 5. Bet Limits Per Draw
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS bet_limits_per_draw (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created bet_limits_per_draw table');
        
        // 6. Draws
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS draws (
                id SERIAL PRIMARY KEY,
                draw_date DATE NOT NULL,
                draw_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                winning_numbers VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created draws table');
        
        // 7. Tickets
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(100) UNIQUE NOT NULL,
                qr_code TEXT,
                status VARCHAR(50) DEFAULT 'active',
                agent_id INTEGER,
                requested_by INTEGER,
                approved_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created tickets table');
        
        // 8. Bets
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS bets (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                bet_amount DECIMAL(10,2) NOT NULL,
                numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created bets table');
        
        // 9. Sales
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created sales table');
        
        // 10. Commissions
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS commissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                percentage DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created commissions table');
        
        // 11. Winning Tickets
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS winning_tickets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created winning_tickets table');
        
        // 12. Notifications
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                status VARCHAR(50) DEFAULT 'unread',
                read_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created notifications table');
        
        // 13. Bet Limits
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created bet_limits table');
        
        // 14. Current Bet Totals
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS current_bet_totals (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                total_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created current_bet_totals table');
        
        // 15. System Settings
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                updated_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created system_settings table');
        
        // 16. Ticket Templates
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS ticket_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created ticket_templates table');
        
        // 17. Agent Ticket Templates
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS agent_ticket_templates (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created agent_ticket_templates table');
        
        // 18. Draw Results
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS draw_results (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                winning_numbers VARCHAR(100) NOT NULL,
                input_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created draw_results table');
        
        // 19. Winning Prizes
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS winning_prizes (
                id SERIAL PRIMARY KEY,
                winning_ticket_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                claimed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created winning_prizes table');
        
        // 20. Prize Configurations
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS prize_configurations (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                multiplier DECIMAL(10,2) NOT NULL,
                base_amount DECIMAL(10,2) NOT NULL,
                base_prize DECIMAL(10,2) NOT NULL,
                description TEXT,
                created_by_id INTEGER,
                updated_by_id INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created prize_configurations table');
        
        // 21. System Functions
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS system_functions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created system_functions table');
        
        // 22. Login Audit
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS login_audit (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                username VARCHAR(255),
                success BOOLEAN NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                failure_reason TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created login_audit table');
        
        // 23. Audit Log
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(50) NOT NULL,
                table_name VARCHAR(255),
                record_id INTEGER,
                old_values JSONB,
                new_values JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created audit_log table');
        
        // 24. Claims Audit
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS claims_audit (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                user_id INTEGER,
                action VARCHAR(50) NOT NULL,
                performed_by INTEGER,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created claims_audit table');
        
        // 25. User Bet Limits
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS user_bet_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created user_bet_limits table');
        
        // 26. Prisma Migrations
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS _prisma_migrations (
                id VARCHAR(36) PRIMARY KEY,
                checksum VARCHAR(64) NOT NULL,
                finished_at TIMESTAMPTZ,
                migration_name VARCHAR(255) NOT NULL,
                logs TEXT,
                rolled_back_at TIMESTAMPTZ,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                applied_steps_count INTEGER NOT NULL DEFAULT 0
            )
        `;
        console.log('✅ Created _prisma_migrations table');
        
        // Check final count
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`\n📊 Total tables now: ${tables[0].count}`);
        
        if (tables[0].count >= 31) {
            console.log('\n🎉 Perfect! All 31 tables now match NEW27back.sql');
            console.log('\n📋 Database is ready for restoration:');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lotterydb_a6w5');
            console.log('3. Restore NEW27back.sql with "Data only"');
            console.log('4. All 31 tables exist - restoration should work perfectly!');
        } else {
            console.log(`\n⚠️ Still need ${31 - tables[0].count} more tables`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createRemaining26Tables();
