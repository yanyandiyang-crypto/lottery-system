const { Client } = require('pg');

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error('DATABASE_URL not set');
		process.exit(1);
	}

	const client = new Client({ connectionString });
	await client.connect();
	try {
		const tablesQuery = `
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema='public'
			AND table_name IN (
				'login_audit','draw_schedules','user_bet_limits','audit_log',
				'users','tickets','balance_transactions','user_balances','draws'
			)
			ORDER BY table_name
		`;
		const tables = await client.query(tablesQuery);
		console.log('Tables present:', tables.rows.map(r => r.table_name));

		const indexesQuery = `
			SELECT tablename, indexname
			FROM pg_indexes
			WHERE schemaname='public'
			AND tablename IN ('users','tickets','balance_transactions','login_audit','audit_log')
			ORDER BY tablename, indexname
		`;
		const idx = await client.query(indexesQuery);
		const byTable = idx.rows.reduce((m, r) => {
			m[r.tablename] = m[r.tablename] || [];
			m[r.tablename].push(r.indexname);
			return m;
		}, {});
		console.log('Indexes by table:', byTable);
	} finally {
		await client.end();
	}
}

main().catch(err => {
	console.error('Verification failed:', err.message);
	process.exit(1);
});



