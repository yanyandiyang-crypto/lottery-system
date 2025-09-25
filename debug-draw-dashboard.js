const { PrismaClient } = require('@prisma/client');

async function debugDrawDashboard() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing draw dashboard queries individually...');
    
    const days = 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    console.log('Date range:', startDate, 'to', endDate);
    
    // Test 1: Total winners
    try {
      const totalWinners = await prisma.winningTicket.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      console.log('✅ Total winners:', totalWinners);
    } catch (e) {
      console.log('❌ Total winners error:', e.message);
    }
    
    // Test 2: Pending results
    try {
      const pendingResults = await prisma.draw.count({
        where: {
          status: 'closed',
          winningNumber: null
        }
      });
      console.log('✅ Pending results:', pendingResults);
    } catch (e) {
      console.log('❌ Pending results error:', e.message);
    }
    
    // Test 3: Processed today (raw query)
    try {
      const processedToday = await prisma.$queryRaw`SELECT COUNT(*) as count FROM draw_results WHERE DATE(created_at) = CURRENT_DATE`;
      console.log('✅ Processed today:', processedToday);
    } catch (e) {
      console.log('❌ Processed today error:', e.message);
    }
    
    // Test 4: Total payouts
    try {
      const totalPayouts = await prisma.winningTicket.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          prizeAmount: true
        }
      });
      console.log('✅ Total payouts:', totalPayouts);
    } catch (e) {
      console.log('❌ Total payouts error:', e.message);
    }
    
  } catch (error) {
    console.log('❌ General error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDrawDashboard();
