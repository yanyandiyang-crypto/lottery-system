const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Triggering Render Deployment');
console.log('===============================');

async function triggerRenderDeployment() {
    try {
        console.log('📝 Creating deployment trigger file...');
        
        // Create a deployment trigger file with timestamp
        const deploymentTrigger = {
            timestamp: new Date().toISOString(),
            version: '3.0.1',
            trigger: 'manual',
            changes: [
                'Fixed health endpoint path',
                'Updated DATABASE_URL to new database',
                'Added missing environment variables',
                'Fixed CORS and authentication setup'
            ],
            database: {
                url: 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0',
                status: 'restored'
            }
        };
        
        fs.writeFileSync('deployment-trigger.json', JSON.stringify(deploymentTrigger, null, 2));
        console.log('✅ Deployment trigger file created');
        
        // Update package.json version to force deployment
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.1';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.1');
        
        // Update frontend version too
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.1';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.1');
        
        // Update vercel.json
        const vercelJson = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
        vercelJson.env.REACT_APP_VERSION = '3.0.1';
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ Vercel version updated to 3.0.1');
        
        console.log('\n🔄 Committing and pushing changes...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Trigger deployment v3.0.1 - fix environment variables and health endpoint"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Changes pushed to GitHub successfully!');
        
        console.log('\n📋 Manual Deployment Steps:');
        console.log('============================');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. 🚀 Click "Manual Deploy" button');
        console.log('4. ⏳ Wait for deployment to complete (2-5 minutes)');
        console.log('5. ✅ Check health endpoint: https://lottery-system-tna9.onrender.com/v1/health');
        
        console.log('\n🔍 How to Check if Auto-Deploy is Enabled:');
        console.log('==========================================');
        console.log('1. Go to Render Dashboard');
        console.log('2. Click on "lottery-backend" service');
        console.log('3. Go to "Settings" tab');
        console.log('4. Check "Auto-Deploy" section');
        console.log('5. Make sure it\'s set to "Yes" and pointing to "main" branch');
        
        console.log('\n⚠️ Common Reasons Auto-Deploy Doesn\'t Work:');
        console.log('============================================');
        console.log('- Auto-deploy is disabled in settings');
        console.log('- Wrong branch configured (should be "main" or "master")');
        console.log('- Service is paused or has errors');
        console.log('- GitHub webhook is not properly configured');
        
        console.log('\n🧪 Test URLs After Deployment:');
        console.log('===============================');
        console.log('- Health Check: https://lottery-system-tna9.onrender.com/v1/health');
        console.log('- Ping: https://lottery-system-tna9.onrender.com/v1/ping');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        
    } catch (error) {
        console.error('❌ Error triggering deployment:', error.message);
    }
}

triggerRenderDeployment();
