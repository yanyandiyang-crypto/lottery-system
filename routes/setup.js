const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

/**
 * Database Setup Route
 * Call this endpoint to set up the database tables and initial data
 * GET /api/v1/setup
 */

router.get('/setup', async (req, res) => {
  console.log('🔧 Database setup requested via API...');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Apply Migrations
    console.log('🗄️ Applying Database Migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully');
    } catch (migrationError) {
      console.log('⚠️ Migration failed, trying db push...');
      try {
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        console.log('✅ Database schema pushed successfully');
      } catch (pushError) {
        console.log('❌ Database setup failed');
        return res.status(500).json({
          success: false,
          message: 'Database setup failed',
          error: pushError.message
        });
      }
    }
    
    // Step 2: Test Connection and Initialize Data
    console.log('🧪 Testing Database Connection...');
    let userCount = 0;
    
    try {
      userCount = await prisma.user.count();
      console.log(`📊 Users in database: ${userCount}`);
    } catch (error) {
      console.log('📊 Database tables not created yet, will initialize...');
      userCount = 0;
    }
    
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
      
      console.log('✅ Superadmin created');
      
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
      
      await prisma.$disconnect();
      
      res.json({
        success: true,
        message: 'Database setup completed successfully!',
        data: {
          superadmin: {
            username: 'superadmin',
            password: 'admin123'
          },
          regions: 5,
          templates: 1,
          betLimits: 2,
          prizeConfigs: 2,
          systemFunctions: 5
        }
      });
      
    } else {
      await prisma.$disconnect();
      res.json({
        success: true,
        message: 'Database already initialized',
        userCount: userCount
      });
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    await prisma.$disconnect();
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  }
});

module.exports = router;
