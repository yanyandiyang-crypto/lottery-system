#!/usr/bin/env node

/**
 * Baseline Render Database
 * Marks existing database as migrated and applies new migrations
 */

const { execSync } = require('child_process');

console.log('🔧 Baselining Render Database');
console.log('===============================\n');

// Render database URL
const renderDbUrl = 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0';

try {
  console.log('📊 Baselining existing Render database...');
  
  // First, mark the database as migrated (baseline)
  console.log('Step 1: Marking database as migrated...');
  const baselineCommand = `set DATABASE_URL=${renderDbUrl} && npx prisma migrate resolve --applied "20241201000000_init"`;
  
  execSync(baselineCommand, { 
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      DATABASE_URL: renderDbUrl 
    }
  });
  
  console.log('✅ Database baselined successfully!');
  
  // Now apply remaining migrations
  console.log('\nStep 2: Applying remaining migrations...');
  const migrateCommand = `set DATABASE_URL=${renderDbUrl} && npx prisma migrate deploy`;
  
  execSync(migrateCommand, { 
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      DATABASE_URL: renderDbUrl 
    }
  });
  
  console.log('✅ All migrations applied successfully!');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run the data migration script');
  console.log('2. Test the application');
  console.log('3. Verify all data is accessible');
  
} catch (error) {
  console.error('❌ Failed to baseline database:', error.message);
  console.log('\n💡 Alternative approach:');
  console.log('1. Use prisma db push to sync schema');
  console.log('2. Then run data migration');
}
