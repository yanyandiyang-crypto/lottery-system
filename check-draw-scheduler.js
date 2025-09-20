const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDrawScheduler() {
  try {
    console.log('🕐 Checking draw scheduler and draw creation...\n');

    // Check all draws in database
    const allDraws = await prisma.draw.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Total draws in database: ${allDraws.length}`);
    console.log('\n📋 Recent draws:');
    allDraws.forEach(draw => {
      const drawDate = new Date(draw.drawDate);
      const createdAt = new Date(draw.createdAt);
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | ${drawDate.toDateString()} | Status: ${draw.status} | Created: ${createdAt.toLocaleString()}`);
    });

    // Check today's draws
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log(`\n📅 Today's draws (${today.toDateString()}): ${todayDraws.length}`);
    todayDraws.forEach(draw => {
      const drawTime = new Date(draw.drawTime);
      console.log(`  ${draw.drawTime} | Status: ${draw.status} | Draw Time: ${drawTime.toLocaleString()}`);
    });

    // Expected draw times for today
    const expectedDrawTimes = ['11AM', '4PM', '9PM'];
    console.log('\n⏰ Expected daily draws:', expectedDrawTimes.join(', '));

    const missingDraws = expectedDrawTimes.filter(time => 
      !todayDraws.some(draw => draw.drawTime === time)
    );

    if (missingDraws.length > 0) {
      console.log('❌ Missing draws for today:', missingDraws.join(', '));
    } else {
      console.log('✅ All expected draws exist for today');
    }

    // Check if scheduler is running by looking at recent draw creation
    const recentDraws = await prisma.draw.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n🔄 Draws created in last 24 hours: ${recentDraws.length}`);
    
    if (recentDraws.length === 0) {
      console.log('⚠️  No draws created recently - scheduler might not be running');
    } else {
      console.log('✅ Recent draw creation detected');
      recentDraws.forEach(draw => {
        const createdAt = new Date(draw.createdAt);
        console.log(`  Draw ${draw.id} created at: ${createdAt.toLocaleString()}`);
      });
    }

    // Check current time vs next expected draw
    const currentTime = new Date();
    console.log(`\n🕐 Current time: ${currentTime.toLocaleString()}`);
    
    // Find next scheduled draw
    const nextDraw = await prisma.draw.findFirst({
      where: {
        status: 'open',
        drawTime: {
          gt: currentTime
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    if (nextDraw) {
      const nextDrawTime = new Date(nextDraw.drawTime);
      console.log(`⏭️  Next scheduled draw: ${nextDrawTime.toLocaleString()}`);
    } else {
      console.log('❌ No upcoming draws found');
    }

  } catch (error) {
    console.error('❌ Error checking draw scheduler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrawScheduler();
