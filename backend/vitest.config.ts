import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The live red-team suite spends money and needs network. It runs only
    // through `npm run test:security:live`, never as part of `npm test`.
    exclude: ['tests/**/*.live.test.ts', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main/server.ts'],
    },
  },
});
