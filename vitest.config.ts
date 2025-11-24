import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Run tests in parallel with isolated pools for integration tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // Increase concurrency for faster execution
    maxConcurrency: 5,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'lib/**/*.ts'],
      exclude: ['src/index.ts', 'src/types/**'],
    },
  },
});
