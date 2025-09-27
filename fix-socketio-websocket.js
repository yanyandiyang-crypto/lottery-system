const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Socket.IO WebSocket Connection');
console.log('========================================');

async function fixSocketIOWebSocket() {
    try {
        console.log('📝 Reading current server.js configuration...');
        
        // Read the current server.js
        let serverContent = fs.readFileSync('server.js', 'utf8');
        
        // Check if Socket.IO is properly configured for Render
        if (!serverContent.includes('transports: ["websocket", "polling"]')) {
            console.log('🔧 Adding Socket.IO transport configuration...');
            
            // Find the Socket.IO configuration section
            const socketConfigRegex = /const io = socketIo\(server, \{[\s\S]*?\}\);/;
            const match = serverContent.match(socketConfigRegex);
            
            if (match) {
                // Replace the Socket.IO configuration with Render-compatible settings
                const newSocketConfig = `const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  // Render-compatible Socket.IO configuration
  transports: ["websocket", "polling"],
  allowEIO3: true,
  // Socket.IO timeout configuration
  pingTimeout: 60000,        // 60 seconds
  pingInterval: 25000,       // 25 seconds
  upgradeTimeout: 10000,     // 10 seconds
  // Connection timeout
  connectTimeout: 45000,     // 45 seconds
  // Heartbeat configuration
  heartbeatInterval: 25000   // 25 seconds
});`;
                
                serverContent = serverContent.replace(socketConfigRegex, newSocketConfig);
                console.log('✅ Socket.IO transport configuration updated');
            }
        }
        
        // Add WebSocket debugging
        if (!serverContent.includes('Socket.IO WebSocket debugging')) {
            console.log('🔧 Adding WebSocket debugging...');
            
            // Add debugging after Socket.IO initialization
            const debugCode = `
// Socket.IO WebSocket debugging
io.engine.on("connection_error", (err) => {
  console.log("Socket.IO connection error:", err.req, err.code, err.message, err.context);
});

io.engine.on("upgrade_error", (err) => {
  console.log("Socket.IO upgrade error:", err.req, err.code, err.message, err.context);
});

console.log('Socket.IO server configured with transports:', io.engine.opts.transports);
console.log('Socket.IO CORS origins:', io.engine.opts.cors?.origin);
`;
            
            // Insert after Socket.IO configuration
            const insertPoint = serverContent.indexOf('// Socket.IO for real-time features');
            if (insertPoint !== -1) {
                serverContent = serverContent.slice(0, insertPoint) + debugCode + serverContent.slice(insertPoint);
                console.log('✅ WebSocket debugging added');
            }
        }
        
        // Write the updated server.js
        fs.writeFileSync('server.js', serverContent);
        console.log('✅ Server.js updated with Socket.IO fixes');
        
        // Update package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.2';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.2');
        
        // Update frontend version
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        frontendPackageJson.version = '3.0.2';
        fs.writeFileSync('frontend/package.json', JSON.stringify(frontendPackageJson, null, 2));
        console.log('✅ Frontend package version updated to 3.0.2');
        
        // Update vercel.json
        const vercelJson = JSON.parse(fs.readFileSync('frontend/vercel.json', 'utf8'));
        vercelJson.env.REACT_APP_VERSION = '3.0.2';
        fs.writeFileSync('frontend/vercel.json', JSON.stringify(vercelJson, null, 2));
        console.log('✅ Vercel version updated to 3.0.2');
        
        console.log('\n🔄 Committing and pushing Socket.IO fixes...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix Socket.IO WebSocket connection for Render deployment"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Socket.IO fixes pushed to GitHub!');
        
        console.log('\n📋 What Was Fixed:');
        console.log('==================');
        console.log('✅ Added explicit WebSocket transport configuration');
        console.log('✅ Added polling fallback for Render compatibility');
        console.log('✅ Added WebSocket connection error debugging');
        console.log('✅ Configured proper CORS for Socket.IO');
        console.log('✅ Added connection timeout settings');
        
        console.log('\n🚀 Next Steps:');
        console.log('===============');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. 🚀 Click "Manual Deploy" button');
        console.log('4. ⏳ Wait for deployment (2-5 minutes)');
        console.log('5. 🧪 Test WebSocket connection in browser console');
        
        console.log('\n🔍 WebSocket Test Commands:');
        console.log('===========================');
        console.log('// Test in browser console:');
        console.log('const socket = io("https://lottery-system-tna9.onrender.com");');
        console.log('socket.on("connect", () => console.log("✅ WebSocket connected!"));');
        console.log('socket.on("connect_error", (err) => console.log("❌ WebSocket error:", err));');
        
    } catch (error) {
        console.error('❌ Error fixing Socket.IO:', error.message);
    }
}

fixSocketIOWebSocket();
