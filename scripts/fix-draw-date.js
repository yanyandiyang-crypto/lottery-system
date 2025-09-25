const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("UPDATE draws SET draw_date = DATE '2025-09-24' WHERE draw_date = DATE '2025-09-25' RETURNING id, draw_date, draw_time, status");
  console.log('updated:', res.rowCount);
  console.log(res.rows);
  await client.end();
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
