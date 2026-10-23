import { defineConfig } from 'vitest/config';
import { config } from './config.ts';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/selenium/specs/*.test.ts'],
    globalSetup: ['e2e/selenium/support/preflight.ts'],
    testTimeout: 90000,
    hookTimeout: 90000,
    retry: 0,
    fileParallelism: true,
    maxWorkers: Number(process.env.SELENIUM_WORKERS ?? 1),
    reporters: ['default', 'json', 'junit'],
    outputFile: {
      json: `${config.artifacts}/results.json`,
      junit: `${config.artifacts}/junit.xml`,
    },
  },
});
