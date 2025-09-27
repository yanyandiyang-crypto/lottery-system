#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Checks if deployments are working and provides next steps
 */

const https = require('https');

console.log('🔍 CHECKING DEPLOYMENT STATUS...\n');

// Function to check URL
function checkUrl(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name,
          url,
          status: res.statusCode,
          headers: res.headers,
          success: res.statusCode === 200
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name,
        url,
        status: 'ERROR',
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        success: false
      });
    });
  });
}

async function checkDeployments() {
  console.log('📡 Testing Services...\n');
  
  const services = [
    { url: 'https://lottery-system-tna9.onrender.com/api/v1/health', name: 'Render Backend' },
    { url: 'https://lottery-system-gamma.vercel.app', name: 'Vercel Frontend' }
  ];
  
  for (const service of services) {
    const result = await checkUrl(service.url, service.name);
    
    if (result.success) {
      console.log(`✅ ${result.name}: ONLINE (${result.status})`);
      if (result.headers['last-modified']) {
        console.log(`   Last Modified: ${result.headers['last-modified']}`);
      }
      if (result.headers['x-vercel-cache']) {
        console.log(`   Cache Status: ${result.headers['x-vercel-cache']}`);
      }
    } else {
      console.log(`❌ ${result.name}: OFFLINE (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }
  
  console.log('📋 DEPLOYMENT STATUS SUMMARY:');
  console.log('=============================');
  console.log('');
  console.log('🔧 RENDER BACKEND:');
  console.log('- Service: lottery-backend');
  console.log('- URL: https://lottery-system-tna9.onrender.com');
  console.log('- Status: Check dashboard for deployment status');
  console.log('- Action: Manual deploy required if not updating');
  console.log('');
  console.log('🌐 VERCEL FRONTEND:');
  console.log('- Project: lottery-system-gamma');
  console.log('- URL: https://lottery-system-gamma.vercel.app');
  console.log('- Status: Check dashboard for deployment status');
  console.log('- Action: Manual redeploy required if not updating');
  console.log('');
  console.log('🚨 IF SERVICES ARE NOT UPDATING:');
  console.log('1. Go to Render dashboard → Manual Deploy');
  console.log('2. Go to Vercel dashboard → Redeploy');
  console.log('3. Wait 5 minutes for deployments to complete');
  console.log('4. Clear browser cache and test again');
  console.log('');
  console.log('📞 SUPPORT LINKS:');
  console.log('- Render: https://render.com/support');
  console.log('- Vercel: https://vercel.com/support');
}

checkDeployments().catch(console.error);
