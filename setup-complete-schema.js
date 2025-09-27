const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function setupCompleteSchema() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Setting up complete schema for binary restore...');
        
        // Drop all existing tables first
        await prisma.$executeRaw`DROP SCHEMA public CASCADE`;
        await prisma.$executeRaw`CREATE SCHEMA public`;
        console.log('✅ Cleared existing schema');
        
        // Create all tables from Prisma schema
        const createTablesSQL = `
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
            
            -- Add more essential tables as needed
            CREATE TABLE bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
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
            
            CREATE TABLE ticket_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE TABLE user_balances (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                balance DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
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
            
            CREATE TABLE draw_results (
                id SERIAL PRIMARY KEY,
                draw_id INTEGER NOT NULL,
                winning_numbers VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE TABLE sales (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE TABLE winning_tickets (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL,
                draw_id INTEGER NOT NULL,
                prize_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        
        // Execute the SQL
        await prisma.$executeRawUnsafe(createTablesSQL);
        console.log('✅ Created all essential tables');
        
        console.log('\n🎉 Database schema is ready for binary restore!');
        console.log('\n📋 Next steps:');
        console.log('1. Use pgAdmin4 to restore NEW27back.sql');
        console.log('2. The binary backup should now work properly');
        console.log('3. All tables exist and are ready for data');
        
    } catch (error) {
        console.error('❌ Error setting up schema:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupCompleteSchema();
