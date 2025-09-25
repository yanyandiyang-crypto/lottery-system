const { Client } = require('pg');
const moment = require('moment-timezone');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const todayManila = moment.tz('Asia/Manila').format('YYYY-MM-DD');
  const plans = [
    { key: 'twoPM', draw: '14:00:00', cutoff: '13:55:00' },
    { key: 'fivePM', draw: '17:00:00', cutoff: '16:55:00' },
    { key: 'ninePM', draw: '21:00:00', cutoff: '20:55:00' }
  ];

  for (const p of plans) {
    const drawManila = moment.tz(todayManila + ' ' + p.draw, 'Asia/Manila');
    const cutoffManila = moment.tz(todayManila + ' ' + p.cutoff, 'Asia/Manila');
    const drawUtc = drawManila.clone().utc().toDate();
    const cutoffUtc = cutoffManila.clone().utc().toDate();

    // 1) Check if a row for today already exists for this draw_time
    const existingToday = await client.query(
      'SELECT id FROM draws WHERE draw_time =  AND draw_date = CURRENT_DATE LIMIT 1',
      [p.key]
    );

    if (existingToday.rows.length > 0) {
      const id = existingToday.rows[0].id;
      const r = await client.query(
        'UPDATE draws SET draw_datetime = , cutoff_time = , status =  WHERE id =  RETURNING id, draw_date, draw_time, draw_datetime, cutoff_time, status',
        [drawUtc, cutoffUtc, 'open', id]
      );
      console.log('Updated existing today row for', p.key, r.rows[0]);
    } else {
      // 2) Update one non-today row to today to avoid unique constraint conflicts
      const anyRow = await client.query(
        'SELECT id FROM draws WHERE draw_time =  ORDER BY id ASC LIMIT 1',
        [p.key]
      );
      if (anyRow.rows.length === 0) {
        console.warn('No draw row found for draw_time', p.key);
        continue;
      }
      const id = anyRow.rows[0].id;
      const r = await client.query(
        'UPDATE draws SET draw_date = CURRENT_DATE, draw_datetime = , cutoff_time = , status =  WHERE id =  RETURNING id, draw_date, draw_time, draw_datetime, cutoff_time, status',
        [drawUtc, cutoffUtc, 'open', id]
      );
      console.log('Shifted row to today for', p.key, r.rows[0]);
    }

    // 3) Optional: close any other rows for same draw_time but not today to avoid confusion
    await client.query(
      "UPDATE draws SET status = 'closed' WHERE draw_time =  AND draw_date <> CURRENT_DATE",
      [p.key]
    );
  }

  await client.end();
})().catch(err => { console.error('Error:', err); process.exit(1); });
