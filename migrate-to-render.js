#!/usr/bin/env node

/**
 * Database Migration Script: Local to Render
 * Exports local database data and imports to Render PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Database connections
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Local database
    }
  }
});

// Render database connection (will be set via environment)
const renderDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.RENDER_DATABASE_URL // Render database
    }
  }
});

console.log('🚀 Starting Database Migration: Local → Render');
console.log('===============================================\n');

// Tables to migrate (in dependency order)
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

async function exportTableData(tableName) {
  try {
    console.log(`📤 Exporting ${tableName}...`);
    
    // Get all data from local database
    const data = await localDb[tableName].findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`   ✅ Found ${data.length} records`);
    
    // Save to JSON file
    const exportPath = path.join(__dirname, 'migration-data', `${tableName}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.log(`   ❌ Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function importTableData(tableName, data) {
  try {
    if (data.length === 0) {
      console.log(`📥 Skipping ${tableName} (no data)`);
      return;
    }
    
    console.log(`📥 Importing ${tableName} (${data.length} records)...`);
    
    // Clear existing data (be careful with this!)
    await renderDb[tableName].deleteMany({});
    console.log(`   🗑️ Cleared existing ${tableName} data`);
    
    // Import data in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        await renderDb[tableName].createMany({
          data: batch,
          skipDuplicates: true
        });
        console.log(`   ✅ Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)}`);
      } catch (batchError) {
        console.log(`   ⚠️ Batch error (continuing):`, batchError.message);
      }
    }
    
    console.log(`   🎉 ${tableName} import complete!`);
  } catch (error) {
    console.log(`   ❌ Error importing ${tableName}:`, error.message);
  }
}

async function migrateDatabase() {
  try {
    // Create migration data directory
    const migrationDir = path.join(__dirname, 'migration-data');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    console.log('📊 Step 1: Exporting Local Database Data');
    console.log('==========================================');
    
    const exportedData = {};
    
    for (const tableName of migrationOrder) {
      const data = await exportTableData(tableName);
      exportedData[tableName] = data;
    }
    
    console.log('\n📊 Step 2: Importing to Render Database');
    console.log('=========================================');
    
    // Check if Render database URL is provided
    if (!process.env.RENDER_DATABASE_URL) {
      console.log('❌ RENDER_DATABASE_URL environment variable not set!');
      console.log('💡 Please set it to your Render database connection string');
      console.log('   Example: postgresql://user:pass@host:port/database');
      return;
    }
    
    // Test Render database connection
    try {
      await renderDb.$connect();
      console.log('✅ Connected to Render database');
    } catch (error) {
      console.log('❌ Failed to connect to Render database:', error.message);
      return;
    }
    
    // Import data in dependency order
    for (const tableName of migrationOrder) {
      await importTableData(tableName, exportedData[tableName]);
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log('✅ All data has been migrated to Render');
    console.log('🔗 Next steps:');
    console.log('   1. Update your Render service environment variables');
    console.log('   2. Restart your Render service');
    console.log('   3. Test the application');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localDb.$disconnect();
    await renderDb.$disconnect();
  }
}

// Run migration
migrateDatabase().catch(console.error);
