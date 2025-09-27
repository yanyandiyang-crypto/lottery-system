const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Vercel Environment Variables');
console.log('=====================================');

async function fixVercelEnvironmentVariables() {
    try {
        console.log('📝 Current Vercel Environment Variables:');
        console.log('=========================================');
        console.log('❌ REACT_APP_API_URL: https://lottery-backend-l1k7.onrender.com');
        console.log('❌ REACT_APP_VERSION: 1.0.0');
        console.log('✅ REACT_APP_API_VERSION: v1');
        console.log('✅ GENERATE_SOURCEMAP: false');
        
        console.log('\n🔧 Correct Environment Variables Should Be:');
        console.log('===========================================');
        console.log('✅ REACT_APP_API_URL: https://lottery-system-tna9.onrender.com');
        console.log('✅ REACT_APP_SOCKET_URL: https://lottery-system-tna9.onrender.com');
        console.log('✅ REACT_APP_VERSION: 3.0.3');
        console.log('✅ REACT_APP_API_VERSION: v1');
        console.log('✅ GENERATE_SOURCEMAP: false');
        
        console.log('\n📝 Updating vercel.json with correct values...');
        
        // Update vercel.json with correct environment variables
        const vercelJson = {
            "version": 2,
            "builds": [
                {
                    "src": "package.json",
                    "use": "@vercel/static-build",
                    "config": {
                        "distDir": "build"
                    }
                }
            ],
            "routes": [
                {
                    "src": "/static/(.*)",
                    "dest": "/static/$1"
                },
                {
                    "src": "/favicon.ico",
                    "dest": "/favicon.ico"
                },
                {
                    "src": "/asset-manifest.json",
                    "dest": "/asset-manifest.json"
                },
                {
                    "src": "/manifest.json",
                    "dest": "/manifest.json"
                },
                {
                    "src": "/(.*)",
                    "dest": "/index.html"
                }
            ],
            "env": {
                "REACT_APP_API_URL": "https://lottery-system-tna9.onrender.com",
                "REACT_APP_SOCKET_URL": "https://lottery-system-tna9.onrender.com",
                "REACT_APP_API_VERSION": "v1",
                "REACT_APP_VERSION": "3.0.4",
                "GENERATE_SOURCEMAP": "false"
            },
            "buildCommand": "npm install --legacy-peer-deps && npm run build",
            "outputDirectory": "build",
            "installCommand": "npm install --legacy-peer-deps",
            "framework": "create-react-app"
        };
        
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ vercel.json updated with correct environment variables');
        
        // Update frontend package.json version
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.4';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.4');
        
        console.log('\n🔄 Committing and pushing environment variable fixes...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix Vercel environment variables - correct API URL and version"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Environment variable fixes pushed to GitHub!');
        
        console.log('\n📋 Manual Steps Required:');
        console.log('=========================');
        console.log('1. 🌐 Go to Vercel Dashboard: https://vercel.com/dashboard');
        console.log('2. 🔍 Find "lottery-system-gamma" project');
        console.log('3. ⚙️ Go to "Settings" → "Environment Variables"');
        console.log('4. 🔧 Update these variables:');
        console.log('   - REACT_APP_API_URL: https://lottery-system-tna9.onrender.com');
        console.log('   - REACT_APP_SOCKET_URL: https://lottery-system-tna9.onrender.com');
        console.log('   - REACT_APP_VERSION: 3.0.4');
        console.log('5. 🚀 Redeploy the project');
        
        console.log('\n⚠️ Why Manual Update is Needed:');
        console.log('===============================');
        console.log('- Vercel environment variables are set in the dashboard');
        console.log('- They override the vercel.json file');
        console.log('- Manual update ensures the correct values are used');
        
        console.log('\n🔍 Current vs Correct URLs:');
        console.log('============================');
        console.log('❌ Current: https://lottery-backend-l1k7.onrender.com');
        console.log('✅ Correct: https://lottery-system-tna9.onrender.com');
        console.log('   ↑ This is your actual Render backend URL');
        
        console.log('\n🧪 Test After Fix:');
        console.log('==================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- API calls should work');
        console.log('- WebSocket should connect');
        console.log('- Login should work');
        
    } catch (error) {
        console.error('❌ Error fixing environment variables:', error.message);
    }
}

fixVercelEnvironmentVariables();
