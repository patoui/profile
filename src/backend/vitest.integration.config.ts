import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    maxConcurrency: 5,
  },
});
