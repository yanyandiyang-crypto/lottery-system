#!/usr/bin/env node

/**
 * Migration Setup Script
 * Helps configure database migration from local to Render
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupMigration() {
  console.log('🔧 Database Migration Setup');
  console.log('===========================\n');
  
  console.log('This script will help you migrate your local database to Render.\n');
  
  // Get local database info
  console.log('📊 Local Database Configuration:');
  const localHost = await question('Local PostgreSQL host (default: localhost): ') || 'localhost';
  const localPort = await question('Local PostgreSQL port (default: 5432): ') || '5432';
  const localDatabase = await question('Local database name (default: lottery_system_local): ') || 'lottery_system_local';
  const localUsername = await question('Local PostgreSQL username (default: postgres): ') || 'postgres';
  const localPassword = await question('Local PostgreSQL password: ');
  
  console.log('\n🌐 Render Database Configuration:');
  console.log('You need to get your Render database connection string from:');
  console.log('1. Go to https://dashboard.render.com');
  console.log('2. Find your "lottery-db" database');
  console.log('3. Copy the "External Database URL"');
  console.log('');
  
  const renderDbUrl = await question('Render database URL (postgresql://user:pass@host:port/db): ');
  
  if (!renderDbUrl) {
    console.log('❌ Render database URL is required!');
    rl.close();
    return;
  }
  
  // Create environment file for migration
  const envContent = `# Database Migration Configuration
# Local Database
LOCAL_DB_HOST=${localHost}
LOCAL_DB_PORT=${localPort}
LOCAL_DB_NAME=${localDatabase}
LOCAL_DB_USER=${localUsername}
LOCAL_DB_PASS=${localPassword}

# Render Database
RENDER_DATABASE_URL=${renderDbUrl}

# Migration Settings
MIGRATION_MODE=pg_dump
BACKUP_LOCAL=true
`;
  
  fs.writeFileSync('.env.migration', envContent);
  console.log('\n✅ Migration configuration saved to .env.migration');
  
  // Create migration script
  const migrationScript = `#!/bin/bash

# Database Migration Script
# Migrates local PostgreSQL database to Render

echo "🚀 Starting Database Migration..."

# Load environment variables
source .env.migration

# Create database dump
echo "📤 Creating database dump..."
pg_dump -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME \\
  --no-owner --no-privileges --clean --if-exists \\
  -f lottery_system_dump.sql

if [ $? -eq 0 ]; then
  echo "✅ Database dump created successfully"
else
  echo "❌ Failed to create database dump"
  exit 1
fi

# Parse Render database URL
# postgresql://user:pass@host:port/database
RENDER_URL="$RENDER_DATABASE_URL"
RENDER_USER=$(echo $RENDER_URL | sed 's/.*:\/\/\\([^:]*\\):.*/\\1/')
RENDER_PASS=$(echo $RENDER_URL | sed 's/.*:\/\/[^:]*:\\([^@]*\\)@.*/\\1/')
RENDER_HOST=$(echo $RENDER_URL | sed 's/.*@\\([^:]*\\):.*/\\1/')
RENDER_PORT=$(echo $RENDER_URL | sed 's/.*:\\([0-9]*\\)\/.*/\\1/')
RENDER_DB=$(echo $RENDER_URL | sed 's/.*\\/\\([^?]*\\).*/\\1/')

echo "📥 Restoring to Render database..."
echo "Host: $RENDER_HOST"
echo "Port: $RENDER_PORT"
echo "Database: $RENDER_DB"
echo "Username: $RENDER_USER"

# Restore to Render
PGPASSWORD="$RENDER_PASS" psql -h $RENDER_HOST -p $RENDER_PORT -U $RENDER_USER -d $RENDER_DB \\
  -f lottery_system_dump.sql

if [ $? -eq 0 ]; then
  echo "✅ Database restored to Render successfully!"
  echo "🎉 Migration complete!"
else
  echo "❌ Failed to restore to Render database"
  exit 1
fi

echo ""
echo "🔗 Next steps:"
echo "1. Update your Render service environment variables"
echo "2. Restart your Render service"
echo "3. Test the application"
`;
  
  fs.writeFileSync('migrate-database.sh', migrationScript);
  fs.chmodSync('migrate-database.sh', '755');
  console.log('✅ Migration script created: migrate-database.sh');
  
  console.log('\n📋 Migration Summary:');
  console.log('====================');
  console.log(`Local DB: ${localHost}:${localPort}/${localDatabase}`);
  console.log(`Render DB: ${renderDbUrl.split('@')[1]}`);
  console.log('');
  console.log('🚀 To run the migration:');
  console.log('   ./migrate-database.sh');
  console.log('');
  console.log('⚠️  Important Notes:');
  console.log('   - This will OVERWRITE your Render database');
  console.log('   - Make sure Render database is empty or backed up');
  console.log('   - Test the migration on a copy first if possible');
  
  rl.close();
}

setupMigration().catch(console.error);
