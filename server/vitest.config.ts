import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/seed/**', 'src/server.ts'],
    },
    // Integration tests that spin up MongoMemoryReplSet can be slow
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
