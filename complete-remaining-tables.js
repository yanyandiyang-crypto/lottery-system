const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function completeRemainingTables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating remaining tables...');
        
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
        
        // Check final count
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`\n📊 Total tables created: ${tables[0].count}`);
        
        if (tables[0].count >= 25) {
            console.log('\n🎉 Database is ready for NEW27back.sql restoration!');
            console.log('\n📋 Next steps:');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lotterydb_a6w5');
            console.log('3. Right-click database → Restore...');
            console.log('4. Select NEW27back.sql');
            console.log('5. Check "Data only" (schema already exists)');
            console.log('6. Click Restore');
        } else {
            console.log('\n⚠️ Need more tables - check what\'s missing');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

completeRemainingTables();
