#!/usr/bin/env node

/**
 * Comprehensive Database Setup Script
 * This script ensures the database is properly set up with all tables and data
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  console.log('🔧 Setting up Database...');
  
  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 2: Apply Migrations (Create Tables)
    console.log('🗄️ Applying Database Migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully');
    } catch (migrationError) {
      console.log('⚠️ Migration failed, trying reset...');
      try {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        console.log('✅ Database reset and migrations applied');
      } catch (resetError) {
        console.log('❌ Migration reset failed, trying manual setup...');
        // Try to create tables manually
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        console.log('✅ Database schema pushed successfully');
      }
    }
    
    // Step 3: Initialize Prisma Client
    console.log('🔌 Connecting to Database...');
    const prisma = new PrismaClient();
    
    // Step 4: Test Connection
    console.log('🧪 Testing Database Connection...');
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Step 5: Initialize Data if Empty
    if (userCount === 0) {
      console.log('🚀 Initializing Essential Data...');
      
      // Create superadmin
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
      
      console.log('✅ Superadmin created:');
      console.log('   Username: superadmin');
      console.log('   Password: admin123');
      
      // Create regions
      await prisma.region.createMany({
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
      await prisma.ticketTemplate.create({
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
      await prisma.betLimit.createMany({
        data: [
          { betType: 'standard', limitAmount: 10000, isActive: true, createdById: superadmin.id },
          { betType: 'rambolito', limitAmount: 5000, isActive: true, createdById: superadmin.id }
        ]
      });
      console.log('✅ Bet limits configured');
      
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
        ]
      });
      console.log('✅ Prize configurations set');
      
      // Create system functions
      await prisma.systemFunction.createMany({
        data: [
          { name: 'User Management', key: 'user_management', description: 'Manage users and roles', category: 'Administration' },
          { name: 'Draw Management', key: 'draw_management', description: 'Manage lottery draws', category: 'Operations' },
          { name: 'Ticket Management', key: 'ticket_management', description: 'Manage tickets and sales', category: 'Operations' },
          { name: 'Reports', key: 'reports', description: 'View reports and analytics', category: 'Reports' },
          { name: 'System Settings', key: 'system_settings', description: 'Configure system settings', category: 'Administration' }
        ]
      });
      console.log('✅ System functions initialized');
      
      console.log('🎉 Database initialization complete!');
    } else {
      console.log('✅ Database already initialized');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
