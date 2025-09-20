const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function checkDrawStatusSync() {
  try {
    console.log('🔍 Checking Draw Status Synchronization...\n');

    const now = moment().tz('Asia/Manila');
    console.log(`Current time: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

    // Check today's draws
    const today = now.format('YYYY-MM-DD');
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log('\n📊 Today\'s Draw Status in Database:');
    todayDraws.forEach(draw => {
      const createdAt = new Date(draw.createdAt);
      const updatedAt = new Date(draw.updatedAt);
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
      console.log(`    Created: ${createdAt.toLocaleString()}`);
      console.log(`    Updated: ${updatedAt.toLocaleString()}`);
    });

    // Check draw results table
    console.log('\n🎯 Checking draw_results table...');
    const drawResults = await prisma.draw_results.findMany({
      include: {
        draws: {
          select: { id: true, drawTime: true, drawDate: true, status: true }
        }
      },
      orderBy: { input_at: 'desc' },
      take: 10
    });

    console.log(`Draw results records: ${drawResults.length}`);
    drawResults.forEach(result => {
      console.log(`  Result ID ${result.id} | Draw ${result.draw_id} | ${result.draws?.drawTime} | Draw Status: ${result.draws?.status}`);
      console.log(`    Winning Number: ${result.winning_number || 'Not set'}`);
      console.log(`    Result Status: ${result.status || 'Not set'}`);
    });

    // Check if there's a mismatch between draw status and what's shown in results
    console.log('\n⚠️  Checking for status mismatches...');
    
    for (const draw of todayDraws) {
      // Calculate expected status based on cutoff time
      let cutoffHour;
      switch (draw.drawTime) {
        case 'twoPM':
          cutoffHour = 13;
          break;
        case 'fivePM':
          cutoffHour = 16;
          break;
        case 'ninePM':
          cutoffHour = 20;
          break;
      }
      
      const cutoffDateTime = moment(draw.drawDate).tz('Asia/Manila')
        .hour(cutoffHour)
        .minute(55)
        .second(0);
      
      const shouldBeClosed = now.isAfter(cutoffDateTime);
      const actualStatus = draw.status;
      
      console.log(`  ${draw.drawTime}: Should be ${shouldBeClosed ? 'CLOSED' : 'OPEN'} | Actually: ${actualStatus.toUpperCase()}`);
      
      if (shouldBeClosed && actualStatus === 'open') {
        console.log(`    ❌ MISMATCH: Draw should be closed but shows as open`);
      } else if (!shouldBeClosed && actualStatus === 'closed') {
        console.log(`    ❌ MISMATCH: Draw should be open but shows as closed`);
      } else {
        console.log(`    ✅ Status is correct`);
      }
    }

    // Check what the frontend might be seeing
    console.log('\n🖥️  Checking what frontend APIs return...');
    
    // Simulate the draws API call
    const openDraws = await prisma.draw.findMany({
      where: { status: 'open' },
      orderBy: { drawDate: 'asc' },
      take: 5
    });

    console.log(`Open draws returned by API: ${openDraws.length}`);
    openDraws.forEach(draw => {
      const drawDate = moment(draw.drawDate).format('YYYY-MM-DD');
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | ${drawDate} | Status: ${draw.status}`);
    });

  } catch (error) {
    console.error('❌ Error checking draw status sync:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrawStatusSync();
