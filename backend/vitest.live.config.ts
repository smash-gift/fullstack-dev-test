import { defineConfig } from 'vitest/config';

/**
 * The gated red-team suite. Separate from `vitest.config.ts` because these
 * tests spend money and need network — everything the default suite promises
 * not to do.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.live.test.ts'],
    testTimeout: 60_000,
    // Sequential: the point is a measurement, and parallel requests to one
    // provider invite rate limiting that would look like a defence working.
    fileParallelism: false,
    maxConcurrency: 1,
  },
});
