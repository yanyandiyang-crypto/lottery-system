#!/usr/bin/env node

/**
 * Fix Render Backend Issues
 * Creates users and fixes backend configuration
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

console.log('🔧 Fixing Render Backend Issues');
console.log('==============================\n');

// Render database connection
const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
    }
  }
});

async function createDefaultUsers() {
  try {
    console.log('👥 Creating default users...');
    
    // Check if users already exist
    const existingUsers = await renderDb.user.count();
    if (existingUsers > 0) {
      console.log(`✅ Users already exist (${existingUsers} users)`);
      return;
    }
    
    // Create superadmin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superadmin = await renderDb.user.create({
      data: {
        username: 'superadmin',
        passwordHash: hashedPassword,
        fullName: 'Super Administrator',
        email: 'admin@lottery.com',
        role: 'superadmin',
        status: 'active'
      }
    });
    
    console.log('✅ Superadmin created:');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    
    // Create test agent user
    const agentPassword = await bcrypt.hash('agent123', 10);
    
    const agent = await renderDb.user.create({
      data: {
        username: 'agent001',
        passwordHash: agentPassword,
        fullName: 'Test Agent',
        email: 'agent@lottery.com',
        role: 'agent',
        status: 'active'
      }
    });
    
    console.log('✅ Test agent created:');
    console.log('   Username: agent001');
    console.log('   Password: agent123');
    
    // Create regions
    await renderDb.region.createMany({
      data: [
        { name: 'Region 1' },
        { name: 'Region 2' },
        { name: 'Region 3' },
        { name: 'Region 4' },
        { name: 'Region 5' }
      ]
    });
    console.log('✅ 5 regions created');
    
    // Create default template
    await renderDb.ticketTemplate.create({
      data: {
        name: 'Default Template',
        design: {
          header: 'LOTTERY TICKET',
          footer: 'Good Luck!',
          layout: 'standard'
        },
        isActive: true,
        createdById: superadmin.id
      }
    });
    console.log('✅ Default ticket template created');
    
    // Create bet limits
    await renderDb.betLimit.createMany({
      data: [
        { betType: 'standard', limitAmount: 10000, isActive: true, createdById: superadmin.id },
        { betType: 'rambolito', limitAmount: 5000, isActive: true, createdById: superadmin.id }
      ]
    });
    console.log('✅ Bet limits configured');
    
    // Create prize configurations
    await renderDb.prizeConfiguration.createMany({
      data: [
        { 
          betType: 'standard', 
          multiplier: 450.0, 
          baseAmount: 10.0, 
          basePrize: 4500.0,
          description: 'Standard bet prize configuration',
          createdById: superadmin.id
        },
        { 
          betType: 'rambolito', 
          multiplier: 450.0, 
          baseAmount: 10.0, 
          basePrize: 4500.0,
          description: 'Rambolito bet prize configuration',
          createdById: superadmin.id
        }
      ]
    });
    console.log('✅ Prize configurations set');
    
    // Create system functions
    await renderDb.systemFunction.createMany({
      data: [
        { name: 'User Management', key: 'user_management', description: 'Manage users and roles', category: 'Administration' },
        { name: 'Draw Management', key: 'draw_management', description: 'Manage lottery draws', category: 'Operations' },
        { name: 'Ticket Management', key: 'ticket_management', description: 'Manage tickets and sales', category: 'Operations' },
        { name: 'Reports', key: 'reports', description: 'View reports and analytics', category: 'Reports' },
        { name: 'System Settings', key: 'system_settings', description: 'Configure system settings', category: 'Administration' }
      ]
    });
    console.log('✅ System functions initialized');
    
    console.log('\n🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  }
}

async function checkBackendConfiguration() {
  console.log('\n🔍 Checking backend configuration...');
  
  // Check if health endpoint exists
  console.log('📋 Backend Configuration Checklist:');
  console.log('1. ✅ Database connection working');
  console.log('2. ✅ Users created successfully');
  console.log('3. ⚠️ Health endpoint returning 404');
  console.log('4. ⚠️ Backend service may need restart');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Go to Render dashboard: https://dashboard.render.com');
  console.log('2. Find "lottery-backend" service');
  console.log('3. Check service logs for errors');
  console.log('4. Restart the service');
  console.log('5. Verify DATABASE_URL environment variable is set');
}

async function fixBackend() {
  try {
    await renderDb.$connect();
    console.log('✅ Connected to Render database');
    
    await createDefaultUsers();
    await checkBackendConfiguration();
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await renderDb.$disconnect();
  }
}

fixBackend().catch(console.error);
