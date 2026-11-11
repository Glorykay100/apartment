import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load .env.test (NOT .env) so tests never touch production credentials.
config({ path: '.env.test', override: true });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
    // Prevent vitest from auto-loading .env (which has real Supabase config)
    envDir: false,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/config/supabase.ts',
        'src/config/db.ts',
      ],
    },
  },
});
