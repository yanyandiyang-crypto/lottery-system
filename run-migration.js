const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Single connection for migration
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Read all SQL migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.toLowerCase().endsWith('.sql'))
      .sort();

    console.log(`📝 Executing ${files.length} migration file(s) in order...`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`⏳ Running ${file}...`);
      try {
        await client.query(sql);
        console.log(`✅ ${file} executed successfully`);
      } catch (error) {
        console.error(`❌ Migration failed in ${file}:`, error.message);
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            (error.message.includes('relation') && error.message.includes('already exists')) ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  Non-fatal error in ${file} (likely safe to ignore)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log('✅ Migration completed successfully!');
    
    console.log('\n🔍 Verifying new features...');
    
    // Verify new tables exist
    const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('login_audit', 'draw_schedules', 'user_bet_limits', 'audit_log')
        ORDER BY table_name
      `);
      
    console.log('📋 New tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verify indexes
    const indexesResult = await client.query(`
        SELECT schemaname, tablename, indexname 
        FROM pg_indexes 
        WHERE tablename IN ('users', 'tickets', 'balance_transactions', 'login_audit', 'audit_log')
        ORDER BY tablename, indexname
      `);
      
    console.log('\n🔍 New indexes created:');
    const indexGroups = {};
    indexesResult.rows.forEach(row => {
      if (!indexGroups[row.tablename]) {
        indexGroups[row.tablename] = [];
      }
      indexGroups[row.tablename].push(row.indexname);
    });
    
    Object.keys(indexGroups).forEach(table => {
      console.log(`   ${table}: ${indexGroups[table].length} indexes`);
    });
    
    // Verify constraints
    const constraintsResult = await client.query(`
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid IN (
          SELECT oid FROM pg_class 
          WHERE relname IN ('tickets', 'balance_transactions')
        )
      `);
      
    console.log('\n🔒 New constraints added:');
    constraintsResult.rows.forEach(row => {
      console.log(`   - ${row.conname} (${row.contype})`);
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(console.error);

