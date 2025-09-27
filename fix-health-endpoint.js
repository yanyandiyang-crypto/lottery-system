const fs = require('fs');

console.log('🔧 Fixing Health Endpoint');
console.log('=========================');

// Read the server.js file
let serverContent = fs.readFileSync('server.js', 'utf8');

// Add a direct health route before the existing health route
const healthFix = `
// Direct health endpoint for Render
app.get('/v1/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  try {
    // Database health check
    const start = Date.now();
    await prisma.$queryRaw\`SELECT 1\`;
    const dbResponseTime = Date.now() - start;
    
    health.services.database = { 
      status: 'healthy', 
      responseTime: \`\${dbResponseTime}ms\` 
    };
  } catch (error) {
    health.services.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Simple ping endpoint for Render
app.get('/v1/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

`;

// Find the line where routes are mounted and add the health fix before it
const routeMountIndex = serverContent.indexOf('// Mount routes');
if (routeMountIndex !== -1) {
  serverContent = serverContent.slice(0, routeMountIndex) + healthFix + serverContent.slice(routeMountIndex);
  
  // Write the updated server.js
  fs.writeFileSync('server.js', serverContent);
  console.log('✅ Added direct health endpoints for Render');
} else {
  console.log('❌ Could not find route mounting section');
}

console.log('\n📋 Health endpoints added:');
console.log('- GET /v1/health - Full health check');
console.log('- GET /v1/ping - Simple ping');
console.log('- GET /api/v1/health - Existing API health check');

console.log('\n🔄 Next steps:');
console.log('1. Commit and push changes to GitHub');
console.log('2. Render will auto-deploy');
console.log('3. Health checks should work');
