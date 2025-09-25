const { Client } = require(''pg'');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // 1) Show current timezone
  const tzBefore = await client.query("SHOW TIME ZONE;");
  console.log(''Current DB timezone:'', tzBefore.rows[0].TimeZone || JSON.stringify(tzBefore.rows[0]));

  // 2) Set session timezone to UTC for this connection
  await client.query("SET TIME ZONE ''UTC'';");
  console.log(''Session timezone set to UTC'');

  // 3) Convert columns to TIMESTAMPTZ if not already, interpreting existing as Asia/Manila local time
  try {
    await client.query("ALTER TABLE draws ALTER COLUMN draw_datetime TYPE timestamptz USING (draw_datetime AT TIME ZONE ''Asia/Manila'');");
    console.log(''Converted draws.draw_datetime to TIMESTAMPTZ (UTC)'');
  } catch (e) {
    console.log(''draw_datetime alter info:'', e.message);
  }
  try {
    await client.query("ALTER TABLE draws ALTER COLUMN cutoff_time TYPE timestamptz USING (cutoff_time AT TIME ZONE ''Asia/Manila'');");
    console.log(''Converted draws.cutoff_time to TIMESTAMPTZ (UTC)'');
  } catch (e) {
    console.log(''cutoff_time alter info:'', e.message);
  }

  // 4) Verify timezone after
  const tzAfter = await client.query("SHOW TIME ZONE;");
  console.log(''Timezone after:'', tzAfter.rows[0].TimeZone || JSON.stringify(tzAfter.rows[0]));

  await client.end();
  console.log(''Done.'');
})().catch(err => { console.error(''Error:'', err); process.exit(1); });
