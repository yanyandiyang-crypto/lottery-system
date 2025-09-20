#!/usr/bin/env node

/**
 * Enhanced Server Startup Script
 * Handles database initialization and server startup
 */

const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  console.log('🔧 Initializing Database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check if database is initialized
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('🚀 Database is empty, initializing...');
      
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
      
      // Create bet limits
      await prisma.betLimit.createMany({
        data: [
          { betType: 'standard', limitAmount: 10000, isActive: true, createdById: superadmin.id },
          { betType: 'rambolito', limitAmount: 5000, isActive: true, createdById: superadmin.id }
        ]
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
        ]
      });
      
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
      
      console.log('✅ Database initialized successfully!');
    } else {
      console.log('✅ Database already initialized');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    await prisma.$disconnect();
    // Don't exit, continue with server startup
  }
}

async function startServer() {
  console.log('🚀 Starting Lottery System Server...');
  
  // Initialize database first
  await initializeDatabase();
  
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
