import { spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';

// Same isolated origin as the existing Playwright suite. Never overwrite developer bindings.
const file = new URL('../../.dev.vars', import.meta.url);
await writeFile(file, 'APP_ENV=local\nLOCAL_AUTH_BYPASS=false\nCOMMERCE_API_URL=http://127.0.0.1:18080\nCOMMERCE_PUBLIC_ORIGIN=http://127.0.0.1:18787\n', { flag: 'wx', mode: 0o600 });
try {
  const child = spawn('npm', ['run', 'dev', '--', '--port', '18787', '--hostname', '127.0.0.1'], {
    stdio: 'inherit', detached: process.platform !== 'win32',
    env: { ...process.env, COMMERCE_API_URL: 'http://127.0.0.1:18080', COMMERCE_PUBLIC_ORIGIN: 'http://127.0.0.1:18787', APP_ENV: 'local', LOCAL_AUTH_BYPASS: 'false' },
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    if (process.platform === 'win32') child.kill(signal); else if (child.pid) process.kill(-child.pid, signal);
  });
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
} finally { await unlink(file); }
