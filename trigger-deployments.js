#!/usr/bin/env node

/**
 * Deployment Trigger Script
 * Forces updates on Render and Vercel by making a small change
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Triggering Deployment Updates...');

// Create a deployment trigger file
const triggerContent = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  deployment: 'manual-trigger',
  changes: [
    'Ticket claiming system',
    'Ticket verification',
    'Winning reports',
    'Enhanced mobile POS',
    'QR ticket system',
    'New UI components',
    'Database migrations',
    'Enhanced templates'
  ]
};

// Write trigger file
fs.writeFileSync('deployment-trigger.json', JSON.stringify(triggerContent, null, 2));
console.log('✅ Created deployment trigger file');

// Update package.json version to force rebuild
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
packageJson.version = versionParts.join('.');

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log(`✅ Updated version from ${currentVersion} to ${packageJson.version}`);

// Update frontend package.json version
const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
frontendPackageJson.version = packageJson.version;
fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
console.log(`✅ Updated frontend version to ${packageJson.version}`);

// Commit and push changes
try {
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ Staged changes');
  
  execSync(`git commit -m "Deployment trigger: Force update v${packageJson.version}"`, { stdio: 'inherit' });
  console.log('✅ Committed changes');
  
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub');
  
  console.log('\n🎉 Deployment Trigger Complete!');
  console.log('📋 Next Steps:');
  console.log('1. Check Render dashboard for auto-deployment');
  console.log('2. Check Vercel dashboard for auto-deployment');
  console.log('3. Wait 2-3 minutes for deployments to complete');
  console.log('4. Test your applications');
  
} catch (error) {
  console.error('❌ Error during git operations:', error.message);
  console.log('💡 Please manually commit and push your changes');
}
