const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function checkActualTables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        // Get all tables
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        console.log(`\n📊 Found ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`- ${table.table_name}`);
        });
        
        if (tables.length < 20) {
            console.log('\n⚠️ Not enough tables! Expected 30+ tables from Prisma schema');
            console.log('🔄 Need to apply schema properly');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkActualTables();
