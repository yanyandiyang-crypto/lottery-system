#!/usr/bin/env node

/**
 * Diagnose Login Issue
 * Checks backend connectivity and database connection
 */

const https = require('https');

console.log('🔍 Diagnosing Login Issue');
console.log('=========================\n');

const backendUrl = 'https://lottery-system-tna9.onrender.com';
const renderDbUrl = 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0';

async function testBackendHealth() {
  return new Promise((resolve) => {
    console.log('🏥 Testing backend health endpoint...');
    
    const req = https.get(`${backendUrl}/api/v1/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend health check: OK');
          resolve(true);
        } else {
          console.log(`❌ Backend health check failed: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Backend connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('❌ Backend connection timeout');
      resolve(false);
    });
  });
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Render database connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const renderDb = new PrismaClient({
      datasources: {
        db: {
          url: renderDbUrl
        }
      }
    });
    
    // Test connection
    await renderDb.$connect();
    console.log('✅ Database connection: OK');
    
    // Test user data
    const userCount = await renderDb.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const sampleUser = await renderDb.user.findFirst();
      console.log(`👤 Sample user: ${sampleUser.username} (${sampleUser.role})`);
    } else {
      console.log('⚠️ No users found in database!');
    }
    
    await renderDb.$disconnect();
    return true;
    
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function testLoginEndpoint() {
  return new Promise((resolve) => {
    console.log('\n🔐 Testing login endpoint...');
    
    const postData = JSON.stringify({
      username: 'superadmin',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'lottery-system-tna9.onrender.com',
      port: 443,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Login endpoint: OK');
          try {
            const response = JSON.parse(data);
            if (response.success) {
              console.log('✅ Login test successful');
            } else {
              console.log(`❌ Login failed: ${response.message}`);
            }
          } catch (e) {
            console.log('⚠️ Unexpected response format');
          }
        } else {
          console.log(`❌ Login endpoint failed: ${res.statusCode}`);
          console.log(`Response: ${data}`);
        }
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Login request failed: ${error.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function diagnoseIssue() {
  console.log('Starting diagnosis...\n');
  
  const backendOk = await testBackendHealth();
  const databaseOk = await testDatabaseConnection();
  const loginOk = await testLoginEndpoint();
  
  console.log('\n📋 Diagnosis Summary:');
  console.log('======================');
  console.log(`Backend Health: ${backendOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Database Connection: ${databaseOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Login Endpoint: ${loginOk ? '✅ OK' : '❌ FAILED'}`);
  
  console.log('\n🔧 Troubleshooting Steps:');
  
  if (!backendOk) {
    console.log('1. ❌ Backend is down - Check Render service status');
    console.log('   - Go to: https://dashboard.render.com');
    console.log('   - Find "lottery-backend" service');
    console.log('   - Check logs for errors');
    console.log('   - Restart the service if needed');
  }
  
  if (!databaseOk) {
    console.log('2. ❌ Database connection failed');
    console.log('   - Check Render database status');
    console.log('   - Verify DATABASE_URL environment variable');
    console.log('   - Run database migration if needed');
  }
  
  if (!loginOk) {
    console.log('3. ❌ Login endpoint failed');
    console.log('   - Check backend logs for authentication errors');
    console.log('   - Verify user credentials exist in database');
    console.log('   - Check CORS configuration');
  }
  
  if (backendOk && databaseOk && loginOk) {
    console.log('✅ All systems operational!');
    console.log('💡 The issue might be:');
    console.log('   - Frontend API URL configuration');
    console.log('   - CORS settings');
    console.log('   - Browser cache');
    console.log('   - Network connectivity');
  }
  
  console.log('\n🌐 Test URLs:');
  console.log(`Backend: ${backendUrl}`);
  console.log(`Frontend: https://lottery-system-gamma.vercel.app`);
}

diagnoseIssue().catch(console.error);
