const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Backend URL Mismatch');
console.log('==============================');

async function fixBackendUrlMismatch() {
    try {
        console.log('📝 Current Issue:');
        console.log('=================');
        console.log('❌ Backend URL: https://lottery-backend-l1k7.onrender.com');
        console.log('❌ Frontend trying: https://lottery-system-tna9.onrender.com');
        console.log('❌ URL Mismatch: Frontend and backend URLs don\'t match');
        
        console.log('\n🔍 Actual Backend URL from logs:');
        console.log('=================================');
        console.log('✅ Real Backend: https://lottery-backend-l1k7.onrender.com');
        console.log('✅ Health checks: Working (200 responses)');
        console.log('✅ CORS: Allowing requests with no origin');
        
        console.log('\n🔧 Updating frontend to use correct backend URL...');
        
        // Update vercel.json with the correct backend URL
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
                "REACT_APP_API_URL": "https://lottery-backend-l1k7.onrender.com",
                "REACT_APP_SOCKET_URL": "https://lottery-backend-l1k7.onrender.com",
                "REACT_APP_API_VERSION": "v1",
                "REACT_APP_VERSION": "3.0.7",
                "GENERATE_SOURCEMAP": "false"
            },
            "buildCommand": "npm install --legacy-peer-deps && npm run build",
            "outputDirectory": "build",
            "installCommand": "npm install --legacy-peer-deps",
            "framework": "create-react-app"
        };
        
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ vercel.json updated with correct backend URL');
        
        // Update frontend package.json version
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.7';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.7');
        
        // Update render.yaml to match the actual service name
        const renderYaml = `services:
  - type: web
    name: lottery-backend
    runtime: node
    plan: free
    buildCommand: npm install && npx prisma generate
    startCommand: node start-server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0
      - key: CORS_ORIGIN
        value: https://lottery-system-gamma.vercel.app,http://localhost:3000,http://localhost:3002
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        value: your-super-secret-jwt-key-change-this-in-production
      - key: BCRYPT_ROUNDS
        value: 10
    healthCheckPath: /v1/health

databases:
  - name: lottery-db-k3w0
    plan: free`;
        
        fs.writeFileSync('render.yaml', renderYaml);
        console.log('✅ render.yaml updated');
        
        // Update package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.7';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.7');
        
        console.log('\n🔄 Committing and pushing URL fix...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix backend URL mismatch - use correct lottery-backend-l1k7 URL"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Backend URL fix pushed to GitHub!');
        
        console.log('\n📋 What Was Fixed:');
        console.log('==================');
        console.log('✅ Updated frontend to use correct backend URL');
        console.log('✅ Changed from lottery-system-tna9 to lottery-backend-l1k7');
        console.log('✅ Updated both API and Socket URLs');
        console.log('✅ Version bumped to 3.0.7');
        
        console.log('\n🚀 Next Steps:');
        console.log('===============');
        console.log('1. 🌐 Go to Vercel Dashboard: https://vercel.com/dashboard');
        console.log('2. 🔍 Find "lottery-system-gamma" project');
        console.log('3. ⚙️ Go to Settings → Environment Variables');
        console.log('4. 🔧 Update these variables:');
        console.log('   - REACT_APP_API_URL: https://lottery-backend-l1k7.onrender.com');
        console.log('   - REACT_APP_SOCKET_URL: https://lottery-backend-l1k7.onrender.com');
        console.log('   - REACT_APP_VERSION: 3.0.7');
        console.log('5. 🚀 Redeploy the project');
        
        console.log('\n🔍 Correct URLs:');
        console.log('================');
        console.log('✅ Backend: https://lottery-backend-l1k7.onrender.com');
        console.log('✅ Frontend: https://lottery-system-gamma.vercel.app');
        console.log('✅ Health Check: https://lottery-backend-l1k7.onrender.com/v1/health');
        
        console.log('\n🧪 Test After Vercel Update:');
        console.log('============================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- Login: Should work without CORS errors');
        console.log('- API calls: Should connect to correct backend');
        
        console.log('\n⚠️ Why This Fixes It:');
        console.log('=====================');
        console.log('- The backend is actually running on lottery-backend-l1k7');
        console.log('- The frontend was trying to connect to lottery-system-tna9');
        console.log('- URL mismatch caused connection failures');
        console.log('- Now both will use the same correct URL');
        
    } catch (error) {
        console.error('❌ Error fixing backend URL mismatch:', error.message);
    }
}

fixBackendUrlMismatch();
