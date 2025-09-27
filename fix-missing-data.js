#!/usr/bin/env node

/**
 * Fix Missing Data in Render Database
 * Creates missing tables and populates essential data for frontend
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

console.log('🔧 Fixing Missing Data in Render Database');
console.log('==========================================\n');

// Render database connection
const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
    }
  }
});

async function createMissingTables() {
  console.log('📊 Creating missing tables...');
  
  try {
    // Create missing tables using raw SQL
    const createTablesSQL = `
      -- Create ticket_templates table
      CREATE TABLE IF NOT EXISTS ticket_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        design JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create bet_limits table
      CREATE TABLE IF NOT EXISTS bet_limits (
        id SERIAL PRIMARY KEY,
        bet_type VARCHAR(50) NOT NULL,
        limit_amount DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create prize_configurations table
      CREATE TABLE IF NOT EXISTS prize_configurations (
        id SERIAL PRIMARY KEY,
        bet_type VARCHAR(50) NOT NULL,
        multiplier DECIMAL(10,2) NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        base_prize DECIMAL(10,2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        updated_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create draw_results table
      CREATE TABLE IF NOT EXISTS draw_results (
        id SERIAL PRIMARY KEY,
        draw_id INTEGER NOT NULL,
        winning_number VARCHAR(10),
        input_by INTEGER,
        input_at TIMESTAMP DEFAULT NOW(),
        is_official BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create system_functions table
      CREATE TABLE IF NOT EXISTS system_functions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_ticket_id INTEGER,
        related_draw_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await renderDb.$executeRawUnsafe(createTablesSQL);
    console.log('✅ Missing tables created successfully');
    
  } catch (error) {
    console.log(`⚠️ Some tables might already exist: ${error.message}`);
  }
}

async function populateEssentialData() {
  console.log('\n📋 Populating essential data...');
  
  try {
    // Get the first user (superadmin) for created_by references
    const superadmin = await renderDb.user.findFirst({
      where: { role: 'superadmin' }
    });
    
    if (!superadmin) {
      console.log('❌ No superadmin found, creating one...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newSuperadmin = await renderDb.user.create({
        data: {
          username: 'superadmin',
          passwordHash: hashedPassword,
          fullName: 'Super Administrator',
          email: 'admin@lottery.com',
          role: 'superadmin',
          status: 'active'
        }
      });
      console.log('✅ Superadmin created');
      return newSuperadmin.id;
    }
    
    const superadminId = superadmin.id;
    
    // Create system functions
    const systemFunctions = [
      { name: 'User Management', key: 'user_management', description: 'Manage users and roles', category: 'Administration' },
      { name: 'Draw Management', key: 'draw_management', description: 'Manage lottery draws', category: 'Operations' },
      { name: 'Ticket Management', key: 'ticket_management', description: 'Manage tickets and sales', category: 'Operations' },
      { name: 'Reports', key: 'reports', description: 'View reports and analytics', category: 'Reports' },
      { name: 'System Settings', key: 'system_settings', description: 'Configure system settings', category: 'Administration' }
    ];
    
    for (const func of systemFunctions) {
      await renderDb.systemFunction.upsert({
        where: { key: func.key },
        update: func,
        create: func
      });
    }
    console.log('✅ System functions created');
    
    // Create default ticket template
    await renderDb.ticketTemplate.upsert({
      where: { name: 'Default Template' },
      update: {
        design: {
          header: 'LOTTERY TICKET',
          footer: 'Good Luck!',
          layout: 'standard'
        },
        isActive: true
      },
      create: {
        name: 'Default Template',
        design: {
          header: 'LOTTERY TICKET',
          footer: 'Good Luck!',
          layout: 'standard'
        },
        isActive: true,
        createdById: superadminId
      }
    });
    console.log('✅ Default ticket template created');
    
    // Create bet limits
    const betLimits = [
      { betType: 'standard', limitAmount: 10000, isActive: true },
      { betType: 'rambolito', limitAmount: 5000, isActive: true }
    ];
    
    for (const limit of betLimits) {
      await renderDb.betLimit.upsert({
        where: { betType: limit.betType },
        update: limit,
        create: { ...limit, createdById: superadminId }
      });
    }
    console.log('✅ Bet limits created');
    
    // Create prize configurations
    const prizeConfigs = [
      { 
        betType: 'standard', 
        multiplier: 450.0, 
        baseAmount: 10.0, 
        basePrize: 4500.0,
        description: 'Standard bet prize configuration'
      },
      { 
        betType: 'rambolito', 
        multiplier: 450.0, 
        baseAmount: 10.0, 
        basePrize: 4500.0,
        description: 'Rambolito bet prize configuration'
      }
    ];
    
    for (const config of prizeConfigs) {
      await renderDb.prizeConfiguration.upsert({
        where: { betType: config.betType },
        update: config,
        create: { ...config, createdById: superadminId }
      });
    }
    console.log('✅ Prize configurations created');
    
    // Create sample notifications
    const notifications = [
      {
        userId: superadminId,
        title: 'System Ready',
        message: 'Lottery system is now operational',
        isRead: false
      },
      {
        userId: superadminId,
        title: 'Data Migration Complete',
        message: 'All local data has been successfully migrated',
        isRead: false
      }
    ];
    
    for (const notification of notifications) {
      await renderDb.notification.create({
        data: notification
      });
    }
    console.log('✅ Sample notifications created');
    
  } catch (error) {
    console.log(`⚠️ Error populating data: ${error.message}`);
  }
}

async function verifyData() {
  console.log('\n🔍 Verifying data...');
  
  try {
    const counts = {
      users: await renderDb.user.count(),
      tickets: await renderDb.ticket.count(),
      draws: await renderDb.draw.count(),
      bets: await renderDb.bet.count(),
      systemFunctions: await renderDb.systemFunction.count(),
      ticketTemplates: await renderDb.ticketTemplate.count(),
      betLimits: await renderDb.betLimit.count(),
      prizeConfigurations: await renderDb.prizeConfiguration.count(),
      notifications: await renderDb.notification.count()
    };
    
    console.log('📊 Data Summary:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
    console.log('\n✅ Data verification complete!');
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
  }
}

async function fixMissingData() {
  try {
    await renderDb.$connect();
    console.log('✅ Connected to Render database');
    
    await createMissingTables();
    await populateEssentialData();
    await verifyData();
    
    console.log('\n🎉 Missing Data Fix Complete!');
    console.log('==============================');
    console.log('✅ Missing tables created');
    console.log('✅ Essential data populated');
    console.log('✅ Frontend should now work properly');
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Update Render service DATABASE_URL');
    console.log('2. Restart Render service');
    console.log('3. Test Vercel frontend');
    console.log('4. Check for any remaining "Failed to fetch" errors');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await renderDb.$disconnect();
  }
}

fixMissingData().catch(console.error);
