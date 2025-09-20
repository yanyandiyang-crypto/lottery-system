#!/usr/bin/env node

/**
 * Enhanced Server Startup Script
 * Handles database initialization and server startup
 */

const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  console.log('🔧 Setting up Database...');
  
  const { execSync } = require('child_process');
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Apply Migrations
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
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        console.log('✅ Database schema pushed successfully');
      }
    }
    
    // Step 2: Test Connection
    console.log('🧪 Testing Database Connection...');
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Step 3: Initialize Data if Empty
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
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    await prisma.$disconnect();
    console.log('⚠️ Continuing with server startup despite database issues...');
  }
}

async function startServer() {
  console.log('🚀 Starting Lottery System Server...');
  
  // Setup database
  await setupDatabase();
  
  // Start the main server
  console.log('🌐 Starting HTTP Server...');
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    console.log(`📊 Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });
}

// Start the application
startServer().catch((error) => {
  console.error('❌ Startup error:', error);
  process.exit(1);
});
