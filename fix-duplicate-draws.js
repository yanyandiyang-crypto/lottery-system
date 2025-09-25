const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function fixDuplicateDraws() {
  try {
    console.log('🔧 Fixing Duplicate Draws Issue...\n');

    // Find all draws for today
    const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${todayDraws.length} draws for today (${today}):`);
    todayDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status} | Created: ${new Date(draw.createdAt).toLocaleString()}`);
    });

    // Group by drawTime to find duplicates
    const drawsByTime = {};
    todayDraws.forEach(draw => {
      if (!drawsByTime[draw.drawTime]) {
        drawsByTime[draw.drawTime] = [];
      }
      drawsByTime[draw.drawTime].push(draw);
    });

    console.log('\n🔍 Checking for duplicates...');
    for (const [drawTime, draws] of Object.entries(drawsByTime)) {
      if (draws.length > 1) {
        console.log(`❌ DUPLICATE: ${drawTime} has ${draws.length} draws`);
        draws.forEach(draw => {
          console.log(`    Draw ${draw.id} | Status: ${draw.status} | Created: ${new Date(draw.createdAt).toLocaleString()}`);
        });

        // Keep the most recent one and update older ones to closed
        const sortedDraws = draws.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepDraw = sortedDraws[0];
        const removeDuplicates = sortedDraws.slice(1);

        console.log(`    ✅ Keeping Draw ${keepDraw.id} (most recent)`);
        
        for (const dupDraw of removeDuplicates) {
          console.log(`    🔒 Closing duplicate Draw ${dupDraw.id}`);
          await prisma.draw.update({
            where: { id: dupDraw.id },
            data: { status: 'closed' }
          });
        }

        // Now check if the kept draw should be closed based on cutoff time
        const now = moment().tz('Asia/Manila');
        let cutoffHour;
        switch (keepDraw.drawTime) {
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
        
        const cutoffDateTime = moment(keepDraw.drawDate).tz('Asia/Manila')
          .hour(cutoffHour)
          .minute(55)
          .second(0);
        
        const shouldBeClosed = now.isAfter(cutoffDateTime);
        
        if (shouldBeClosed && keepDraw.status === 'open') {
          console.log(`    🔒 Closing kept draw ${keepDraw.id} due to cutoff time`);
          await prisma.draw.update({
            where: { id: keepDraw.id },
            data: { status: 'closed' }
          });
        }
      } else {
        console.log(`✅ ${drawTime}: Only 1 draw (correct)`);
      }
    }

    // Verify final status
    console.log('\n📊 Final draw status:');
    const finalDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { drawTime: 'asc' }
    });

    finalDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status.toUpperCase()}`);
    });

  } catch (error) {
    console.error('❌ Error fixing duplicate draws:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateDraws();
