const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function createAll30Tables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating all 30 tables to match NEW27back.sql...');
        
        // Drop and recreate schema to ensure clean state
        await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
        await prisma.$executeRaw`CREATE SCHEMA public`;
        console.log('✅ Cleared schema');
        
        // Create all 30 tables in one go
        const allTablesSQL = `
            -- Create ENUM types first
            CREATE TYPE "UserRole" AS ENUM ('superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator');
            CREATE TYPE "BetType" AS ENUM ('standard', 'rambolito');
            CREATE TYPE "TicketStatus" AS ENUM ('active', 'claimed', 'expired', 'cancelled');
            CREATE TYPE "DrawStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');
            CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal', 'winning', 'commission', 'refund');
            CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CLAIM', 'VERIFY');
            CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'error', 'success');
            CREATE TYPE "NotificationStatus" AS ENUM ('unread', 'read', 'archived');
            
            -- 1. Regions
            CREATE TABLE regions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                area_coordinator_id INTEGER UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 2. Users
            CREATE TABLE users (
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
            );
            
            -- 3. User Balances
            CREATE TABLE user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL,
                current_balance DECIMAL(10,2) DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 4. Balance Transactions
            CREATE TABLE balance_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                description TEXT,
                reference_id VARCHAR(255),
                processed_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'completed'
            );
            
            -- 5. Bet Limits Per Draw
            CREATE TABLE bet_limits_per_draw (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 6. Draws
            CREATE TABLE draws (
                id SERIAL PRIMARY KEY,
                draw_date DATE NOT NULL,
                draw_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                winning_numbers VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 7. Tickets
            CREATE TABLE tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(100) UNIQUE NOT NULL,
                qr_code TEXT,
                status VARCHAR(50) DEFAULT 'active',
                agent_id INTEGER,
                requested_by INTEGER,
                approved_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 8. Bets
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                bet_amount DECIMAL(10,2) NOT NULL,
                numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 9. Sales
            CREATE TABLE sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 10. Commissions
            CREATE TABLE commissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                percentage DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 11. Winning Tickets
            CREATE TABLE winning_tickets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 12. Notifications
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                status VARCHAR(50) DEFAULT 'unread',
                read_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 13. Bet Limits
            CREATE TABLE bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 14. Current Bet Totals
            CREATE TABLE current_bet_totals (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                total_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 15. System Settings
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                updated_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 16. Ticket Templates
            CREATE TABLE ticket_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 17. Agent Ticket Templates
            CREATE TABLE agent_ticket_templates (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 18. Draw Results
            CREATE TABLE draw_results (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                winning_numbers VARCHAR(100) NOT NULL,
                input_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 19. Winning Prizes
            CREATE TABLE winning_prizes (
                id SERIAL PRIMARY KEY,
                winning_ticket_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                claimed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 20. Prize Configurations
            CREATE TABLE prize_configurations (
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
            );
            
            -- 21. Ticket Reprints
            CREATE TABLE ticket_reprints (
                id SERIAL PRIMARY KEY,
                original_ticket_id INTEGER NOT NULL,
                reprinted_ticket_id INTEGER NOT NULL,
                reason TEXT,
                reprinted_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 22. System Functions
            CREATE TABLE system_functions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 23. Role Function Permissions
            CREATE TABLE role_function_permissions (
                id SERIAL PRIMARY KEY,
                role VARCHAR(50) NOT NULL,
                function_name VARCHAR(255) NOT NULL,
                can_read BOOLEAN DEFAULT false,
                can_write BOOLEAN DEFAULT false,
                can_delete BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 24. System Logs
            CREATE TABLE system_logs (
                id SERIAL PRIMARY KEY,
                level VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                context JSONB,
                user_id INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 25. Rate Limits
            CREATE TABLE rate_limits (
                id SERIAL PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                limit_type VARCHAR(50) NOT NULL,
                request_count INTEGER DEFAULT 0,
                window_start TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 26. Login Audit
            CREATE TABLE login_audit (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                username VARCHAR(255),
                success BOOLEAN NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                failure_reason TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 27. Audit Log
            CREATE TABLE audit_log (
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
            );
            
            -- 28. Security Audit
            CREATE TABLE security_audits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                success BOOLEAN NOT NULL,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 29. Claims Audit
            CREATE TABLE claims_audit (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                user_id INTEGER,
                action VARCHAR(50) NOT NULL,
                performed_by INTEGER,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 30. User Bet Limits
            CREATE TABLE user_bet_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- 31. Prisma Migrations
            CREATE TABLE _prisma_migrations (
                id VARCHAR(36) PRIMARY KEY,
                checksum VARCHAR(64) NOT NULL,
                finished_at TIMESTAMPTZ,
                migration_name VARCHAR(255) NOT NULL,
                logs TEXT,
                rolled_back_at TIMESTAMPTZ,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                applied_steps_count INTEGER NOT NULL DEFAULT 0
            );
        `;
        
        // Execute all tables creation
        await prisma.$executeRawUnsafe(allTablesSQL);
        console.log('✅ Created all 31 tables successfully');
        
        // Verify count
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`\n📊 Total tables created: ${tables[0].count}`);
        
        if (tables[0].count >= 31) {
            console.log('\n🎉 Perfect! All 31 tables match NEW27back.sql');
            console.log('\n📋 Database is now ready for restoration:');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lotterydb_a6w5');
            console.log('3. Restore NEW27back.sql with "Data only"');
            console.log('4. All tables exist - restoration should work perfectly!');
        } else {
            console.log(`\n⚠️ Expected 31 tables, got ${tables[0].count}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAll30Tables();
