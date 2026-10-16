import { spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import pg from 'pg';

const backend = 'http://127.0.0.1:18080';
const dbUrl = process.env.E2E_DB_URL ??
  'postgres://net_e2e:net_e2e_local_only@127.0.0.1:55432/net_commerce_e2e';
const db = new URL(dbUrl);
if (!['127.0.0.1', 'localhost'].includes(db.hostname) || db.pathname !== '/net_commerce_e2e') {
  throw new Error('E2E requires the dedicated localhost net_commerce_e2e database.');
}

const health = await fetch(`${backend}/actuator/health`).catch(() => null);
if (!health?.ok || (await health.json()).status !== 'UP') {
  throw new Error('Isolated E2E API is not healthy on port 18080. Start the dedicated Compose project first.');
}
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
try {
  const identity = await client.query('select current_database() as name');
  if (identity.rows[0]?.name !== 'net_commerce_e2e') {
    throw new Error('E2E database identity mismatch.');
  }
} finally {
  await client.end();
}

// Wrangler reads .dev.vars before .env for Worker bindings. Refuse to replace a
// developer's file; this temporary file is removed after Playwright exits.
const varsPath = new URL('../.dev.vars', import.meta.url);
await writeFile(varsPath,
  `APP_ENV=local\nLOCAL_AUTH_BYPASS=false\nCOMMERCE_API_URL=${backend}\nCOMMERCE_PUBLIC_ORIGIN=http://127.0.0.1:18787\n`,
  { flag: 'wx', mode: 0o600 },
);
try {
  const child = spawn(process.execPath, [
    'node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.config.ts',
    ...process.argv.slice(2),
  ], { stdio: 'inherit', env: process.env });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => child.kill(signal));
  }
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode) => resolve(exitCode ?? 1));
  });
  process.exitCode = code;
} finally {
  await unlink(varsPath);
}
