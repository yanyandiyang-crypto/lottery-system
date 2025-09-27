const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function createTablesStepByStep() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating tables step by step...');
        
        // Create regions table first
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
        
        // Create users table
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
        
        // Create draws table
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
        
        // Create tickets table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(100) UNIQUE NOT NULL,
                qr_code TEXT,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created tickets table');
        
        // Create bets table
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
        
        // Create bet_limits table
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
        
        // Create prize_configurations table
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
        
        // Create ticket_templates table
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
        
        // Create user_balances table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                balance DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created user_balances table');
        
        // Create balance_transactions table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS balance_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                description TEXT,
                processed_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created balance_transactions table');
        
        // Create draw_results table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS draw_results (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                winning_numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created draw_results table');
        
        // Create sales table
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
        
        // Create winning_tickets table
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
        
        // Create commissions table
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
        
        // Create winning_prizes table
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
        
        // Create system_functions table
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
        
        // Create system_settings table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created system_settings table');
        
        // Create agent_ticket_templates table
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
        
        // Create bet_limits_per_draw table
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
        
        // Create current_bet_totals table
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
        
        // Create user_bet_limits table
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
        
        // Create audit_log table
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
        
        // Create login_audit table
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
        
        // Create claims_audit table
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
        
        // Create notifications table
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
        
        // Create _prisma_migrations table
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
        
        console.log('\n🎉 All tables created successfully!');
        console.log('\n📋 Database is now ready for NEW27back.sql restoration');
        console.log('📋 Use pgAdmin4 with "Data only" option');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createTablesStepByStep();
