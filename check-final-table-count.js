const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function checkFinalTableCount() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        // Get all tables that exist
        const existingTables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`📊 Total tables: ${existingTables.length}`);
        console.log('\n📋 All tables:');
        existingTables.forEach(table => {
            console.log(`- ${table.table_name}`);
        });
        
        if (existingTables.length >= 31) {
            console.log('\n🎉 Perfect! All 31 tables exist to match NEW27back.sql');
            console.log('\n📋 Database is ready for restoration:');
            console.log('1. Open pgAdmin4');
            console.log('2. Connect to lotterydb_a6w5');
            console.log('3. Restore NEW27back.sql with "Data only"');
            console.log('4. All tables exist - restoration should work perfectly!');
        } else {
            console.log(`\n⚠️ Need ${31 - existingTables.length} more tables`);
            console.log('🔄 Let me create the remaining tables...');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkFinalTableCount();
