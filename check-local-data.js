#!/usr/bin/env node

/**
 * Check Local Database Data
 * Investigates what data exists in local database
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking Local Database Data');
console.log('===============================\n');

// Local database connection
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Local database
    }
  }
});

async function checkLocalData() {
  try {
    await localDb.$connect();
    console.log('✅ Connected to local database');
    
    console.log('\n📊 Local Database Data Summary:');
    console.log('===============================');
    
    // Check all major tables
    const tables = [
      'user', 'region', 'ticket', 'draw', 'bet', 'sale', 
      'winningTicket', 'ticketTemplate', 'betLimit', 'prizeConfiguration',
      'systemFunction', 'auditLog', 'balanceTransaction', 'commission'
    ];
    
    for (const table of tables) {
      try {
        const count = await localDb[table].count();
        console.log(`${table.padEnd(20)}: ${count} records`);
      } catch (error) {
        console.log(`${table.padEnd(20)}: ERROR - ${error.message}`);
      }
    }
    
    // Check specific user data
    console.log('\n👥 User Details:');
    const users = await localDb.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    if (users.length > 0) {
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role}) - ${user.status}`);
      });
    } else {
      console.log('❌ No users found in local database!');
    }
    
    // Check ticket data
    console.log('\n🎫 Ticket Details:');
    const tickets = await localDb.ticket.findMany({
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        totalAmount: true,
        createdAt: true
      }
    });
    
    if (tickets.length > 0) {
      console.log(`Found ${tickets.length} sample tickets:`);
      tickets.forEach(ticket => {
        console.log(`  - ${ticket.ticketNumber} - ₱${ticket.totalAmount}`);
      });
    } else {
      console.log('❌ No tickets found in local database!');
    }
    
    // Check draw data
    console.log('\n🎲 Draw Details:');
    const draws = await localDb.draw.findMany({
      take: 5,
      select: {
        id: true,
        drawDate: true,
        drawTime: true,
        winningNumber: true,
        status: true
      }
    });
    
    if (draws.length > 0) {
      console.log(`Found ${draws.length} sample draws:`);
      draws.forEach(draw => {
        console.log(`  - ${draw.drawDate} ${draw.drawTime} - ${draw.winningNumber || 'Pending'}`);
      });
    } else {
      console.log('❌ No draws found in local database!');
    }
    
  } catch (error) {
    console.error('❌ Error checking local data:', error.message);
  } finally {
    await localDb.$disconnect();
  }
}

checkLocalData().catch(console.error);
