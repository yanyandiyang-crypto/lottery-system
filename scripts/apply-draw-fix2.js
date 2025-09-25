const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const queries = [
    "UPDATE draws SET draw_date = CURRENT_DATE, draw_datetime = (CURRENT_DATE + TIME '14:00') AT TIME ZONE 'Asia/Manila', cutoff_time = (CURRENT_DATE + TIME '13:55') AT TIME ZONE 'Asia/Manila', status = 'open' WHERE draw_time = 'twoPM';",
    "UPDATE draws SET draw_date = CURRENT_DATE, draw_datetime = (CURRENT_DATE + TIME '17:00') AT TIME ZONE 'Asia/Manila', cutoff_time = (CURRENT_DATE + TIME '16:55') AT TIME ZONE 'Asia/Manila', status = 'open' WHERE draw_time = 'fivePM';",
    "UPDATE draws SET draw_date = CURRENT_DATE, draw_datetime = (CURRENT_DATE + TIME '21:00') AT TIME ZONE 'Asia/Manila', cutoff_time = (CURRENT_DATE + TIME '20:55') AT TIME ZONE 'Asia/Manila', status = 'open' WHERE draw_time = 'ninePM';",
    "UPDATE draws SET status = 'closed' WHERE draw_date <> CURRENT_DATE;"
  ];

  for (const q of queries) {
    const res = await client.query(q);
    console.log('OK:', q.slice(0,60) + '...');
  }

  await client.end();
  console.log('All updates applied.');
})().catch(err => { console.error(err); process.exit(1); });
