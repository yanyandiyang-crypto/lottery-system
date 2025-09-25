const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Set all open draws to today's date
  const res1 = await client.query(
    "UPDATE draws SET draw_date = CURRENT_DATE, status = 'open' WHERE status = 'open' AND draw_date <> CURRENT_DATE RETURNING id, draw_date, draw_time, status"
  );
  console.log('Draws date sync updated rows:', res1.rowCount);
  if (res1.rows.length) console.log(res1.rows);

  await client.end();
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
