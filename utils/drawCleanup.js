/**
 * Draw Cleanup Utility
 * Check for duplicate draws and provide cleanup options
 */

const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

class DrawCleanup {
  /**
   * Check for duplicate draws
   */
  static async checkDuplicateDraws() {
    try {
      console.log('🔍 Checking for duplicate draws...\n');
      
      // Get all draws grouped by date and time
      const draws = await prisma.draw.findMany({
        orderBy: [
          { drawDate: 'desc' },
          { drawTime: 'asc' }
        ],
        include: {
          _count: {
            select: {
              tickets: true
            }
          }
        }
      });

      console.log(`📊 Total draws found: ${draws.length}\n`);

      // Group by date and time to find duplicates
      const drawGroups = {};
      
      draws.forEach(draw => {
        const key = `${draw.drawDate}_${draw.drawTime}`;
        if (!drawGroups[key]) {
          drawGroups[key] = [];
        }
        drawGroups[key].push(draw);
      });

      // Find duplicates
      const duplicates = [];
      Object.entries(drawGroups).forEach(([key, group]) => {
        if (group.length > 1) {
          duplicates.push({ key, draws: group });
        }
      });

      if (duplicates.length === 0) {
        console.log('✅ No duplicate draws found!');
        return { hasDuplicates: false, duplicates: [] };
      }

      console.log(`⚠️  Found ${duplicates.length} duplicate draw groups:\n`);
      
      duplicates.forEach(({ key, draws: duplicateDraws }, index) => {
        const [date, time] = key.split('_');
        console.log(`${index + 1}. Date: ${date}, Time: ${time}`);
        duplicateDraws.forEach(draw => {
          console.log(`   - ID: ${draw.id}, Status: ${draw.status}, Tickets: ${draw._count.tickets}, Created: ${draw.createdAt}`);
        });
        console.log('');
      });

      return { hasDuplicates: true, duplicates };
    } catch (error) {
      console.error('❌ Error checking duplicate draws:', error);
      throw error;
    }
  }

  /**
   * Clean up duplicate draws (keep the one with most tickets or latest created)
   */
  static async cleanupDuplicateDraws(dryRun = true) {
    try {
      const { hasDuplicates, duplicates } = await this.checkDuplicateDraws();
      
      if (!hasDuplicates) {
        console.log('✅ No cleanup needed!');
        return;
      }

      console.log(`🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up duplicate draws...\n`);

      for (const { key, draws: duplicateDraws } of duplicates) {
        const [date, time] = key.split('_');
        console.log(`Processing duplicates for ${date} ${time}:`);

        // Sort by ticket count (desc) then by creation date (desc)
        const sortedDraws = duplicateDraws.sort((a, b) => {
          if (a._count.tickets !== b._count.tickets) {
            return b._count.tickets - a._count.tickets; // More tickets first
          }
          return new Date(b.createdAt) - new Date(a.createdAt); // Latest first
        });

        const keepDraw = sortedDraws[0];
        const deleteDraw = sortedDraws.slice(1);

        console.log(`  ✅ Keeping: ID ${keepDraw.id} (${keepDraw._count.tickets} tickets)`);
        
        for (const draw of deleteDraw) {
          console.log(`  🗑️  ${dryRun ? 'Would delete' : 'Deleting'}: ID ${draw.id} (${draw._count.tickets} tickets)`);
          
          if (!dryRun) {
            // First, update any tickets that reference this draw to reference the kept draw
            if (draw._count.tickets > 0) {
              await prisma.ticket.updateMany({
                where: { drawId: draw.id },
                data: { drawId: keepDraw.id }
              });
              console.log(`    📝 Moved ${draw._count.tickets} tickets to draw ${keepDraw.id}`);
            }
            
            // Then delete the duplicate draw
            await prisma.draw.delete({
              where: { id: draw.id }
            });
            console.log(`    ✅ Deleted draw ${draw.id}`);
          }
        }
        console.log('');
      }

      if (dryRun) {
        console.log('🔍 This was a dry run. Run with dryRun=false to actually perform cleanup.');
      } else {
        console.log('✅ Cleanup completed!');
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Reset all draws (delete all draws and tickets)
   * USE WITH EXTREME CAUTION!
   */
  static async resetAllDraws(confirm = false) {
    if (!confirm) {
      console.log('⚠️  WARNING: This will delete ALL draws and tickets!');
      console.log('To confirm, call resetAllDraws(true)');
      return;
    }

    try {
      console.log('🗑️  Resetting all draws and tickets...');
      
      // Delete all tickets first (due to foreign key constraints)
      const deletedTickets = await prisma.ticket.deleteMany({});
      console.log(`✅ Deleted ${deletedTickets.count} tickets`);
      
      // Delete all bets
      const deletedBets = await prisma.bet.deleteMany({});
      console.log(`✅ Deleted ${deletedBets.count} bets`);
      
      // Delete all draws
      const deletedDraws = await prisma.draw.deleteMany({});
      console.log(`✅ Deleted ${deletedDraws.count} draws`);
      
      console.log('✅ All draws and tickets have been reset!');
    } catch (error) {
      console.error('❌ Error during reset:', error);
      throw error;
    }
  }

  /**
   * Show current draw statistics
   */
  static async showDrawStats() {
    try {
      console.log('📊 Current Draw Statistics:\n');
      
      const totalDraws = await prisma.draw.count();
      const totalTickets = await prisma.ticket.count();
      const totalBets = await prisma.bet.count();
      
      console.log(`Total Draws: ${totalDraws}`);
      console.log(`Total Tickets: ${totalTickets}`);
      console.log(`Total Bets: ${totalBets}\n`);
      
      // Draws by status
      const drawsByStatus = await prisma.draw.groupBy({
        by: ['status'],
        _count: { id: true }
      });
      
      console.log('Draws by Status:');
      drawsByStatus.forEach(({ status, _count }) => {
        console.log(`  ${status}: ${_count.id}`);
      });
      console.log('');
      
      // Recent draws
      const recentDraws = await prisma.draw.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tickets: true }
          }
        }
      });
      
      console.log('Recent Draws:');
      recentDraws.forEach(draw => {
        console.log(`  ${draw.drawDate} ${draw.drawTime} - Status: ${draw.status}, Tickets: ${draw._count.tickets}`);
      });
      
    } catch (error) {
      console.error('❌ Error getting draw stats:', error);
      throw error;
    }
  }
}

module.exports = DrawCleanup;

// If run directly, show stats and check for duplicates
if (require.main === module) {
  (async () => {
    try {
      await DrawCleanup.showDrawStats();
      await DrawCleanup.checkDuplicateDraws();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
