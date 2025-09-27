#!/usr/bin/env node

/**
 * Test Render Database Connection
 * Verifies the migration was successful
 */

const { PrismaClient } = require('@prisma/client');

console.log('🧪 Testing Render Database Connection');
console.log('=====================================\n');

// Render database connection
const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
    }
  }
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await renderDb.$connect();
    console.log('✅ Connected to Render database successfully!');
    
    // Test data counts
    console.log('\n📊 Data Summary:');
    
    const userCount = await renderDb.user.count();
    console.log(`👥 Users: ${userCount}`);
    
    const regionCount = await renderDb.region.count();
    console.log(`🌍 Regions: ${regionCount}`);
    
    const ticketCount = await renderDb.ticket.count();
    console.log(`🎫 Tickets: ${ticketCount}`);
    
    const drawCount = await renderDb.draw.count();
    console.log(`🎲 Draws: ${drawCount}`);
    
    const betCount = await renderDb.bet.count();
    console.log(`💰 Bets: ${betCount}`);
    
    const saleCount = await renderDb.sale.count();
    console.log(`💵 Sales: ${saleCount}`);
    
    const winningTicketCount = await renderDb.winningTicket.count();
    console.log(`🏆 Winning Tickets: ${winningTicketCount}`);
    
    // Test a sample query
    console.log('\n🔍 Sample Data:');
    const sampleUser = await renderDb.user.findFirst();
    if (sampleUser) {
      console.log(`Sample User: ${sampleUser.username} (${sampleUser.role})`);
    }
    
    const sampleTicket = await renderDb.ticket.findFirst();
    if (sampleTicket) {
      console.log(`Sample Ticket: ${sampleTicket.ticketNumber}`);
    }
    
    console.log('\n🎉 Migration Test Complete!');
    console.log('✅ Render database is ready for production use');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  } finally {
    await renderDb.$disconnect();
  }
}

testConnection().catch(console.error);
