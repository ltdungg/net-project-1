import { Client } from 'pg';

const connectionString = process.env.E2E_DB_URL ??
  'postgres://net_e2e:net_e2e_local_only@127.0.0.1:55432/net_commerce_e2e';
const url = new URL(connectionString);

if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/net_commerce_e2e') {
  throw new Error('E2E database must be the dedicated local net_commerce_e2e database.');
}

export async function withDatabase<T>(run: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({ connectionString });
  await db.connect();
  try {
    const result = await db.query<{ current_database: string }>('select current_database()');
    if (result.rows[0]?.current_database !== 'net_commerce_e2e') {
      throw new Error('E2E database identity mismatch.');
    }
    return await run(db);
  } finally {
    await db.end();
  }
}
