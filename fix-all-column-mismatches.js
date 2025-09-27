const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function fixAllColumnMismatches() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Fixing all column mismatches to match NEW27back.sql...');
        
        // Drop and recreate tables with correct column names
        const tableFixes = [
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
            },
            {
                name: 'system_functions',
                sql: `
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
                `
            },
            {
                name: 'system_settings',
                sql: `
                    CREATE TABLE system_settings (
                        id SERIAL PRIMARY KEY,
                        key VARCHAR(255) UNIQUE NOT NULL,
                        value TEXT NOT NULL,
                        description TEXT,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_by INTEGER
                    )
                `
            },
            {
                name: 'ticket_templates',
                sql: `
                    CREATE TABLE ticket_templates (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        created_by INTEGER
                    )
                `
            },
            {
                name: 'prize_configurations',
                sql: `
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
                `
            },
            {
                name: 'bet_limits',
                sql: `
                    CREATE TABLE bet_limits (
                        id SERIAL PRIMARY KEY,
                        bet_type VARCHAR(50) NOT NULL,
                        limit_amount DECIMAL(10,2) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        created_by INTEGER
                    )
                `
            }
        ];
        
        for (const tableFix of tableFixes) {
            await prisma.$executeRaw`DROP TABLE IF EXISTS ${prisma.$queryRawUnsafe(`"${tableFix.name}"`)}`;
            await prisma.$executeRawUnsafe(tableFix.sql);
            console.log(`✅ Fixed ${tableFix.name} table structure`);
        }
        
        console.log('\n🎉 All table structures fixed to match NEW27back.sql');
        console.log('\n📋 Key fixes applied:');
        console.log('- rate_limits: key, count, expires_at columns');
        console.log('- system_functions: created_by_id, updated_by_id columns');
        console.log('- system_settings: updated_by column');
        console.log('- ticket_templates: created_by column');
        console.log('- prize_configurations: created_by_id, updated_by_id columns');
        console.log('- bet_limits: created_by column');
        
        console.log('\n🔄 Now try restoring NEW27back.sql again with pgAdmin4');
        console.log('📋 The column mismatches should be resolved');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAllColumnMismatches();
