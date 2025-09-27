#!/usr/bin/env node

/**
 * Deployment Fix Script
 * Diagnoses and fixes deployment issues
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Diagnosing Deployment Issues...');

// Check current git status
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('⚠️ Uncommitted changes detected:', gitStatus);
  } else {
    console.log('✅ No uncommitted changes');
  }
} catch (error) {
  console.log('❌ Git status check failed:', error.message);
}

// Check if we're on the right branch
try {
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`📍 Current branch: ${currentBranch}`);
  
  if (currentBranch !== 'master' && currentBranch !== 'main') {
    console.log('⚠️ Warning: Not on master/main branch');
  }
} catch (error) {
  console.log('❌ Branch check failed:', error.message);
}

// Check remote configuration
try {
  const remotes = execSync('git remote -v', { encoding: 'utf8' });
  console.log('🌐 Remote repositories:');
  console.log(remotes);
} catch (error) {
  console.log('❌ Remote check failed:', error.message);
}

// Create a simple change to force deployment
const timestamp = new Date().toISOString();
const deploymentInfo = {
  timestamp,
  version: '1.0.2',
  deploymentId: `deploy-${Date.now()}`,
  status: 'triggered'
};

fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
console.log('✅ Created deployment info file');

// Update version numbers
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.version = '1.0.2';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
frontendPackageJson.version = '1.0.2';
fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));

console.log('✅ Updated version numbers');

// Commit and push
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Fix: Force deployment update v1.0.2"', { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ Changes pushed to GitHub');
} catch (error) {
  console.log('❌ Git operations failed:', error.message);
}

console.log('\n📋 Manual Steps Required:');
console.log('1. Go to Render dashboard: https://dashboard.render.com');
console.log('2. Find your "lottery-backend" service');
console.log('3. Click "Manual Deploy" button');
console.log('4. Go to Vercel dashboard: https://vercel.com/dashboard');
console.log('5. Find your project and click "Redeploy"');
console.log('6. Wait 3-5 minutes for deployments to complete');
