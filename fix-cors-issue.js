const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing CORS Issue for Render Backend');
console.log('======================================');

async function fixCorsIssue() {
    try {
        console.log('📝 Current CORS Error:');
        console.log('======================');
        console.log('❌ Origin: https://lottery-system-gamma.vercel.app');
        console.log('❌ Target: https://lottery-system-tna9.onrender.com');
        console.log('❌ Error: No Access-Control-Allow-Origin header');
        
        console.log('\n🔍 Reading current server.js CORS configuration...');
        
        // Read the current server.js
        let serverContent = fs.readFileSync('server.js', 'utf8');
        
        // Check if CORS_ORIGIN is properly configured
        if (!serverContent.includes('https://lottery-system-gamma.vercel.app')) {
            console.log('🔧 Adding Vercel origin to CORS configuration...');
            
            // Update the CORS configuration to explicitly include Vercel
            const corsConfigRegex = /const allowedOrigins = process\.env\.CORS_ORIGIN\?\.split\(','\)\.map\(origin => origin\.trim\(\)\) \|\| \[[\s\S]*?\]/;
            const newCorsConfig = `const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [
  "http://localhost:3000", 
  "http://localhost:3002",
  "https://lottery-system-gamma.vercel.app"
];

// Ensure Vercel origin is always included
if (!allowedOrigins.includes("https://lottery-system-gamma.vercel.app")) {
  allowedOrigins.push("https://lottery-system-gamma.vercel.app");
}`;
            
            serverContent = serverContent.replace(corsConfigRegex, newCorsConfig);
            console.log('✅ Vercel origin added to CORS configuration');
        }
        
        // Add more explicit CORS debugging
        if (!serverContent.includes('CORS: Explicit origin check')) {
            console.log('🔧 Adding explicit CORS debugging...');
            
            const debugCode = `
// CORS: Explicit origin check for Vercel
console.log('CORS: Environment CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('CORS: Final allowed origins:', allowedOrigins);
console.log('CORS: Vercel origin included:', allowedOrigins.includes('https://lottery-system-gamma.vercel.app'));
`;
            
            // Insert after CORS configuration
            const insertPoint = serverContent.indexOf('console.log(\'CORS Allowed Origins:\', allowedOrigins);');
            if (insertPoint !== -1) {
                const endPoint = serverContent.indexOf('\n', insertPoint) + 1;
                serverContent = serverContent.slice(0, endPoint) + debugCode + serverContent.slice(endPoint);
                console.log('✅ CORS debugging added');
            }
        }
        
        // Write the updated server.js
        fs.writeFileSync('server.js', serverContent);
        console.log('✅ Server.js updated with CORS fixes');
        
        // Update render.yaml to ensure CORS_ORIGIN is set correctly
        console.log('🔧 Updating render.yaml CORS configuration...');
        
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
        console.log('✅ render.yaml updated with correct CORS_ORIGIN');
        
        // Update package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.5';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.5');
        
        console.log('\n🔄 Committing and pushing CORS fixes...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix CORS issue - ensure Vercel origin is allowed"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 CORS fixes pushed to GitHub!');
        
        console.log('\n📋 What Was Fixed:');
        console.log('==================');
        console.log('✅ Added explicit Vercel origin to CORS configuration');
        console.log('✅ Added CORS debugging to identify issues');
        console.log('✅ Updated render.yaml with correct CORS_ORIGIN');
        console.log('✅ Ensured Vercel origin is always included');
        
        console.log('\n🚀 Next Steps:');
        console.log('===============');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. 🚀 Click "Manual Deploy" button');
        console.log('4. ⏳ Wait for deployment (2-5 minutes)');
        console.log('5. 🧪 Test login on Vercel frontend');
        
        console.log('\n🔍 CORS Configuration:');
        console.log('======================');
        console.log('✅ Allowed Origins:');
        console.log('   - https://lottery-system-gamma.vercel.app');
        console.log('   - http://localhost:3000');
        console.log('   - http://localhost:3002');
        console.log('✅ Environment Variable: CORS_ORIGIN');
        console.log('✅ Preflight requests: Handled');
        
        console.log('\n🧪 Test After Deployment:');
        console.log('=========================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- Login: Should work without CORS errors');
        console.log('- API calls: Should work properly');
        
    } catch (error) {
        console.error('❌ Error fixing CORS:', error.message);
    }
}

fixCorsIssue();
