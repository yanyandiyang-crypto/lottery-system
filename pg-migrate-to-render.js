#!/usr/bin/env node

/**
 * PostgreSQL Migration Script: Local to Render
 * Uses pg_dump and psql for reliable data migration
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 PostgreSQL Migration: Local → Render');
console.log('=======================================\n');

// Configuration
const config = {
  localDb: {
    host: 'localhost',
    port: '5432',
    database: 'lottery_system_local',
    username: 'postgres', // Update this
    password: 'password'  // Update this
  },
  renderDb: {
    // This will be provided by Render database URL
    url: process.env.RENDER_DATABASE_URL
  }
};

function parseDatabaseUrl(url) {
  // Parse postgresql://user:pass@host:port/database
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

async function createDump() {
  console.log('📤 Step 1: Creating Database Dump');
  console.log('==================================');
  
  try {
    const dumpFile = 'lottery_system_dump.sql';
    
    // Create pg_dump command
    const dumpCommand = `pg_dump -h ${config.localDb.host} -p ${config.localDb.port} -U ${config.localDb.username} -d ${config.localDb.database} --no-owner --no-privileges --clean --if-exists -f ${dumpFile}`;
    
    console.log('Creating database dump...');
    console.log(`Command: ${dumpCommand.replace(config.localDb.password, '***')}`);
    
    // Set password via environment variable
    process.env.PGPASSWORD = config.localDb.password;
    execSync(dumpCommand, { stdio: 'inherit' });
    
    console.log(`✅ Database dump created: ${dumpFile}`);
    return dumpFile;
    
  } catch (error) {
    console.error('❌ Failed to create dump:', error.message);
    throw error;
  }
}

async function restoreToRender(dumpFile) {
  console.log('\n📥 Step 2: Restoring to Render Database');
  console.log('========================================');
  
  if (!config.renderDb.url) {
    console.log('❌ RENDER_DATABASE_URL not provided!');
    console.log('💡 Please set the Render database connection string');
    console.log('   Example: postgresql://user:pass@host:port/database');
    return;
  }
  
  try {
    const renderConfig = parseDatabaseUrl(config.renderDb.url);
    
    console.log('Parsing Render database URL...');
    console.log(`Host: ${renderConfig.host}`);
    console.log(`Port: ${renderConfig.port}`);
    console.log(`Database: ${renderConfig.database}`);
    console.log(`Username: ${renderConfig.username}`);
    
    // Create psql command
    const restoreCommand = `psql -h ${renderConfig.host} -p ${renderConfig.port} -U ${renderConfig.username} -d ${renderConfig.database} -f ${dumpFile}`;
    
    console.log('\nRestoring database...');
    console.log(`Command: ${restoreCommand.replace(renderConfig.password, '***')}`);
    
    // Set password via environment variable
    process.env.PGPASSWORD = renderConfig.password;
    execSync(restoreCommand, { stdio: 'inherit' });
    
    console.log('✅ Database restored to Render successfully!');
    
  } catch (error) {
    console.error('❌ Failed to restore to Render:', error.message);
    throw error;
  }
}

async function migrateDatabase() {
  try {
    // Check if dump file already exists
    const dumpFile = 'lottery_system_dump.sql';
    if (!fs.existsSync(dumpFile)) {
      await createDump();
    } else {
      console.log(`📁 Using existing dump file: ${dumpFile}`);
    }
    
    await restoreToRender(dumpFile);
    
    console.log('\n🎉 Migration Complete!');
    console.log('======================');
    console.log('✅ Your local database has been migrated to Render');
    console.log('🔗 Next steps:');
    console.log('   1. Update Render service environment variables');
    console.log('   2. Restart Render service');
    console.log('   3. Test the application');
    console.log('   4. Verify all data is accessible');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check your local PostgreSQL credentials');
    console.log('   - Ensure Render database URL is correct');
    console.log('   - Verify network connectivity');
  }
}

// Run migration
migrateDatabase().catch(console.error);
