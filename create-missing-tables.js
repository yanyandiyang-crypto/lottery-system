const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function createMissingTables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        console.log('\n🔄 Creating missing tables...');
        
        // Create TicketReprint table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS ticket_reprints (
                id SERIAL PRIMARY KEY,
                original_ticket_id INTEGER NOT NULL,
                reprinted_ticket_id INTEGER NOT NULL,
                reason TEXT,
                reprinted_by INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created ticket_reprints table');
        
        // Create RoleFunctionPermission table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS role_function_permissions (
                id SERIAL PRIMARY KEY,
                role VARCHAR(50) NOT NULL,
                function_name VARCHAR(255) NOT NULL,
                can_read BOOLEAN DEFAULT false,
                can_write BOOLEAN DEFAULT false,
                can_delete BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created role_function_permissions table');
        
        // Create SystemLog table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                level VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                context JSONB,
                user_id INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created system_logs table');
        
        // Create rate_limits table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS rate_limits (
                id SERIAL PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                limit_type VARCHAR(50) NOT NULL,
                request_count INTEGER DEFAULT 0,
                window_start TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created rate_limits table');
        
        // Create SecurityAudit table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS security_audits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(100) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                success BOOLEAN NOT NULL,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        console.log('✅ Created security_audits table');
        
        // Check final count
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`\n📊 Total tables now: ${tables[0].count}`);
        
        if (tables[0].count >= 30) {
            console.log('\n🎉 All 30+ tables created! Database is ready for NEW27back.sql restoration');
            console.log('\n📋 Next steps:');
            console.log('1. Use pgAdmin4 to restore NEW27back.sql');
            console.log('2. Select "Data only" option');
            console.log('3. The restore should work perfectly now');
        } else {
            console.log(`\n⚠️ Still missing ${30 - tables[0].count} tables`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingTables();
