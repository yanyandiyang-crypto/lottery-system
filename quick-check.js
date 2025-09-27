const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function quickCheck() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        const tables = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log(`📊 Total tables: ${tables[0].count}`);
        
        if (tables[0].count >= 25) {
            console.log('✅ Database has enough tables for restoration');
            console.log('📋 Ready to restore NEW27back.sql with pgAdmin4');
        } else {
            console.log('⚠️ Need more tables - schema not complete');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

quickCheck();
