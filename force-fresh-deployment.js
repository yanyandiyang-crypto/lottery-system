#!/usr/bin/env node

/**
 * Force Fresh Deployment Script
 * Creates significant changes to force platform rebuilds
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔥 FORCING FRESH DEPLOYMENTS...');

// Create a major version bump
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.version = '2.0.0';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
frontendPackageJson.version = '2.0.0';
fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));

// Update Vercel config with new version
const vercelConfig = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
vercelConfig.env.REACT_APP_VERSION = '2.0.0';
fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelConfig, null, 2));

console.log('✅ Updated to version 2.0.0');

// Add a new environment variable to force rebuild
const envContent = `# Deployment Environment Variables
DEPLOYMENT_VERSION=2.0.0
DEPLOYMENT_TIMESTAMP=${new Date().toISOString()}
FORCE_REBUILD=true
BUILD_ID=${Date.now()}
`;
fs.writeFileSync('.env.deployment', envContent);

// Create a build trigger file
const buildTrigger = {
  version: '2.0.0',
  timestamp: new Date().toISOString(),
  buildId: `build-${Date.now()}`,
  features: [
    'Ticket Claiming System',
    'Ticket Verification',
    'Winning Reports Dashboard',
    'Enhanced Mobile POS',
    'QR Ticket System',
    'New UI Components',
    'Database Migrations',
    'Enhanced Templates'
  ],
  deployment: {
    render: 'manual-required',
    vercel: 'manual-required',
    github: 'completed'
  }
};

fs.writeFileSync('build-trigger.json', JSON.stringify(buildTrigger, null, 2));

// Update server.js to include version info
const serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('DEPLOYMENT_VERSION')) {
  const versionComment = `\n// DEPLOYMENT VERSION: 2.0.0 - ${new Date().toISOString()}\n`;
  fs.writeFileSync('server.js', versionComment + serverContent);
}

console.log('✅ Created build trigger files');

// Commit and push
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "BREAKING: Major version 2.0.0 - Force fresh deployment"', { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ Changes pushed to GitHub');
} catch (error) {
  console.log('❌ Git operations failed:', error.message);
}

console.log('\n🚨 CRITICAL: MANUAL DEPLOYMENT REQUIRED');
console.log('=====================================');
console.log('');
console.log('🔧 RENDER BACKEND:');
console.log('1. Go to: https://dashboard.render.com');
console.log('2. Find "lottery-backend" service');
console.log('3. Click "Manual Deploy" → "Deploy latest commit"');
console.log('4. Wait for deployment to complete');
console.log('');
console.log('🌐 VERCEL FRONTEND:');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Find your lottery project');
console.log('3. Click "Deployments" → "Redeploy"');
console.log('4. Wait for build to complete');
console.log('');
console.log('⏱️ Expected Timeline:');
console.log('- Render: 3-5 minutes');
console.log('- Vercel: 2-3 minutes');
console.log('');
console.log('✅ After deployment, test:');
console.log('- Backend: https://lottery-system-tna9.onrender.com/api/v1/health');
console.log('- Frontend: https://lottery-system-gamma.vercel.app');
console.log('');
console.log('🎯 New Features to Test:');
console.log('- Ticket claiming system');
console.log('- Ticket verification');
console.log('- Winning reports');
console.log('- Enhanced mobile POS');
