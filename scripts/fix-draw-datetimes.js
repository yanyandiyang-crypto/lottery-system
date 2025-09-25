const { Client } = require('pg');
const moment = require('moment-timezone');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const manilaNow = moment.tz('Asia/Manila');
  const todayStr = manilaNow.format('YYYY-MM-DD');

  const plans = [
    { key: 'twoPM', draw: '14:00:00', cutoff: '13:55:00' },
    { key: 'fivePM', draw: '17:00:00', cutoff: '16:55:00' },
    { key: 'ninePM', draw: '21:00:00', cutoff: '20:55:00' }
  ];

  for (const p of plans) {
    const drawManila = moment.tz(todayStr + ' ' + p.draw, 'Asia/Manila');
    const cutoffManila = moment.tz(todayStr + ' ' + p.cutoff, 'Asia/Manila');

    const drawUtc = drawManila.clone().utc().toDate();
    const cutoffUtc = cutoffManila.clone().utc().toDate();

    const res = await client.query(
      'UPDATE draws SET draw_date = , draw_datetime = , cutoff_time = , status =  WHERE draw_time =  RETURNING id, draw_date, draw_time, draw_datetime, cutoff_time, status',
      [todayStr, drawUtc, cutoffUtc, 'open', p.key]
    );

    console.log('Updated', p.key, 'rows:', res.rowCount);
    if (res.rows[0]) console.log(res.rows[0]);
  }

  await client.end();
})().catch(err => { console.error('Error:', err); process.exit(1); });
