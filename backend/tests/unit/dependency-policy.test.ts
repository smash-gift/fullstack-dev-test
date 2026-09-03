import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

interface PackageManifest {
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
  readonly scarfSettings?: { readonly enabled: boolean };
}

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8'),
) as PackageManifest;

/**
 * Phase 06 pinned every runtime dependency to an exact version so that an
 * `npm install` on a fresh machine cannot quietly pull a different minor than
 * the one that was tested. That was a claim in a document; here it is a check.
 */
describe('runtime dependencies', () => {
  it.each(Object.entries(manifest.dependencies))('pins %s to an exact version', (_name, range) => {
    expect(range).toMatch(/^\d+\.\d+\.\d+$/);
  });

  /**
   * Not a style rule. Every direct dependency is a supply chain we inherit,
   * and the list is short enough that adding to it should be a decision
   * someone makes on purpose.
   */
  it('keeps the direct runtime surface small', () => {
    expect(Object.keys(manifest.dependencies).length).toBeLessThanOrEqual(10);
  });
});

/**
 * `swagger-ui-dist` depends on `@scarf/scarf`, whose `postinstall` script
 * reports the install to a third party. Nobody cloning this repository agreed
 * to that, and the package's own opt-out (`report.js`, `userHasOptedOut`)
 * reads this field from the root manifest.
 *
 * Chosen over `ignore-scripts=true` in `.npmrc`, which would have silenced
 * this one telemetry call by disabling every dependency's install script —
 * a much larger change with a much better chance of breaking someone's setup.
 */
describe('install-time telemetry', () => {
  it('opts out on behalf of anyone who clones this repository', () => {
    expect(manifest.scarfSettings?.enabled).toBe(false);
  });
});
