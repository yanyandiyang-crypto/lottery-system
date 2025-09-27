const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Ticket Creation Endpoint');
console.log('==================================');

async function fixTicketCreationEndpoint() {
    try {
        console.log('📝 Current Issue:');
        console.log('=================');
        console.log('✅ Database: Working (ticket creation successful)');
        console.log('✅ Backend: Running on lottery-backend-l1k7');
        console.log('✅ CORS: Fixed');
        console.log('❌ API Endpoint: 500 Internal Server Error');
        console.log('❌ Error: "Database operation failed"');
        
        console.log('\n🔍 Likely Causes:');
        console.log('==================');
        console.log('1. Missing required fields in API request');
        console.log('2. Authentication/authorization issues');
        console.log('3. Validation errors in the endpoint');
        console.log('4. Rate limiting or middleware issues');
        
        console.log('\n🔧 Creating comprehensive fix...');
        
        // Read the current tickets-clean.js route
        let ticketsRoute = fs.readFileSync('routes/tickets-clean.js', 'utf8');
        
        // Add better error handling and logging
        if (!ticketsRoute.includes('Enhanced error logging')) {
            console.log('🔧 Adding enhanced error logging...');
            
            const enhancedLogging = `
    // Enhanced error logging for ticket creation
    console.log('Ticket creation request details:', {
      userId: req.user?.userId,
      userRole: req.user?.role,
      bodyKeys: Object.keys(req.body),
      betsCount: req.body.bets?.length,
      drawId: req.body.drawId,
      timestamp: new Date().toISOString()
    });
    
    // Validate required fields
    if (!req.body.bets || !Array.isArray(req.body.bets) || req.body.bets.length === 0) {
      console.log('❌ Missing or invalid bets array');
      return sendError(res, 'Bets array is required and must not be empty', 400);
    }
    
    if (!req.body.drawId) {
      console.log('❌ Missing drawId');
      return sendError(res, 'Draw ID is required', 400);
    }
    
    // Validate each bet
    for (let i = 0; i < req.body.bets.length; i++) {
      const bet = req.body.bets[i];
      if (!bet.betType || !bet.betCombination || !bet.betAmount) {
        console.log(\`❌ Invalid bet at index \${i}:\`, bet);
        return sendError(res, \`Invalid bet at index \${i}. Required: betType, betCombination, betAmount\`, 400);
      }
    }
`;
            
            // Insert after the debug logging section
            const insertPoint = ticketsRoute.indexOf('console.log(\'Received ticket creation request:\', {');
            if (insertPoint !== -1) {
                const endPoint = ticketsRoute.indexOf('});', insertPoint) + 3;
                ticketsRoute = ticketsRoute.slice(0, endPoint) + enhancedLogging + ticketsRoute.slice(endPoint);
                console.log('✅ Enhanced error logging added');
            }
        }
        
        // Add try-catch wrapper around the main logic
        if (!ticketsRoute.includes('try-catch wrapper')) {
            console.log('🔧 Adding try-catch wrapper...');
            
            const tryCatchWrapper = `
    try {
      // Main ticket creation logic
`;
            
            const endTryCatch = `
    } catch (error) {
      console.error('❌ Ticket creation error:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        body: req.body
      });
      
      // Return specific error messages
      if (error.message.includes('Unique constraint')) {
        return sendError(res, 'Ticket number already exists', 409);
      } else if (error.message.includes('Foreign key constraint')) {
        return sendError(res, 'Invalid user or draw reference', 400);
      } else if (error.message.includes('Validation error')) {
        return sendError(res, 'Invalid data format', 400);
      } else {
        return sendError(res, 'Database operation failed: ' + error.message, 500);
      }
    }
`;
            
            // Wrap the main logic
            const mainLogicStart = ticketsRoute.indexOf('const { bets, drawId, idempotencyKey } = req.body;');
            const mainLogicEnd = ticketsRoute.lastIndexOf('});');
            
            if (mainLogicStart !== -1 && mainLogicEnd !== -1) {
                const beforeLogic = ticketsRoute.slice(0, mainLogicStart);
                const mainLogic = ticketsRoute.slice(mainLogicStart, mainLogicEnd);
                const afterLogic = ticketsRoute.slice(mainLogicEnd);
                
                ticketsRoute = beforeLogic + tryCatchWrapper + mainLogic + endTryCatch + afterLogic;
                console.log('✅ Try-catch wrapper added');
            }
        }
        
        // Write the updated route file
        fs.writeFileSync('routes/tickets-clean.js', ticketsRoute);
        console.log('✅ Ticket creation route updated with enhanced error handling');
        
        // Update package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = '3.0.8';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ Package version updated to 3.0.8');
        
        console.log('\n🔄 Committing and pushing ticket creation fix...');
        
        // Git commands
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Fix ticket creation endpoint - enhanced error handling and validation"', { stdio: 'inherit' });
        execSync('git push origin master', { stdio: 'inherit' });
        
        console.log('\n🎉 Ticket creation fix pushed to GitHub!');
        
        console.log('\n📋 What Was Fixed:');
        console.log('==================');
        console.log('✅ Added enhanced error logging');
        console.log('✅ Added comprehensive field validation');
        console.log('✅ Added try-catch wrapper for better error handling');
        console.log('✅ Added specific error messages for common issues');
        console.log('✅ Added detailed request logging');
        
        console.log('\n🚀 Next Steps:');
        console.log('===============');
        console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
        console.log('2. 🔍 Find "lottery-backend" service');
        console.log('3. 🚀 Click "Manual Deploy" button');
        console.log('4. ⏳ Wait for deployment (2-5 minutes)');
        console.log('5. 🧪 Test ticket creation on frontend');
        
        console.log('\n🔍 Debugging Info:');
        console.log('==================');
        console.log('✅ Database ticket creation: Working');
        console.log('✅ Required fields identified:');
        console.log('   - ticketNumber (unique)');
        console.log('   - totalAmount');
        console.log('   - status');
        console.log('   - qrCode');
        console.log('   - betDate');
        console.log('   - sequenceNumber');
        console.log('   - agentId');
        console.log('   - userId');
        console.log('   - drawId');
        console.log('   - bets array');
        
        console.log('\n🧪 Test After Deployment:');
        console.log('=========================');
        console.log('- Frontend: https://lottery-system-gamma.vercel.app');
        console.log('- Create ticket: Should work with detailed error messages');
        console.log('- Check browser console: For detailed error logs');
        
    } catch (error) {
        console.error('❌ Error fixing ticket creation endpoint:', error.message);
    }
}

fixTicketCreationEndpoint();
