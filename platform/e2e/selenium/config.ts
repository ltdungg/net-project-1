import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import path from 'node:path';

const envFile = path.resolve('e2e/selenium/.env');
if (existsSync(envFile)) loadEnvFile(envFile);

function localUrl(value: string, port: string, protocol = 'http:') {
  const url = new URL(value);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.protocol !== protocol || url.port !== port) {
    throw new Error(`Selenium chỉ chạy stack E2E localhost cổng ${port}; từ chối ${url.origin}`);
  }
  return value.replace(/\/$/, '');
}

export const config = {
  baseUrl: localUrl(process.env.SELENIUM_BASE_URL ?? 'http://127.0.0.1:18787', '18787'),
  apiUrl: localUrl(process.env.SELENIUM_API_URL ?? 'http://127.0.0.1:18080', '18080'),
  dbUrl: process.env.E2E_DB_URL ?? 'postgres://net_e2e:net_e2e_local_only@127.0.0.1:55432/net_commerce_e2e',
  redisUrl: localUrl(process.env.SELENIUM_REDIS_URL ?? 'redis://127.0.0.1:56379', '56379', 'redis:'),
  browser: process.env.SELENIUM_BROWSER ?? 'chrome',
  binary: process.env.SELENIUM_BROWSER_BINARY,
  headless: process.env.SELENIUM_HEADLESS !== 'false',
  timeout: Number(process.env.SELENIUM_WAIT_MS ?? 15000),
  password: process.env.SELENIUM_TEST_PASSWORD,
  artifacts: path.resolve(process.env.SELENIUM_ARTIFACTS ?? 'test-results/selenium/latest'),
};
const database = new URL(config.dbUrl);
if (!['localhost', '127.0.0.1'].includes(database.hostname) || database.port !== '55432' || database.pathname !== '/net_commerce_e2e') {
  throw new Error('Từ chối DB: cần localhost:55432/net_commerce_e2e riêng.');
}
if (!['chrome', 'firefox'].includes(config.browser)) throw new Error('SELENIUM_BROWSER phải là chrome hoặc firefox');
if (!Number.isFinite(config.timeout) || config.timeout < 1000) throw new Error('SELENIUM_WAIT_MS phải >= 1000');
