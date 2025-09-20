#!/usr/bin/env node

/**
 * Simple Database Reset Script
 * Run this directly in Render console to fix the database
 */

const { PrismaClient } = require('@prisma/client');

async function resetDatabase() {
  console.log('🔧 Resetting Database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 2: Apply Migrations
    console.log('🗄️ Applying Migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Step 3: Test Connection
    console.log('✅ Testing Database Connection...');
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Step 4: Initialize if empty
    if (userCount === 0) {
      console.log('🚀 Initializing Database...');
      
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
      
      console.log('✅ Database initialized successfully!');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Database reset complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetDatabase();
