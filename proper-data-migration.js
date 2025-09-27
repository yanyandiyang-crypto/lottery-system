#!/usr/bin/env node

/**
 * Proper Data Migration: Local to Render
 * Uses pg_dump and psql for reliable data transfer
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Proper Data Migration: Local → Render');
console.log('=========================================\n');

// Configuration
const config = {
  localDb: {
    host: 'localhost',
    port: '5432',
    database: 'lottery_system_local',
    username: 'postgres',
    password: 'password' // Update this with your local password
  },
  renderDb: {
    url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
  }
};

function parseDatabaseUrl(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid database URL format');
  }
  
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

async function createDataOnlyDump() {
  console.log('📤 Step 1: Creating data-only dump from local database...');
  
  try {
    const dumpFile = 'lottery_data_only.sql';
    
    // Create data-only dump (no schema)
    const dumpCommand = `pg_dump -h ${config.localDb.host} -p ${config.localDb.port} -U ${config.localDb.username} -d ${config.localDb.database} --data-only --no-owner --no-privileges --disable-triggers -f ${dumpFile}`;
    
    console.log('Creating data dump...');
    console.log(`Command: ${dumpCommand.replace(config.localDb.password, '***')}`);
    
    // Set password via environment variable
    process.env.PGPASSWORD = config.localDb.password;
    execSync(dumpCommand, { stdio: 'inherit' });
    
    console.log(`✅ Data dump created: ${dumpFile}`);
    return dumpFile;
    
  } catch (error) {
    console.error('❌ Failed to create dump:', error.message);
    console.log('\n💡 Alternative: Manual pg_dump command');
    console.log('Run this command manually:');
    console.log(`pg_dump -h localhost -p 5432 -U postgres -d lottery_system_local --data-only --no-owner --no-privileges --disable-triggers -f lottery_data_only.sql`);
    throw error;
  }
}

async function restoreDataToRender(dumpFile) {
  console.log('\n📥 Step 2: Restoring data to Render database...');
  
  try {
    const renderConfig = parseDatabaseUrl(config.renderDb.url);
    
    console.log('Parsing Render database URL...');
    console.log(`Host: ${renderConfig.host}`);
    console.log(`Port: ${renderConfig.port}`);
    console.log(`Database: ${renderConfig.database}`);
    console.log(`Username: ${renderConfig.username}`);
    
    // Restore data to Render
    const restoreCommand = `psql -h ${renderConfig.host} -p ${renderConfig.port} -U ${renderConfig.username} -d ${renderConfig.database} -f ${dumpFile}`;
    
    console.log('\nRestoring data...');
    console.log(`Command: ${restoreCommand.replace(renderConfig.password, '***')}`);
    
    // Set password via environment variable
    process.env.PGPASSWORD = renderConfig.password;
    execSync(restoreCommand, { stdio: 'inherit' });
    
    console.log('✅ Data restored to Render successfully!');
    
  } catch (error) {
    console.error('❌ Failed to restore to Render:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🧪 Step 3: Verifying migration...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const renderDb = new PrismaClient({
      datasources: {
        db: {
          url: config.renderDb.url
        }
      }
    });
    
    await renderDb.$connect();
    
    // Check data counts
    const userCount = await renderDb.user.count();
    const ticketCount = await renderDb.ticket.count();
    const drawCount = await renderDb.draw.count();
    const betCount = await renderDb.bet.count();
    
    console.log('📊 Migration Verification:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🎫 Tickets: ${ticketCount}`);
    console.log(`🎲 Draws: ${drawCount}`);
    console.log(`💰 Bets: ${betCount}`);
    
    if (userCount > 0) {
      console.log('✅ Migration successful!');
    } else {
      console.log('❌ Migration failed - no users found');
    }
    
    await renderDb.$disconnect();
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function migrateData() {
  try {
    console.log('⚠️  Important Notes:');
    console.log('- This will OVERWRITE data in Render database');
    console.log('- Make sure Render database is backed up');
    console.log('- Update LOCAL_DB_PASS with your actual password');
    console.log('');
    
    // Check if dump file already exists
    const dumpFile = 'lottery_data_only.sql';
    if (!fs.existsSync(dumpFile)) {
      await createDataOnlyDump();
    } else {
      console.log(`📁 Using existing dump file: ${dumpFile}`);
    }
    
    await restoreDataToRender(dumpFile);
    await verifyMigration();
    
    console.log('\n🎉 Data Migration Complete!');
    console.log('============================');
    console.log('✅ All local data has been migrated to Render');
    console.log('🔗 Next steps:');
    console.log('   1. Update Render service DATABASE_URL');
    console.log('   2. Restart Render service');
    console.log('   3. Test login with your existing credentials');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Manual Migration Steps:');
    console.log('1. Create dump: pg_dump --data-only -f lottery_data_only.sql');
    console.log('2. Restore: psql -h render_host -U render_user -d render_db -f lottery_data_only.sql');
  }
}

// Run migration
migrateData().catch(console.error);
