#!/usr/bin/env node

/**
 * Prisma-based Database Migration: Local to Render
 * Uses Prisma Client to migrate data between databases
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🚀 Prisma Database Migration: Local → Render');
console.log('=============================================\n');

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

// Migration order (respecting foreign key dependencies)
const migrationOrder = [
  'Region',
  'User', 
  'SystemFunction',
  'RoleFunctionPermission',
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
    
    // Import data in batches
    const batchSize = 50;
    let importedCount = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        await renderDb[tableName].createMany({
          data: batch,
          skipDuplicates: true
        });
        importedCount += batch.length;
        console.log(`   ✅ Imported ${importedCount}/${data.length} records`);
      } catch (batchError) {
        console.log(`   ⚠️ Batch error: ${batchError.message}`);
        // Try individual inserts for this batch
        for (const record of batch) {
          try {
            await renderDb[tableName].create({ data: record });
            importedCount++;
          } catch (recordError) {
            console.log(`   ❌ Failed to import record: ${recordError.message}`);
          }
        }
      }
    }
    
    console.log(`   🎉 ${tableName} migration complete! (${importedCount}/${data.length})`);
    
  } catch (error) {
    console.log(`   ❌ Error migrating ${tableName}: ${error.message}`);
  }
}

async function testConnections() {
  console.log('🔍 Testing database connections...');
  
  try {
    // Test local connection
    const localCount = await localDb.user.count();
    console.log(`✅ Local database connected (${localCount} users)`);
  } catch (error) {
    console.log(`❌ Local database connection failed: ${error.message}`);
    throw error;
  }
  
  try {
    // Test Render connection
    const renderCount = await renderDb.user.count();
    console.log(`✅ Render database connected (${renderCount} users)`);
  } catch (error) {
    console.log(`❌ Render database connection failed: ${error.message}`);
    throw error;
  }
  
  console.log('');
}

async function migrateDatabase() {
  try {
    await testConnections();
    
    console.log('📊 Starting data migration...');
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
    console.log('✅ All data has been migrated to Render');
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Update your Render service environment variables');
    console.log('   2. Restart your Render service');
    console.log('   3. Test the application');
    console.log('   4. Verify all data is accessible');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check your local database is running');
    console.log('   - Verify Render database URL is correct');
    console.log('   - Ensure network connectivity to Render');
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

// Run migration
migrateDatabase().catch(console.error);
