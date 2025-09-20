const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeBetLimits() {
  try {
    console.log('🎯 Initializing bet limits...');

    // Check if bet limits already exist
    const existingLimits = await prisma.betLimit.findMany();
    
    if (existingLimits.length > 0) {
      console.log('✅ Bet limits already exist:', existingLimits.length, 'records found');
      console.log('Current bet limits:');
      existingLimits.forEach(limit => {
        console.log(`  - ${limit.betType}: ₱${limit.limitAmount.toLocaleString()}`);
      });
      return;
    }

    // Find a SuperAdmin user to assign as creator
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (!superAdmin) {
      console.log('❌ No SuperAdmin found. Creating bet limits without creator assignment.');
    }

    // Default bet limits for different bet types
    const defaultBetLimits = [
      {
        betType: 'standard',
        limitAmount: 100000.00, // ₱100,000 limit for standard bets
        isActive: true,
        createdById: superAdmin?.id || null
      },
      {
        betType: 'rambolito',
        limitAmount: 50000.00,  // ₱50,000 limit for rambolito bets
        isActive: true,
        createdById: superAdmin?.id || null
      }
    ];

    console.log('📝 Creating default bet limits...');
    
    for (const limitData of defaultBetLimits) {
      const createdLimit = await prisma.betLimit.create({
        data: limitData
      });
      
      console.log(`✅ Created bet limit: ${createdLimit.betType} - ₱${createdLimit.limitAmount.toLocaleString()}`);
    }

    console.log('🎉 Bet limits initialization completed successfully!');
    
    // Verify the created limits
    const allLimits = await prisma.betLimit.findMany({
      include: {
        createdBy: {
          select: { fullName: true, username: true }
        }
      }
    });
    
    console.log('\n📊 Current bet limits in database:');
    allLimits.forEach(limit => {
      console.log(`  - ${limit.betType.toUpperCase()}: ₱${limit.limitAmount.toLocaleString()}`);
      console.log(`    Created by: ${limit.createdBy?.fullName || 'System'}`);
      console.log(`    Status: ${limit.isActive ? 'Active' : 'Inactive'}`);
      console.log(`    Created: ${limit.createdAt.toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error initializing bet limits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
if (require.main === module) {
  initializeBetLimits()
    .then(() => {
      console.log('✅ Bet limits initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Bet limits initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeBetLimits };
