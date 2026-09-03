import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

interface SourceFile {
  readonly path: string;
  readonly content: string;
}

function collect(dir: string): SourceFile[] {
  const files: SourceFile[] = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collect(full));
    } else if (entry.endsWith('.ts')) {
      files.push({ path: relative(SRC, full), content: readFileSync(full, 'utf8') });
    }
  }

  return files;
}

const sources = collect(SRC);
const inLayer = (layer: string) => sources.filter((f) => f.path.startsWith(`${layer}/`));

/** Every module specifier this file imports from. */
function importsOf(file: SourceFile): string[] {
  return [...file.content.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] ?? '');
}

/**
 * The rules this project claims about itself, checked by machine.
 *
 * These are all things a reviewer could verify by reading — which is exactly
 * why they belong here. A rule that depends on someone remembering to look is
 * a convention; a rule with a test is a property. The distinction is the same
 * one that moved the output guard from a helper to a port in phase 05.
 */
describe('S6 — the dependency arrows point inward', () => {
  it('finds source files to check, so a broken glob cannot pass silently', () => {
    expect(sources.length).toBeGreaterThan(30);
    expect(inLayer('domain').length).toBeGreaterThan(5);
  });

  /**
   * The load-bearing rule of the whole architecture. The domain describes the
   * problem; the moment it imports a framework it starts describing a
   * solution, and the ability to test business rules without a server dies
   * with it.
   */
  it.each(['express', 'cors', 'helmet', 'pino', 'express-rate-limit', 'swagger-ui-dist'])(
    'keeps %s out of the domain',
    (pkg) => {
      const offenders = inLayer('domain')
        .filter((f) => importsOf(f).some((i) => i === pkg || i.startsWith(`${pkg}/`)))
        .map((f) => f.path);

      expect(offenders).toEqual([]);
    },
  );

  it('keeps the domain from importing infra, presentation or main', () => {
    const offenders = inLayer('domain')
      .filter((f) => importsOf(f).some((i) => /\/(infra|presentation|main)\//.test(i)))
      .map((f) => f.path);

    expect(offenders).toEqual([]);
  });

  /**
   * The reason `pkg/security/input-sanitizer.ts` lives where it does. Its
   * caller is a Zod schema in `presentation`, and `presentation -> infra`
   * would have inverted this arrow — so the shared piece moved to the shared
   * layer instead of the dependency being bent.
   */
  it('keeps presentation from reaching into infra', () => {
    const offenders = inLayer('presentation')
      .filter((f) => importsOf(f).some((i) => i.includes('/infra/')))
      .map((f) => f.path);

    expect(offenders).toEqual([]);
  });

  /** `pkg` is the shared technical floor; it may not depend on anything above it. */
  it('keeps pkg from depending on any application layer', () => {
    const offenders = inLayer('pkg')
      .filter((f) => importsOf(f).some((i) => /\/(domain|infra|presentation|main)\//.test(i)))
      .map((f) => f.path);

    expect(offenders).toEqual([]);
  });

  /**
   * No vendor SDK anywhere. The three adapters speak HTTP through `fetch`, so
   * a compromised provider package cannot become our problem, and swapping a
   * provider is one file rather than a dependency migration.
   */
  it.each(['openai', '@google/generative-ai', '@anthropic-ai/sdk', 'langchain'])(
    'uses no %s SDK',
    (sdk) => {
      const offenders = sources
        .filter((f) => importsOf(f).some((i) => i === sdk || i.startsWith(`${sdk}/`)))
        .map((f) => f.path);

      expect(offenders).toEqual([]);
    },
  );
});

describe('S6 — configuration and secrets have one door', () => {
  /**
   * One file reads the environment. Scattered `process.env` is how a service
   * ends up with a setting nobody documented and a default nobody chose.
   */
  it('reads process.env in exactly one file', () => {
    const readers = sources.filter((f) => f.content.includes('process.env')).map((f) => f.path);

    expect(readers).toEqual(['pkg/config/env.ts']);
  });

  it('contains no literal that looks like a real credential', () => {
    const offenders = sources
      .filter((f) => /sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-/.test(f.content))
      .map((f) => f.path);

    expect(offenders).toEqual([]);
  });
});

/**
 * The project's own rule, stated at the start: never a `catch` without
 * explicit handling in the `catch`. Swallowed errors are how a system starts
 * lying about its own state.
 */
describe('S6 — no error is swallowed', () => {
  it('has no empty catch block', () => {
    const offenders: string[] = [];

    for (const file of sources) {
      // `catch {}`, `catch (e) {}`, and bodies holding nothing but a comment.
      const pattern = /catch\s*(?:\([^)]*\))?\s*\{([\s\S]*?)\}/g;
      for (const match of file.content.matchAll(pattern)) {
        const body = (match[1] ?? '')
          .replace(/\/\/[^\n]*/g, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .trim();
        if (body.length === 0) offenders.push(file.path);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never discards a rejection with an empty arrow handler', () => {
    const offenders = sources
      .filter((f) =>
        /\.catch\(\s*\(\s*[^)]*\)\s*=>\s*(\{\s*\}|undefined|null)\s*\)/.test(f.content),
      )
      .map((f) => f.path);

    expect(offenders).toEqual([]);
  });
});

/**
 * Layer 3 is only a guarantee if there is exactly one path to the model that
 * cannot be bypassed. These two assertions are what keep that sentence true as
 * the code changes.
 */
describe('S6 — the security guard cannot be routed around', () => {
  it('is called on the shared path in the use case', () => {
    const useCase = sources.find((f) => f.path.endsWith('suggest-messages.usecase.ts'));

    expect(useCase?.content).toMatch(/guard\.assertSafe\(/);
  });

  it('is not something an adapter has to remember to call', () => {
    const adapterCalls = inLayer('infra')
      .filter((f) => /assertSuggestionsAreSafe\(|guard\.assertSafe\(/.test(f.content))
      .filter((f) => !f.path.includes('security/'))
      .map((f) => f.path);

    expect(adapterCalls).toEqual([]);
  });
});
