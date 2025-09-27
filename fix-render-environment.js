const fs = require('fs');

console.log('🔧 Fixing Render Environment Variables');
console.log('====================================');

// New database URL
const NEW_DB_URL = 'postgresql://lottery_db_k3w0_user:FvVBvl5N1R3Cz4LYnk0EwDg0oZXJDNk7@dpg-d3c016j7mgec73a3pdf0-a.oregon-postgres.render.com/lottery_db_k3w0';

// Updated render.yaml configuration
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
        value: ${NEW_DB_URL}
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

// Write the updated render.yaml
fs.writeFileSync('render.yaml', updatedRenderYaml);
console.log('✅ Updated render.yaml with correct environment variables');

// Create a .env.example file for reference
const envExample = `# Environment Variables for Lottery System
NODE_ENV=production
DATABASE_URL=${NEW_DB_URL}
CORS_ORIGIN=https://lottery-system-gamma.vercel.app,http://localhost:3000,http://localhost:3002
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BCRYPT_ROUNDS=10

# Optional: Redis for caching (if needed)
# REDIS_URL=redis://localhost:6379

# Optional: Sentry for error tracking
# SENTRY_DSN=your-sentry-dsn-here
`;

fs.writeFileSync('.env.example', envExample);
console.log('✅ Created .env.example for reference');

console.log('\n📋 Key Changes Made:');
console.log('====================');
console.log('✅ DATABASE_URL: Updated to new database');
console.log('✅ healthCheckPath: Changed to /v1/health');
console.log('✅ PORT: Added PORT environment variable');
console.log('✅ JWT_SECRET: Added JWT secret for authentication');
console.log('✅ BCRYPT_ROUNDS: Added bcrypt rounds for password hashing');

console.log('\n🔄 Next Steps:');
console.log('==============');
console.log('1. Commit and push these changes');
console.log('2. Render will auto-deploy with new environment variables');
console.log('3. Health checks should work at /v1/health');
console.log('4. Database connection should work properly');

console.log('\n⚠️ Important Notes:');
console.log('===================');
console.log('- Make sure to update JWT_SECRET in production');
console.log('- The health check path now matches what Render expects');
console.log('- All required environment variables are now configured');
