import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
      'next/server': path.join(root, 'tests/support/next-server.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/api-response.ts',
        'lib/authz.ts',
        'lib/catalog-data.ts',
        'lib/commerce-api-client.ts',
        'lib/order-state.ts',
        'lib/promotion-engine.ts',
        'lib/validation.ts',
        'app/api/commerce/[...path]/route.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
