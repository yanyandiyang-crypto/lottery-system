const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking tickets table structure...');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tickets' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Tickets table columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🔍 Checking if bets table exists...');
    const betsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'bets' 
      ORDER BY ordinal_position
    `);
    
    if (betsResult.rows.length > 0) {
      console.log('\n📋 Bets table columns:');
      betsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Bets table does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
