const { Client } = require('pg');

const sql = 
-- 2PM draw
UPDATE draws
SET
  draw_date    = CURRENT_DATE,
  draw_datetime= (CURRENT_DATE + TIME '14:00') AT TIME ZONE 'Asia/Manila',
  cutoff_time  = (CURRENT_DATE + TIME '13:55') AT TIME ZONE 'Asia/Manila',
  status       = 'open'
WHERE draw_time = 'twoPM';

-- 5PM draw
UPDATE draws
SET
  draw_date    = CURRENT_DATE,
  draw_datetime= (CURRENT_DATE + TIME '17:00') AT TIME ZONE 'Asia/Manila',
  cutoff_time  = (CURRENT_DATE + TIME '16:55') AT TIME ZONE 'Asia/Manila',
  status       = 'open'
WHERE draw_time = 'fivePM';

-- 9PM draw
UPDATE draws
SET
  draw_date    = CURRENT_DATE,
  draw_datetime= (CURRENT_DATE + TIME '21:00') AT TIME ZONE 'Asia/Manila',
  cutoff_time  = (CURRENT_DATE + TIME '20:55') AT TIME ZONE 'Asia/Manila',
  status       = 'open'
WHERE draw_time = 'ninePM';

-- Optional: close any non-today rows to avoid confusion
UPDATE draws
SET status = 'closed'
WHERE draw_date <> CURRENT_DATE;;

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(sql);
  console.log('SQL applied.');
  await client.end();
})().catch(err => { console.error(err); process.exit(1); });
