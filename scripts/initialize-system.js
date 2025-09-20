const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initializeSystem() {
  try {
    console.log('🚀 Initializing NewBetting Lottery System...');

    // 1. Initialize default bet limits
    console.log('📊 Setting up bet limits...');
    await prisma.betLimit.upsert({
      where: { betType: 'standard' },
      update: { limitAmount: 1000 },
      create: {
        betType: 'standard',
        limitAmount: 1000,
        isActive: true
      }
    });

    await prisma.betLimit.upsert({
      where: { betType: 'rambolito' },
      update: { limitAmount: 1500 },
      create: {
        betType: 'rambolito',
        limitAmount: 1500,
        isActive: true
      }
    });

    // 2. Initialize winning prizes
    console.log('🏆 Setting up winning prizes...');
    await prisma.winningPrize.upsert({
      where: { betType: 'standard' },
      update: { prizeAmount: 4500 },
      create: {
        betType: 'standard',
        prizeAmount: 4500,
        isActive: true
      }
    });

    await prisma.winningPrize.upsert({
      where: { betType: 'rambolito' },
      update: { prizeAmount: 750 },
      create: {
        betType: 'rambolito',
        prizeAmount: 750, // Base prize for 6 combinations
        isActive: true
      }
    });

    // 3. Initialize system settings
    console.log('⚙️ Setting up system settings...');
    const systemSettings = [
      { key: 'timezone', value: 'Asia/Manila', description: 'System timezone (UTC+08:00)' },
      { key: 'minimum_bet_amount', value: '1', description: 'Minimum bet amount in pesos' },
      { key: 'cutoff_2pm', value: '13:55', description: '2PM draw cutoff time' },
      { key: 'cutoff_5pm', value: '16:55', description: '5PM draw cutoff time' },
      { key: 'cutoff_9pm', value: '20:55', description: '9PM draw cutoff time' },
      { key: 'max_reprint_count', value: '2', description: 'Maximum ticket reprint count' },
      { key: 'system_name', value: 'NewBetting Lottery System', description: 'System name for tickets' },
      { key: 'currency', value: 'PHP', description: 'System currency' },
      { key: 'currency_symbol', value: '₱', description: 'Currency symbol' }
    ];

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { settingKey: setting.key },
        update: { settingValue: setting.value },
        create: {
          settingKey: setting.key,
          settingValue: setting.value,
          description: setting.description
        }
      });
    }

    // 4. Create default ticket templates
    console.log('🎨 Creating default ticket templates...');
    const templates = [
      {
        name: 'Classic Blue',
        design: {
          backgroundColor: '#1e40af',
          textColor: '#ffffff',
          accentColor: '#3b82f6',
          font: 'Arial',
          layout: 'standard'
        }
      },
      {
        name: 'Green Money',
        design: {
          backgroundColor: '#059669',
          textColor: '#ffffff',
          accentColor: '#10b981',
          font: 'Arial',
          layout: 'standard'
        }
      },
      {
        name: 'Royal Purple',
        design: {
          backgroundColor: '#7c3aed',
          textColor: '#ffffff',
          accentColor: '#8b5cf6',
          font: 'Arial',
          layout: 'standard'
        }
      },
      {
        name: 'Orange Burst',
        design: {
          backgroundColor: '#ea580c',
          textColor: '#ffffff',
          accentColor: '#f97316',
          font: 'Arial',
          layout: 'standard'
        }
      },
      {
        name: 'Elegant Black',
        design: {
          backgroundColor: '#1f2937',
          textColor: '#ffffff',
          accentColor: '#6b7280',
          font: 'Arial',
          layout: 'standard'
        }
      }
    ];

    for (const template of templates) {
      await prisma.ticketTemplate.upsert({
        where: { name: template.name },
        update: { design: template.design },
        create: {
          name: template.name,
          design: template.design,
          isActive: true
        }
      });
    }

    // 5. Create default superadmin if not exists
    console.log('👤 Creating default superadmin...');
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: {
          username: 'superadmin',
          passwordHash: hashedPassword,
          fullName: 'System Administrator',
          email: 'admin@newbetting.com',
          role: 'superadmin',
          status: 'active'
        }
      });
      console.log('✅ Default superadmin created (username: superadmin, password: admin123)');
    }

    console.log('🎉 System initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Bet limits: Standard ₱1,000 | Rambolito ₱1,500');
    console.log('✅ Winning prizes: Standard ₱4,500 | Rambolito ₱750/₱1,500');
    console.log('✅ Timezone: UTC+08:00 (Asia/Manila)');
    console.log('✅ Cutoff times: 13:55, 16:55, 20:55');
    console.log('✅ Minimum bet: ₱1');
    console.log('✅ 5 ticket templates created');
    console.log('✅ Default superadmin account ready');

  } catch (error) {
    console.error('❌ System initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
if (require.main === module) {
  initializeSystem()
    .then(() => {
      console.log('🚀 System ready for use!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeSystem;
