const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeDuplicateDraws() {
  try {
    console.log('🔧 Removing duplicate draws completely...\n');

    // Find all draws for today
    const today = new Date().toISOString().split('T')[0];
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${todayDraws.length} draws for today:`);
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

    console.log('\n🔍 Processing duplicates...');
    
    for (const [drawTime, draws] of Object.entries(drawsByTime)) {
      if (draws.length > 1) {
        console.log(`\n❌ DUPLICATE: ${drawTime} has ${draws.length} draws`);
        
        // Sort by creation date (keep the most recent)
        const sortedDraws = draws.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepDraw = sortedDraws[0];
        const duplicatesToRemove = sortedDraws.slice(1);

        console.log(`  ✅ Keeping Draw ${keepDraw.id} (most recent)`);
        
        for (const dupDraw of duplicatesToRemove) {
          console.log(`  🗑️  Deleting duplicate Draw ${dupDraw.id}`);
          
          // First, delete any related records that might reference this draw
          try {
            // Delete bet limits for this draw
            await prisma.bet_limits_per_draw.deleteMany({
              where: { draw_id: dupDraw.id }
            });
            console.log(`    - Deleted bet limits for Draw ${dupDraw.id}`);

            // Delete any other related records if they exist
            await prisma.ticket.deleteMany({
              where: { drawId: dupDraw.id }
            });
            console.log(`    - Deleted tickets for Draw ${dupDraw.id}`);

            await prisma.sale.deleteMany({
              where: { drawId: dupDraw.id }
            });
            console.log(`    - Deleted sales for Draw ${dupDraw.id}`);

            // Finally delete the draw itself
            await prisma.draw.delete({
              where: { id: dupDraw.id }
            });
            console.log(`    ✅ Successfully deleted Draw ${dupDraw.id}`);
            
          } catch (error) {
            console.log(`    ❌ Error deleting Draw ${dupDraw.id}:`, error.message);
          }
        }
      } else {
        console.log(`✅ ${drawTime}: Only 1 draw (correct)`);
      }
    }

    // Verify final result
    console.log('\n📊 Final verification...');
    const finalDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log(`Final draws count: ${finalDraws.length}`);
    finalDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status.toUpperCase()}`);
    });

    // Expected: should have exactly 3 draws (2PM, 5PM, 9PM)
    const expectedTimes = ['twoPM', 'fivePM', 'ninePM'];
    const missingTimes = expectedTimes.filter(time => 
      !finalDraws.some(draw => draw.drawTime === time)
    );

    if (missingTimes.length > 0) {
      console.log(`\n⚠️  Missing draw times: ${missingTimes.join(', ')}`);
    } else {
      console.log('\n✅ All expected draw times present');
    }

  } catch (error) {
    console.error('❌ Error removing duplicate draws:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateDraws();
