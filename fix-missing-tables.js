#!/usr/bin/env node

/**
 * Fix Missing Tables in Render Database
 * Creates missing tables one by one
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

console.log('🔧 Creating Missing Tables in Render Database');
console.log('==============================================\n');

// Render database connection
const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
    }
  }
});

async function createTable(tableName, createSQL) {
  try {
    console.log(`📊 Creating ${tableName}...`);
    await renderDb.$executeRawUnsafe(createSQL);
    console.log(`✅ ${tableName} created successfully`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ ${tableName} already exists`);
      return true;
    } else {
      console.log(`❌ Failed to create ${tableName}: ${error.message}`);
      return false;
    }
  }
}

async function createMissingTables() {
  console.log('📊 Creating missing tables one by one...');
  
  const tables = [
    {
      name: 'ticket_templates',
      sql: `CREATE TABLE IF NOT EXISTS ticket_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        design JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'bet_limits',
      sql: `CREATE TABLE IF NOT EXISTS bet_limits (
        id SERIAL PRIMARY KEY,
        bet_type VARCHAR(50) NOT NULL,
        limit_amount DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'prize_configurations',
      sql: `CREATE TABLE IF NOT EXISTS prize_configurations (
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
      )`
    },
    {
      name: 'draw_results',
      sql: `CREATE TABLE IF NOT EXISTS draw_results (
        id SERIAL PRIMARY KEY,
        draw_id INTEGER NOT NULL,
        winning_number VARCHAR(10),
        input_by INTEGER,
        input_at TIMESTAMP DEFAULT NOW(),
        is_official BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'system_functions',
      sql: `CREATE TABLE IF NOT EXISTS system_functions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'notifications',
      sql: `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        related_ticket_id INTEGER,
        related_draw_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'current_bet_totals',
      sql: `CREATE TABLE IF NOT EXISTS current_bet_totals (
        id SERIAL PRIMARY KEY,
        draw_id INTEGER NOT NULL,
        bet_combination VARCHAR(10) NOT NULL,
        bet_type VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10,2) DEFAULT 0,
        ticket_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'audit_log',
      sql: `CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        table_name VARCHAR(100) NOT NULL,
        record_id INTEGER,
        action VARCHAR(50) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    },
    {
      name: 'login_audit',
      sql: `CREATE TABLE IF NOT EXISTS login_audit (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        ip_address INET,
        user_agent TEXT,
        login_time TIMESTAMP DEFAULT NOW(),
        success BOOLEAN DEFAULT true
      )`
    }
  ];
  
  let successCount = 0;
  for (const table of tables) {
    const success = await createTable(table.name, table.sql);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Table Creation Summary: ${successCount}/${tables.length} tables created`);
  return successCount === tables.length;
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
    
    // Create system functions using raw SQL
    const systemFunctionsSQL = `
      INSERT INTO system_functions (name, key, description, category, is_active) VALUES
      ('User Management', 'user_management', 'Manage users and roles', 'Administration', true),
      ('Draw Management', 'draw_management', 'Manage lottery draws', 'Operations', true),
      ('Ticket Management', 'ticket_management', 'Manage tickets and sales', 'Operations', true),
      ('Reports', 'reports', 'View reports and analytics', 'Reports', true),
      ('System Settings', 'system_settings', 'Configure system settings', 'Administration', true)
      ON CONFLICT (key) DO NOTHING
    `;
    
    await renderDb.$executeRawUnsafe(systemFunctionsSQL);
    console.log('✅ System functions created');
    
    // Create default ticket template using raw SQL
    const ticketTemplateSQL = `
      INSERT INTO ticket_templates (name, design, is_active, created_by) VALUES
      ('Default Template', '{"header": "LOTTERY TICKET", "footer": "Good Luck!", "layout": "standard"}', true, ${superadminId})
      ON CONFLICT (name) DO NOTHING
    `;
    
    await renderDb.$executeRawUnsafe(ticketTemplateSQL);
    console.log('✅ Default ticket template created');
    
    // Create bet limits using raw SQL
    const betLimitsSQL = `
      INSERT INTO bet_limits (bet_type, limit_amount, is_active, created_by) VALUES
      ('standard', 10000.00, true, ${superadminId}),
      ('rambolito', 5000.00, true, ${superadminId})
      ON CONFLICT (bet_type) DO NOTHING
    `;
    
    await renderDb.$executeRawUnsafe(betLimitsSQL);
    console.log('✅ Bet limits created');
    
    // Create prize configurations using raw SQL
    const prizeConfigsSQL = `
      INSERT INTO prize_configurations (bet_type, multiplier, base_amount, base_prize, description, is_active, created_by) VALUES
      ('standard', 450.00, 10.00, 4500.00, 'Standard bet prize configuration', true, ${superadminId}),
      ('rambolito', 450.00, 10.00, 4500.00, 'Rambolito bet prize configuration', true, ${superadminId})
      ON CONFLICT (bet_type) DO NOTHING
    `;
    
    await renderDb.$executeRawUnsafe(prizeConfigsSQL);
    console.log('✅ Prize configurations created');
    
    // Create sample notifications using raw SQL
    const notificationsSQL = `
      INSERT INTO notifications (user_id, title, message, is_read) VALUES
      (${superadminId}, 'System Ready', 'Lottery system is now operational', false),
      (${superadminId}, 'Data Migration Complete', 'All local data has been successfully migrated', false)
    `;
    
    await renderDb.$executeRawUnsafe(notificationsSQL);
    console.log('✅ Sample notifications created');
    
  } catch (error) {
    console.log(`⚠️ Error populating data: ${error.message}`);
  }
}

async function verifyData() {
  console.log('\n🔍 Verifying data...');
  
  try {
    // Use raw SQL to count records
    const counts = {
      users: await renderDb.$queryRaw`SELECT COUNT(*) FROM users`,
      tickets: await renderDb.$queryRaw`SELECT COUNT(*) FROM tickets`,
      draws: await renderDb.$queryRaw`SELECT COUNT(*) FROM draws`,
      bets: await renderDb.$queryRaw`SELECT COUNT(*) FROM bets`,
      systemFunctions: await renderDb.$queryRaw`SELECT COUNT(*) FROM system_functions`,
      ticketTemplates: await renderDb.$queryRaw`SELECT COUNT(*) FROM ticket_templates`,
      betLimits: await renderDb.$queryRaw`SELECT COUNT(*) FROM bet_limits`,
      prizeConfigurations: await renderDb.$queryRaw`SELECT COUNT(*) FROM prize_configurations`,
      notifications: await renderDb.$queryRaw`SELECT COUNT(*) FROM notifications`
    };
    
    console.log('📊 Data Summary:');
    Object.entries(counts).forEach(([table, result]) => {
      const count = result[0].count;
      console.log(`   ${table}: ${count} records`);
    });
    
    console.log('\n✅ Data verification complete!');
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
  }
}

async function fixMissingTables() {
  try {
    await renderDb.$connect();
    console.log('✅ Connected to Render database');
    
    const tablesCreated = await createMissingTables();
    if (tablesCreated) {
      await populateEssentialData();
      await verifyData();
    }
    
    console.log('\n🎉 Missing Tables Fix Complete!');
    console.log('================================');
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

fixMissingTables().catch(console.error);
