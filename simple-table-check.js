const { PrismaClient } = require('@prisma/client');

const CLEAN_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: CLEAN_DB_URL
        }
    }
});

async function checkTables() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');
        
        // Check key tables
        const userCount = await prisma.user.count();
        const regionCount = await prisma.region.count();
        const ticketCount = await prisma.ticket.count();
        const drawCount = await prisma.draw.count();
        const betCount = await prisma.bet.count();
        
        console.log('\n📊 Table Status:');
        console.log(`👥 Users: ${userCount}`);
        console.log(`🌍 Regions: ${regionCount}`);
        console.log(`🎫 Tickets: ${ticketCount}`);
        console.log(`🎲 Draws: ${drawCount}`);
        console.log(`💰 Bets: ${betCount}`);
        
        if (userCount === 0) {
            console.log('\n⚠️ Database is empty - need to restore NEW27back.sql');
            console.log('📋 Use pgAdmin4 to restore the backup file');
        } else {
            console.log('\n✅ Data restored successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
