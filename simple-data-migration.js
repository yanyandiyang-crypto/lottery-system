#!/usr/bin/env node

/**
 * Simple Data Migration using Node.js
 * Works without PostgreSQL command line tools
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🚀 Simple Data Migration: Local → Render');
console.log('==========================================\n');

// Database connections
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Local database
    }
  }
});

const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
    }
  }
});

// Tables to migrate in correct order
const migrationOrder = [
  'Region',
  'User', 
  'SystemFunction',
  'TicketTemplate',
  'BetLimit',
  'PrizeConfiguration',
  'SystemSetting',
  'Draw',
  'DrawResult',
  'UserBalance',
  'Ticket',
  'Bet',
  'Sale',
  'Commission',
  'WinningTicket',
  'WinningPrize',
  'BalanceTransaction',
  'AgentTicketTemplate',
  'BetLimitsPerDraw',
  'CurrentBetTotal',
  'ClaimsAudit',
  'TicketReprint',
  'AuditLog',
  'LoginAudit',
  'SecurityAudit',
  'SystemLog',
  'Notification'
];

async function migrateTable(tableName) {
  try {
    console.log(`📤 Migrating ${tableName}...`);
    
    // Get all data from local database
    const data = await localDb[tableName].findMany({
      orderBy: { id: 'asc' }
    });
    
    if (data.length === 0) {
      console.log(`   ⏭️ No data in ${tableName}`);
      return;
    }
    
    console.log(`   📊 Found ${data.length} records`);
    
    // Clear existing data in Render database
    try {
      await renderDb[tableName].deleteMany({});
      console.log(`   🗑️ Cleared existing ${tableName} data`);
    } catch (error) {
      console.log(`   ⚠️ Could not clear ${tableName}: ${error.message}`);
    }
    
    // Import data one by one to avoid foreign key issues
    let importedCount = 0;
    
    for (const record of data) {
      try {
        // Remove any fields that might cause issues
        const cleanRecord = { ...record };
        delete cleanRecord.id; // Let database assign new IDs
        
        await renderDb[tableName].create({ data: cleanRecord });
        importedCount++;
        
        if (importedCount % 10 === 0) {
          console.log(`   ✅ Imported ${importedCount}/${data.length} records`);
        }
      } catch (recordError) {
        console.log(`   ⚠️ Failed to import record: ${recordError.message}`);
        // Continue with next record
      }
    }
    
    console.log(`   🎉 ${tableName} migration complete! (${importedCount}/${data.length})`);
    
  } catch (error) {
    console.log(`   ❌ Error migrating ${tableName}: ${error.message}`);
  }
}

async function migrateData() {
  try {
    console.log('🔍 Testing connections...');
    
    // Test local connection
    await localDb.$connect();
    const localUserCount = await localDb.user.count();
    console.log(`✅ Local database connected (${localUserCount} users)`);
    
    // Test Render connection
    await renderDb.$connect();
    const renderUserCount = await renderDb.user.count();
    console.log(`✅ Render database connected (${renderUserCount} users)`);
    
    console.log('\n📊 Starting data migration...');
    console.log('==============================');
    
    const startTime = Date.now();
    
    for (const tableName of migrationOrder) {
      await migrateTable(tableName);
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log(`⏱️ Duration: ${duration} seconds`);
    
    // Verify migration
    const finalUserCount = await renderDb.user.count();
    const finalTicketCount = await renderDb.ticket.count();
    const finalDrawCount = await renderDb.draw.count();
    
    console.log('\n📊 Final Data Counts:');
    console.log(`👥 Users: ${finalUserCount}`);
    console.log(`🎫 Tickets: ${finalTicketCount}`);
    console.log(`🎲 Draws: ${finalDrawCount}`);
    
    if (finalUserCount > 0) {
      console.log('\n✅ Migration successful!');
      console.log('🔗 Next steps:');
      console.log('   1. Update Render service DATABASE_URL');
      console.log('   2. Restart Render service');
      console.log('   3. Test login with your existing credentials');
    } else {
      console.log('\n❌ Migration failed - no users found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

// Run migration
migrateData().catch(console.error);
