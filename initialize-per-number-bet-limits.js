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
    const existingLimits = await prisma.betLimitPerDraw.findMany({
      where: { drawId: targetDraw.id }
    });
    
    if (existingLimits.length > 0) {
      console.log('✅ Bet limits already exist for this draw:', existingLimits.length, 'records found');
      console.log('Current bet limits:');
      existingLimits.forEach(limit => {
        console.log(`  - ${limit.betCombination} (${limit.betType}): ₱${limit.limitAmount.toLocaleString()}`);
      });
      return;
    }

    // Sample number combinations with limits
    const sampleBetLimits = [
      // Standard bet limits
      { combination: '123', type: 'standard', limit: 1000 },
      { combination: '456', type: 'standard', limit: 1000 },
      { combination: '789', type: 'standard', limit: 1000 },
      { combination: '001', type: 'standard', limit: 1000 },
      { combination: '999', type: 'standard', limit: 1000 },
      
      // Rambolito bet limits
      { combination: '123', type: 'rambolito', limit: 1500 },
      { combination: '456', type: 'rambolito', limit: 1500 },
      { combination: '789', type: 'rambolito', limit: 1500 },
      { combination: '001', type: 'rambolito', limit: 1500 },
      { combination: '999', type: 'rambolito', limit: 1500 },
    ];

    console.log('📝 Creating sample bet limits...');

    // Get superadmin user for created_by
    const superadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });
    
    for (const limitData of sampleBetLimits) {
      const createdLimit = await prisma.betLimitPerDraw.create({
        data: {
          drawId: targetDraw.id,
          betCombination: limitData.combination,
          betType: limitData.type,
          limitAmount: limitData.limit,
          currentAmount: 0,
          isSoldOut: false,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Created bet limit: ${createdLimit.betCombination} (${createdLimit.betType}) - ₱${createdLimit.limitAmount.toLocaleString()}`);
    }

    console.log('🎉 Per-number bet limits initialization completed successfully!');
    
    // Verify the created limits
    const allLimits = await prisma.betLimitPerDraw.findMany({
      where: { drawId: targetDraw.id },
      include: {
        draw: true
      },
      orderBy: [
        { betCombination: 'asc' },
        { betType: 'asc' }
      ]
    });
    
    console.log('\n📊 Current bet limits in database:');
    allLimits.forEach(limit => {
      console.log(`  - ${limit.betCombination} (${limit.betType}) - ₱${limit.limitAmount.toLocaleString()}`);
      console.log(`    Current Amount: ₱${limit.currentAmount.toLocaleString()} | Sold Out: ${limit.isSoldOut ? 'Yes' : 'No'}`);
      console.log(`    Draw: ${limit.draw.drawTime} - ${limit.draw.drawDate.toLocaleDateString()}`);
      console.log('');
    });  } catch (error) {
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
