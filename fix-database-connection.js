#!/usr/bin/env node

/**
 * Quick Database Connection Fix
 * This script helps diagnose and fix the DATABASE_URL issue
 */

console.log('🔍 Diagnosing Database Connection...');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is set');
  console.log('🔗 Database URL:', process.env.DATABASE_URL.substring(0, 20) + '...');
} else {
  console.log('❌ DATABASE_URL is NOT set');
  console.log('🔧 Please add DATABASE_URL environment variable in Render dashboard');
}

// Test Prisma connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Prisma Connection...');
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    
    if (error.message.includes('localhost:5432')) {
      console.log('🔧 Issue: DATABASE_URL is pointing to localhost');
      console.log('💡 Solution: Set DATABASE_URL to your Render PostgreSQL URL');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
