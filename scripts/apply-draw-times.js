const { Client } = require('pg');
const moment = require('moment-timezone');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const today = moment.tz('Asia/Manila').format('YYYY-MM-DD');
  const rows = [];

  async function up(drawTimeKey, drawHH, cutoffHH, cutoffMM) {
    const drawTs = moment.tz(${today} :00:00, 'Asia/Manila').toDate();
    const cutoffTs = moment.tz(${today} ::00, 'Asia/Manila').toDate();
    const r = await client.query(
      'UPDATE draws SET draw_datetime = , cutoff_time = , status =  WHERE draw_time =  AND draw_date = CURRENT_DATE RETURNING id, draw_time, draw_date, draw_datetime, cutoff_time, status',
      [drawTs, cutoffTs, 'open', drawTimeKey]
    );
    rows.push({ drawTimeKey, updated: r.rowCount, sample: r.rows[0] });
  }

  await up('twoPM', 14, 13, 55);
  await up('fivePM', 17, 16, 55);
  await up('ninePM', 21, 20, 55);

  console.log(JSON.stringify(rows, null, 2));
  await client.end();
})().catch(err => { console.error('Error:', err); process.exit(1); });
