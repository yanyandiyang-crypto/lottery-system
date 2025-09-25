const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializePrizeConfigurations() {
  console.log('🎯 Initializing Prize Configurations...\n');
  
  try {
    // Find superadmin user
    const superadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });
    
    if (!superadmin) {
      console.log('❌ No superadmin found. Please create a superadmin user first.');
      return;
    }
    
    console.log(`✅ Found superadmin: ${superadmin.fullName}`);
    
    // Default configurations
    const defaultConfigs = [
      {
        betType: 'standard',
        multiplier: 450.0,
        baseAmount: 10.0,
        basePrize: 4500.0,
        description: 'Standard betting: ₱10 bet = ₱4,500 prize (450x multiplier)'
      },
      {
        betType: 'rambolito',
        multiplier: 450.0, // Base multiplier, will be adjusted for rambolito types
        baseAmount: 10.0,
        basePrize: 750.0,
        description: 'Rambolito betting: ₱10 bet = ₱750 prize (75x multiplier), Double: ₱1,500 (150x multiplier)'
      }
    ];
    
    for (const config of defaultConfigs) {
      console.log(`\n🔧 Setting up ${config.betType} configuration...`);
      
      // Check if configuration already exists
      const existing = await prisma.prizeConfiguration.findUnique({
        where: { betType: config.betType }
      });
      
      if (existing) {
        console.log(`   ⚠️  Configuration already exists for ${config.betType}`);
        console.log(`   Current: ${config.betType} - ${existing.multiplier}x multiplier`);
        continue;
      }
      
      // Create new configuration
      const newConfig = await prisma.prizeConfiguration.create({
        data: {
          betType: config.betType,
          multiplier: config.multiplier,
          baseAmount: config.baseAmount,
          basePrize: config.basePrize,
          description: config.description,
          createdById: superadmin.id
        }
      });
      
      console.log(`   ✅ Created ${config.betType} configuration:`);
      console.log(`      Multiplier: ${newConfig.multiplier}x`);
      console.log(`      Base Amount: ₱${newConfig.baseAmount}`);
      console.log(`      Base Prize: ₱${newConfig.basePrize}`);
      console.log(`      Description: ${newConfig.description}`);
    }
    
    console.log('\n📊 Summary:');
    const allConfigs = await prisma.prizeConfiguration.findMany({
      include: {
        createdBy: {
          select: {
            fullName: true
          }
        }
      }
    });
    
    allConfigs.forEach(config => {
      console.log(`   ${config.betType.toUpperCase()}:`);
      console.log(`      Multiplier: ${config.multiplier}x`);
      console.log(`      Base Amount: ₱${config.baseAmount}`);
      console.log(`      Base Prize: ₱${config.basePrize}`);
      console.log(`      Active: ${config.isActive ? 'Yes' : 'No'}`);
      console.log(`      Created by: ${config.createdBy.fullName}`);
    });
    
    console.log('\n🎉 Prize configurations initialized successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run database migration: npx prisma db push');
    console.log('   2. Restart your server');
    console.log('   3. Access prize configuration via API: /api/prize-configuration');
    console.log('   4. Create frontend interface for superadmin to manage prizes');
    
  } catch (error) {
    console.error('❌ Error initializing prize configurations:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializePrizeConfigurations();

