import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup/http.ts'],
    // Supertest opens an ephemeral HTTP server per request, and the churn is
    // not free: a full run failed roughly once in ten with `ECONNRESET`, a
    // `socket hang up`, or a status this API never returns - a `403` is the
    // tell, because it proves the answer came from a server that is not ours.
    //
    // The cause was cut at the source: the corpus suite went from a server per
    // request to two for the file (see `tests/helpers/http-client.ts`), and 40
    // consecutive runs then passed without a single retry, against 3 failures
    // in 30 before. This retry is the net for the residue, and it hides
    // nothing: a real failure is deterministic and fails both attempts, which
    // was verified by planting one.
    retry: 1,
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
