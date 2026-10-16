import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:18787';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 18787 --hostname 127.0.0.1',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      COMMERCE_API_URL: 'http://127.0.0.1:18080',
      COMMERCE_PUBLIC_ORIGIN: baseURL,
      APP_ENV: 'local',
      LOCAL_AUTH_BYPASS: 'false',
    },
  },
});
