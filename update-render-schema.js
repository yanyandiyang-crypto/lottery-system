#!/usr/bin/env node

/**
 * Update Render Database Schema
 * Applies all migrations to Render database
 */

const { execSync } = require('child_process');

console.log('🔧 Updating Render Database Schema');
console.log('==================================\n');

// Render database URL
const renderDbUrl = 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0';

try {
  console.log('📊 Applying migrations to Render database...');
  
  // Set environment variable and run migrations
  const command = `set DATABASE_URL=${renderDbUrl} && npx prisma migrate deploy`;
  
  console.log('Running command:', command.replace(renderDbUrl.split('@')[1], '***'));
  
  execSync(command, { 
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      DATABASE_URL: renderDbUrl 
    }
  });
  
  console.log('✅ Schema updated successfully!');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run the data migration script');
  console.log('2. Test the application');
  console.log('3. Verify all data is accessible');
  
} catch (error) {
  console.error('❌ Failed to update schema:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('- Check Render database connectivity');
  console.log('- Verify database URL is correct');
  console.log('- Ensure migrations are up to date');
}
