const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function fixTableStructures() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Fixing table structures to match NEW27back.sql...');
        
        // Drop and recreate rate_limits table with correct structure
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
        console.log('✅ Fixed rate_limits table structure');
        
        // Fix other tables that might have column mismatches
        // Drop and recreate system_functions with correct structure
        await prisma.$executeRaw`DROP TABLE IF EXISTS system_functions`;
        await prisma.$executeRaw`
            CREATE TABLE system_functions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_by_id INTEGER,
                updated_by_id INTEGER
            )
        `;
        console.log('✅ Fixed system_functions table structure');
        
        // Fix system_settings table
        await prisma.$executeRaw`DROP TABLE IF EXISTS system_settings`;
        await prisma.$executeRaw`
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                updated_by INTEGER
            )
        `;
        console.log('✅ Fixed system_settings table structure');
        
        // Fix ticket_templates table
        await prisma.$executeRaw`DROP TABLE IF EXISTS ticket_templates`;
        await prisma.$executeRaw`
            CREATE TABLE ticket_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_by INTEGER
            )
        `;
        console.log('✅ Fixed ticket_templates table structure');
        
        // Fix prize_configurations table
        await prisma.$executeRaw`DROP TABLE IF EXISTS prize_configurations`;
        await prisma.$executeRaw`
            CREATE TABLE prize_configurations (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                multiplier DECIMAL(10,2) NOT NULL,
                base_amount DECIMAL(10,2) NOT NULL,
                base_prize DECIMAL(10,2) NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_by_id INTEGER,
                updated_by_id INTEGER
            )
        `;
        console.log('✅ Fixed prize_configurations table structure');
        
        // Fix bet_limits table
        await prisma.$executeRaw`DROP TABLE IF EXISTS bet_limits`;
        await prisma.$executeRaw`
            CREATE TABLE bet_limits (
                id SERIAL PRIMARY KEY,
                bet_type VARCHAR(50) NOT NULL,
                limit_amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_by INTEGER
            )
        `;
        console.log('✅ Fixed bet_limits table structure');
        
        console.log('\n🎉 Table structures fixed to match NEW27back.sql');
        console.log('\n📋 Now try restoring NEW27back.sql again with pgAdmin4');
        console.log('📋 The column mismatches should be resolved');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixTableStructures();
