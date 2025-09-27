const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Triggering Vercel Deployment');
console.log('==============================');

async function triggerVercelDeployment() {
    try {
        console.log('📝 Creating Vercel deployment trigger...');
        
        // Create a deployment trigger file
        const deploymentTrigger = {
            timestamp: new Date().toISOString(),
            version: '3.0.2',
            trigger: 'manual',
            changes: [
                'Fixed Socket.IO WebSocket connection',
                'Added WebSocket transport configuration',
                'Added polling fallback for Render compatibility',
                'Added WebSocket error debugging',
                'Updated to version 3.0.2'
            ],
            frontend: {
                apiUrl: 'https://lottery-system-tna9.onrender.com',
                socketUrl: 'https://lottery-system-tna9.onrender.com',
                version: '3.0.2'
            }
        };
        
        fs.writeFileSync('vercel-deployment-trigger.json', JSON.stringify(deploymentTrigger, null, 2));
        console.log('✅ Vercel deployment trigger created');
        
        // Update frontend package.json version to force deployment
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.3';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.3');
        
        // Update vercel.json
        const vercelJson = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
        vercelJson.env.REACT_APP_VERSION = '3.0.3';
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ Vercel version updated to 3.0.3');
        
        console.log('\n🔄 Committing and pushing Vercel deployment...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Trigger Vercel deployment v3.0.3 - Socket.IO WebSocket fix"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Vercel deployment triggered successfully!');
        
        console.log('\n📋 Deployment Status:');
        console.log('====================');
        console.log('✅ GitHub: Updated with Socket.IO fixes');
        console.log('✅ Vercel: Auto-deploy triggered');
        console.log('✅ Version: 3.0.3');
        
        console.log('\n🔍 Check Deployment Status:');
        console.log('===========================');
        console.log('1. 🌐 Vercel Dashboard: https://vercel.com/dashboard');
        console.log('2. 🔍 Find "lottery-system-gamma" project');
        console.log('3. 📊 Check deployment logs');
        console.log('4. ⏳ Wait for build to complete (2-3 minutes)');
        
        console.log('\n🧪 Test After Deployment:');
        console.log('=========================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- WebSocket: Check browser console for connection');
        console.log('- Login: Test with your credentials');
        
        console.log('\n💡 Vercel Auto-Deploy Info:');
        console.log('============================');
        console.log('- Vercel automatically deploys on git push to master');
        console.log('- Build time: ~2-3 minutes');
        console.log('- No manual action needed if auto-deploy is enabled');
        
    } catch (error) {
        console.error('❌ Error triggering Vercel deployment:', error.message);
    }
}

triggerVercelDeployment();
