const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixActualDuplicate() {
  try {
    console.log('🔧 Fixing the actual duplicate 2PM draws...\n');

    // Get both 2PM draws for today
    const today = '2025-09-18';
    const twoPMDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today),
        drawTime: 'twoPM'
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${twoPMDraws.length} 2PM draws for today:`);
    twoPMDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | Created: ${new Date(draw.createdAt).toLocaleString()} | Status: ${draw.status}`);
    });

    if (twoPMDraws.length === 2) {
      // Keep the newer one (Draw 2), remove the older one (Draw 1)
      const drawToKeep = twoPMDraws[1]; // Draw 2 (newer)
      const drawToRemove = twoPMDraws[0]; // Draw 1 (older)

      console.log(`\n✅ Keeping Draw ${drawToKeep.id} (newer)`);
      console.log(`🗑️  Removing Draw ${drawToRemove.id} (older)`);

      // Check if Draw 1 has any related data
      const ticketsCount = await prisma.ticket.count({
        where: { drawId: drawToRemove.id }
      });
      
      const betLimitsCount = await prisma.bet_limits_per_draw.count({
        where: { draw_id: drawToRemove.id }
      });

      console.log(`\nDraw ${drawToRemove.id} has:`);
      console.log(`  - ${ticketsCount} tickets`);
      console.log(`  - ${betLimitsCount} bet limits`);

      if (ticketsCount > 0) {
        console.log('\n⚠️  Draw 1 has tickets! Moving them to Draw 2...');
        
        // Move tickets from Draw 1 to Draw 2
        await prisma.ticket.updateMany({
          where: { drawId: drawToRemove.id },
          data: { drawId: drawToKeep.id }
        });
        
        console.log(`✅ Moved ${ticketsCount} tickets from Draw ${drawToRemove.id} to Draw ${drawToKeep.id}`);
      }

      if (betLimitsCount > 0) {
        console.log('\n⚠️  Draw 1 has bet limits! Moving them to Draw 2...');
        
        // Move bet limits from Draw 1 to Draw 2
        await prisma.bet_limits_per_draw.updateMany({
          where: { draw_id: drawToRemove.id },
          data: { draw_id: drawToKeep.id }
        });
        
        console.log(`✅ Moved ${betLimitsCount} bet limits from Draw ${drawToRemove.id} to Draw ${drawToKeep.id}`);
      }

      // Delete any other related records
      await prisma.sale.deleteMany({
        where: { drawId: drawToRemove.id }
      });

      await prisma.winningTicket.deleteMany({
        where: { drawId: drawToRemove.id }
      });

      // Finally delete Draw 1
      await prisma.draw.delete({
        where: { id: drawToRemove.id }
      });

      console.log(`\n✅ Successfully deleted duplicate Draw ${drawToRemove.id}`);

    } else if (twoPMDraws.length === 1) {
      console.log('\n✅ Only 1 2PM draw found - no duplicates to fix');
    } else {
      console.log(`\n❌ Unexpected number of 2PM draws: ${twoPMDraws.length}`);
    }

    // Verify final result
    console.log('\n📊 Final verification...');
    const finalDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log(`Final draws for today: ${finalDraws.length}`);
    finalDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status.toUpperCase()}`);
    });

    // Check for proper draw times
    const drawTimes = finalDraws.map(d => d.drawTime);
    const expectedTimes = ['twoPM', 'fivePM', 'ninePM'];
    const hasDuplicates = drawTimes.length !== new Set(drawTimes).size;
    
    if (hasDuplicates) {
      console.log('\n❌ Still has duplicate draw times!');
    } else {
      console.log('\n✅ No duplicate draw times - fixed!');
    }

  } catch (error) {
    console.error('❌ Error fixing duplicate:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixActualDuplicate();
