const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializePerNumberBetLimits() {
  try {
    console.log('🎯 Initializing per-number bet limits...');

    // Get current active draw
    const currentDraw = await prisma.draw.findFirst({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' }
    });

    let targetDraw = currentDraw;
    if (!targetDraw) {
      console.log('❌ No active draw found. Creating a sample draw...');
      
      // Create a sample draw for today
      const today = new Date();
      const sampleDraw = await prisma.draw.create({
        data: {
          drawDate: today,
          drawTime: 'twoPM',
          status: 'open'
        }
      });
      
      console.log('✅ Created sample draw:', sampleDraw.id);
      targetDraw = sampleDraw;
    }

    console.log('✅ Using draw:', targetDraw.id, targetDraw.drawTime);

    // Check if bet limits already exist for this draw
    const existingLimits = await prisma.bet_limits_per_draw.findMany({
      where: { draw_id: targetDraw.id }
    });
    
    if (existingLimits.length > 0) {
      console.log('✅ Bet limits already exist for this draw:', existingLimits.length, 'records found');
      console.log('Current bet limits:');
      existingLimits.forEach(limit => {
        console.log(`  - ${limit.bet_combination} (${limit.bet_type}): ₱${limit.limit_amount.toLocaleString()}`);
      });
      return;
    }

    // Sample number combinations with limits
    const sampleBetLimits = [
      // Standard bet limits
      { combination: '123', type: 'standard', limit: 10000 },
      { combination: '456', type: 'standard', limit: 15000 },
      { combination: '789', type: 'standard', limit: 12000 },
      { combination: '001', type: 'standard', limit: 8000 },
      { combination: '999', type: 'standard', limit: 20000 },
      
      // Rambolito bet limits
      { combination: '123', type: 'rambolito', limit: 5000 },
      { combination: '456', type: 'rambolito', limit: 7500 },
      { combination: '789', type: 'rambolito', limit: 6000 },
      { combination: '001', type: 'rambolito', limit: 4000 },
      { combination: '999', type: 'rambolito', limit: 10000 },
    ];

    console.log('📝 Creating sample bet limits...');
    
    for (const limitData of sampleBetLimits) {
      const createdLimit = await prisma.bet_limits_per_draw.create({
        data: {
          draw_id: targetDraw.id,
          bet_combination: limitData.combination,
          bet_type: limitData.type,
          limit_amount: limitData.limit,
          current_amount: 0,
          is_sold_out: false,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Created bet limit: ${createdLimit.bet_combination} (${createdLimit.bet_type}) - ₱${createdLimit.limit_amount.toLocaleString()}`);
    }

    console.log('🎉 Per-number bet limits initialization completed successfully!');
    
    // Verify the created limits
    const allLimits = await prisma.bet_limits_per_draw.findMany({
      where: { draw_id: targetDraw.id },
      include: {
        draws: {
          select: { drawDate: true, drawTime: true }
        }
      },
      orderBy: [
        { bet_combination: 'asc' },
        { bet_type: 'asc' }
      ]
    });
    
    console.log('\n📊 Current bet limits in database:');
    allLimits.forEach(limit => {
      console.log(`  - ${limit.bet_combination} (${limit.bet_type.toUpperCase()}): ₱${limit.limit_amount.toLocaleString()}`);
      console.log(`    Current: ₱${limit.current_amount.toLocaleString()} | Sold Out: ${limit.is_sold_out ? 'Yes' : 'No'}`);
      console.log(`    Draw: ${limit.draws.drawTime} - ${limit.draws.drawDate.toDateString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error initializing per-number bet limits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
if (require.main === module) {
  initializePerNumberBetLimits()
    .then(() => {
      console.log('✅ Per-number bet limits initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Per-number bet limits initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializePerNumberBetLimits };
