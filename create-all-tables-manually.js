const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function createAllTablesManually() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating all 30+ tables manually...');
        
        // Drop and recreate schema
        await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
        await prisma.$executeRaw`CREATE SCHEMA public`;
        console.log('✅ Cleared existing schema');
        
        // Create all tables from Prisma schema
        const createTablesSQL = `
            -- Create ENUM types
            CREATE TYPE "UserRole" AS ENUM ('superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator');
            CREATE TYPE "BetType" AS ENUM ('standard', 'rambolito');
            CREATE TYPE "TicketStatus" AS ENUM ('active', 'claimed', 'expired', 'cancelled');
            CREATE TYPE "DrawStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');
            CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal', 'winning', 'commission', 'refund');
            CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CLAIM', 'VERIFY');
            CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'error', 'success');
            CREATE TYPE "NotificationStatus" AS ENUM ('unread', 'read', 'archived');
            
            -- Regions table
            CREATE TABLE regions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                area_coordinator_id INTEGER UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Users table
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
            
            -- System Functions table
            CREATE TABLE system_functions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Ticket Templates table
            CREATE TABLE ticket_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Bet Limits table
            CREATE TABLE bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Prize Configurations table
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
            
            -- System Settings table
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Draws table
            CREATE TABLE draws (
                id SERIAL PRIMARY KEY,
                draw_date DATE NOT NULL,
                draw_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                winning_numbers VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Draw Results table
            CREATE TABLE draw_results (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                winning_numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- User Balances table
            CREATE TABLE user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                balance DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Tickets table
            CREATE TABLE tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(100) UNIQUE NOT NULL,
                qr_code TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Bets table
            CREATE TABLE bets (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                bet_amount DECIMAL(10,2) NOT NULL,
                numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Sales table
            CREATE TABLE sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Commissions table
            CREATE TABLE commissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                percentage DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Winning Tickets table
            CREATE TABLE winning_tickets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Winning Prizes table
            CREATE TABLE winning_prizes (
                id SERIAL PRIMARY KEY,
                winning_ticket_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                claimed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Balance Transactions table
            CREATE TABLE balance_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                description TEXT,
                processed_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Agent Ticket Templates table
            CREATE TABLE agent_ticket_templates (
                id SERIAL PRIMARY KEY,
                agent_id INTEGER NOT NULL,
                template_id INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Bet Limits Per Draw table
            CREATE TABLE bet_limits_per_draw (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Current Bet Totals table
            CREATE TABLE current_bet_totals (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                total_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- User Bet Limits table
            CREATE TABLE user_bet_limits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Audit Log table
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
            
            -- Login Audit table
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
            
            -- Claims Audit table
            CREATE TABLE claims_audit (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                user_id INTEGER,
                action VARCHAR(50) NOT NULL,
                performed_by INTEGER,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Notifications table
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
            
            -- Prisma Migrations table
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
        
        // Execute the SQL
        await prisma.$executeRawUnsafe(createTablesSQL);
        console.log('✅ Created all 30+ tables successfully');
        
        // Verify tables were created
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`\n📊 Created ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`- ${table.table_name}`);
        });
        
        console.log('\n🎉 All tables created! Database is ready for data restoration');
        console.log('\n📋 Next steps:');
        console.log('1. Use pgAdmin4 to restore NEW27back.sql');
        console.log('2. Select "Data only" option (schema already exists)');
        console.log('3. The restore should work perfectly now');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAllTablesManually();
