const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing CORS Issue on Render');
console.log('==============================');

async function fixCorsRenderDeployment() {
    try {
        console.log('📝 Current CORS Error Analysis:');
        console.log('================================');
        console.log('❌ Error: No \'Access-Control-Allow-Origin\' header');
        console.log('❌ Frontend: https://lottery-system-gamma.vercel.app');
        console.log('❌ Backend: https://lottery-system-tna9.onrender.com');
        console.log('❌ Issue: Render backend CORS not allowing Vercel origin');
        
        console.log('\n🔧 Checking current render.yaml CORS configuration...');
        
        // Read current render.yaml
        const renderYaml = fs.readFileSync('render.yaml', 'utf8');
        console.log('✅ render.yaml CORS_ORIGIN:', renderYaml.match(/CORS_ORIGIN[\s\S]*?value: (.*)/)?.[1]);
        
        console.log('\n📝 Updating render.yaml with explicit CORS configuration...');
        
        // Create updated render.yaml with more explicit CORS settings
        const updatedRenderYaml = `services:
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
  - name: lottery-db
    plan: free
`;
        
        fs.writeFileSync('render.yaml', updatedRenderYaml);
        console.log('✅ render.yaml updated with CORS configuration');
        
        // Update package.json version to force deployment
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.5';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.5');
        
        // Update frontend version
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.5';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.5');
        
        // Update vercel.json
        const vercelJson = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
        vercelJson.env.REACT_APP_VERSION = '3.0.5';
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ Vercel version updated to 3.0.5');
        
        console.log('\n🔄 Committing and pushing CORS fixes...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix CORS configuration for Render backend - allow Vercel origin"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 CORS fixes pushed to GitHub!');
        
        console.log('\n📋 Manual Steps Required:');
        console.log('=========================');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. ⚙️ Go to "Environment" tab');
        console.log('4. 🔧 Verify CORS_ORIGIN is set to:');
        console.log('   https://lottery-system-gamma.vercel.app,http://localhost:3000,http://localhost:3002');
        console.log('5. 🚀 Click "Manual Deploy" button');
        console.log('6. ⏳ Wait for deployment (2-5 minutes)');
        
        console.log('\n🔍 CORS Configuration Check:');
        console.log('============================');
        console.log('✅ CORS_ORIGIN should include:');
        console.log('   - https://lottery-system-gamma.vercel.app');
        console.log('   - http://localhost:3000');
        console.log('   - http://localhost:3002');
        
        console.log('\n🧪 Test After Deployment:');
        console.log('==========================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- Try login again');
        console.log('- Check browser console for CORS errors');
        
        console.log('\n⚠️ Why CORS Error Occurred:');
        console.log('===========================');
        console.log('- Render backend was not configured to allow Vercel origin');
        console.log('- CORS_ORIGIN environment variable was missing or incorrect');
        console.log('- Backend needs redeployment with correct CORS settings');
        
    } catch (error) {
        console.error('❌ Error fixing CORS:', error.message);
    }
}

fixCorsRenderDeployment();
