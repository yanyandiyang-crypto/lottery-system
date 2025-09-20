#!/usr/bin/env node

/**
 * Enhanced Server Startup Script
 * Handles database initialization and server startup
 */

const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function verifyDatabase() {
  console.log('🔍 Verifying Database Connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    console.log(`📊 Database Status: ${userCount} users found`);
    
    if (userCount === 0) {
      console.log('⚠️ Database appears empty - this should not happen after build');
    } else {
      console.log('✅ Database is properly initialized');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database verification error:', error.message);
    await prisma.$disconnect();
    console.log('⚠️ Continuing with server startup despite database issues...');
  }
}

async function startServer() {
  console.log('🚀 Starting Lottery System Server...');
  
  // Verify database connection
  await verifyDatabase();
  
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
