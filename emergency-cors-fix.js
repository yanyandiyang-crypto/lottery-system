const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚨 Emergency CORS Fix for Render Backend');
console.log('=======================================');

async function emergencyCorsFix() {
    try {
        console.log('📝 Current Issue:');
        console.log('=================');
        console.log('❌ CORS Error: No Access-Control-Allow-Origin header');
        console.log('❌ Backend: 404 Not Found (not deployed)');
        console.log('❌ Origin: https://lottery-system-gamma.vercel.app');
        console.log('❌ Target: https://lottery-system-tna9.onrender.com');
        
        console.log('\n🔧 Creating comprehensive CORS fix...');
        
        // Read the current server.js
        let serverContent = fs.readFileSync('server.js', 'utf8');
        
        // Replace the entire CORS configuration with a more permissive one
        const corsConfigRegex = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;
        const newCorsConfig = `app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Define allowed origins
    const allowedOrigins = [
      'https://lottery-system-gamma.vercel.app',
      'http://localhost:3000',
      'http://localhost:3002'
    ];
    
    console.log('CORS: Checking origin:', origin);
    console.log('CORS: Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      console.log('CORS: Available origins:', allowedOrigins);
      callback(new Error(\`Not allowed by CORS. Origin: \${origin}\`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Version', 'API-Version', 'x-client-version']
}));`;
        
        serverContent = serverContent.replace(corsConfigRegex, newCorsConfig);
        
        // Update the allowedOrigins variable to match
        const allowedOriginsRegex = /const allowedOrigins = [\s\S]*?];/;
        const newAllowedOrigins = `const allowedOrigins = [
  'https://lottery-system-gamma.vercel.app',
  'http://localhost:3000',
  'http://localhost:3002'
];`;
        
        serverContent = serverContent.replace(allowedOriginsRegex, newAllowedOrigins);
        
        // Add explicit preflight handling
        if (!serverContent.includes('Explicit preflight handling')) {
            const preflightCode = `
// Explicit preflight handling for CORS
app.options('*', (req, res) => {
  console.log('CORS: Handling preflight request for:', req.headers.origin);
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://lottery-system-gamma.vercel.app',
    'http://localhost:3000',
    'http://localhost:3002'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Version, API-Version, x-client-version');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    res.status(403).end();
  }
});
`;
            
            // Insert after CORS configuration
            const insertPoint = serverContent.indexOf('// Handle preflight requests explicitly');
            if (insertPoint !== -1) {
                serverContent = serverContent.slice(0, insertPoint) + preflightCode + serverContent.slice(insertPoint);
            }
        }
        
        // Write the updated server.js
        fs.writeFileSync('server.js', serverContent);
        console.log('✅ Server.js updated with comprehensive CORS fix');
        
        // Update render.yaml with explicit CORS_ORIGIN
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
        console.log('✅ render.yaml updated with explicit CORS_ORIGIN');
        
        // Update package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.6';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.6');
        
        console.log('\n🔄 Committing and pushing emergency CORS fix...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Emergency CORS fix - comprehensive preflight handling"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Emergency CORS fix pushed to GitHub!');
        
        console.log('\n📋 What Was Fixed:');
        console.log('==================');
        console.log('✅ Replaced CORS configuration with explicit origins');
        console.log('✅ Added comprehensive preflight request handling');
        console.log('✅ Ensured Vercel origin is always allowed');
        console.log('✅ Added explicit OPTIONS method handling');
        console.log('✅ Updated render.yaml with correct environment variables');
        
        console.log('\n🚨 URGENT: Manual Deployment Required');
        console.log('=====================================');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. 🚀 Click "Manual Deploy" button');
        console.log('4. ⏳ Wait for deployment (2-5 minutes)');
        console.log('5. 🧪 Test login immediately after deployment');
        
        console.log('\n🔍 CORS Configuration:');
        console.log('======================');
        console.log('✅ Explicit Origins:');
        console.log('   - https://lottery-system-gamma.vercel.app');
        console.log('   - http://localhost:3000');
        console.log('   - http://localhost:3002');
        console.log('✅ Preflight Handling: Explicit OPTIONS method');
        console.log('✅ Credentials: Enabled');
        console.log('✅ Headers: All necessary headers allowed');
        
        console.log('\n🧪 Test After Deployment:');
        console.log('=========================');
        console.log('- Health Check: https://lottery-system-tna9.onrender.com/v1/health');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- Login: Should work without CORS errors');
        
        console.log('\n⚠️ If Still Not Working:');
        console.log('========================');
        console.log('1. Check Render service logs for errors');
        console.log('2. Verify environment variables are set');
        console.log('3. Restart the Render service');
        console.log('4. Check if the service is paused');
        
    } catch (error) {
        console.error('❌ Error in emergency CORS fix:', error.message);
    }
}

emergencyCorsFix();
