const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    SELECT id, draw_time, draw_date,
           draw_datetime AT TIME ZONE 'Asia/Manila' AS draw_dt_manila,
           cutoff_time   AT TIME ZONE 'Asia/Manila' AS cutoff_manila,
           status
    FROM draws
    ORDER BY draw_date, draw_time;
  );
  console.table(res.rows);
  await client.end();
})().catch(err => { console.error(err); process.exit(1); });
