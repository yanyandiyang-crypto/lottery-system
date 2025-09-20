#!/usr/bin/env node

/**
 * Fix Database Deployment Script
 * This script ensures all Prisma migrations are applied to the Render database
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function fixDatabaseDeployment() {
  console.log('🔧 Fixing Database Deployment...');
  
  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 2: Apply all migrations
    console.log('🗄️ Applying Database Migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Step 3: Verify database connection and tables
    console.log('✅ Verifying Database Connection...');
    const prisma = new PrismaClient();
    
    // Test basic queries
    const userCount = await prisma.user.count();
    const drawCount = await prisma.draw.count();
    const regionCount = await prisma.region.count();
    
    console.log(`📊 Database Status:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Draws: ${drawCount}`);
    console.log(`   - Regions: ${regionCount}`);
    
    // Step 4: Initialize essential data if empty
    if (userCount === 0) {
      console.log('🚀 Initializing Essential Data...');
      
      // Create default regions
      const regions = await prisma.region.createMany({
        data: [
          { name: 'Region 1' },
          { name: 'Region 2' },
          { name: 'Region 3' },
          { name: 'Region 4' },
          { name: 'Region 5' }
        ],
        skipDuplicates: true
      });
      
      // Create superadmin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const superadmin = await prisma.user.create({
        data: {
          username: 'superadmin',
          passwordHash: hashedPassword,
          fullName: 'Super Administrator',
          email: 'admin@lottery.com',
          role: 'superadmin',
          status: 'active'
        }
      });
      
      // Create default ticket template
      const defaultTemplate = await prisma.ticketTemplate.create({
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
      
      // Create bet limits
      await prisma.betLimit.createMany({
        data: [
          { betType: 'standard', limitAmount: 10000, isActive: true, createdById: superadmin.id },
          { betType: 'rambolito', limitAmount: 5000, isActive: true, createdById: superadmin.id }
        ],
        skipDuplicates: true
      });
      
      // Create prize configurations
      await prisma.prizeConfiguration.createMany({
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
        ],
        skipDuplicates: true
      });
      
      // Create system functions
      await prisma.systemFunction.createMany({
        data: [
          { name: 'User Management', key: 'user_management', description: 'Manage users and roles', category: 'Administration' },
          { name: 'Draw Management', key: 'draw_management', description: 'Manage lottery draws', category: 'Operations' },
          { name: 'Ticket Management', key: 'ticket_management', description: 'Manage tickets and sales', category: 'Operations' },
          { name: 'Reports', key: 'reports', description: 'View reports and analytics', category: 'Reports' },
          { name: 'System Settings', key: 'system_settings', description: 'Configure system settings', category: 'Administration' }
        ],
        skipDuplicates: true
      });
      
      console.log('✅ Essential data initialized successfully!');
      console.log(`   - Superadmin created: username: superadmin, password: admin123`);
      console.log(`   - Default regions created: 5 regions`);
      console.log(`   - Default template created`);
      console.log(`   - Bet limits configured`);
      console.log(`   - Prize configurations set`);
      console.log(`   - System functions initialized`);
    }
    
    await prisma.$disconnect();
    
    console.log('🎉 Database deployment fixed successfully!');
    console.log('🚀 Your lottery system is now ready to use!');
    
  } catch (error) {
    console.error('❌ Error fixing database deployment:', error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseDeployment();
