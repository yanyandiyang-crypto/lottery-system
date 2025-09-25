const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBetLimitsData() {
  try {
    console.log('🔍 Checking bet limits data in database...\n');

    // Check bet_limits_per_draw table
    const betLimitsCount = await prisma.bet_limits_per_draw.count();
    console.log(`📊 bet_limits_per_draw table: ${betLimitsCount} records`);

    if (betLimitsCount > 0) {
      // Show sample data
      const sampleLimits = await prisma.bet_limits_per_draw.findMany({
        take: 10,
        orderBy: { bet_combination: 'asc' },
        include: {
          draws: {
            select: { id: true, drawDate: true, drawTime: true, status: true }
          }
        }
      });

      console.log('\n📋 Sample bet limits:');
      sampleLimits.forEach(limit => {
        console.log(`  Draw ${limit.draw_id} | ${limit.bet_combination} (${limit.bet_type}) | Limit: ₱${limit.limit_amount} | Current: ₱${limit.current_amount}`);
      });

      // Group by bet type and draw
      const groupedLimits = await prisma.bet_limits_per_draw.groupBy({
        by: ['draw_id', 'bet_type'],
        _count: {
          bet_combination: true
        },
        _sum: {
          limit_amount: true,
          current_amount: true
        }
      });

      console.log('\n📈 Summary by draw and bet type:');
      groupedLimits.forEach(group => {
        console.log(`  Draw ${group.draw_id} | ${group.bet_type} | ${group._count.bet_combination} numbers | Total limit: ₱${group._sum.limit_amount?.toLocaleString() || 0}`);
      });
    }

    // Check old BetLimit table (if exists)
    try {
      const oldBetLimitsCount = await prisma.betLimit.count();
      console.log(`\n📊 Old BetLimit table: ${oldBetLimitsCount} records`);
      
      if (oldBetLimitsCount > 0) {
        const oldLimits = await prisma.betLimit.findMany();
        console.log('\n📋 Old bet limits:');
        oldLimits.forEach(limit => {
          console.log(`  ${limit.betType} | Limit: ₱${limit.maxAmount} | Current: ₱${limit.currentTotal}`);
        });
      }
    } catch (error) {
      console.log('\n⚠️  Old BetLimit table not accessible or doesn\'t exist');
    }

    // Check active draws
    console.log('\n🎯 Checking active draws...');
    const activeDraws = await prisma.draw.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Active draws: ${activeDraws.length}`);
    activeDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | ${draw.drawDate} | Status: ${draw.status}`);
    });

    if (activeDraws.length === 0) {
      console.log('\n⚠️  No active draws found! Bet limits need an active draw to work.');
    }

  } catch (error) {
    console.error('❌ Error checking bet limits data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBetLimitsData();
