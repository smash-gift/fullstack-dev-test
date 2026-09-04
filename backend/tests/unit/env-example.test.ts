import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ENV_KEYS } from '../../src/pkg/config/env.js';

/**
 * `.env.example` is the only configuration documentation an evaluator reads
 * before running the project. A knob that exists in the schema but not in the
 * example is a knob nobody knows about; one that exists only in the example is
 * a promise the code does not keep.
 *
 * This test is what keeps the two from drifting, which they already did once:
 * the retry settings added in phase 04 never made it into the example.
 */
describe('.env.example', () => {
  const content = readFileSync(resolve(import.meta.dirname, '../../.env.example'), 'utf8');
  const documented = new Set(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('=')[0]?.trim())
      .filter((key): key is string => Boolean(key)),
  );

  it.each(ENV_KEYS)('documents %s', (key) => {
    expect(documented.has(key)).toBe(true);
  });

  it('documents nothing the schema does not read', () => {
    const known = new Set<string>(ENV_KEYS);
    expect([...documented].filter((key) => !known.has(key))).toEqual([]);
  });

  it('ships no real credential', () => {
    expect(content).not.toMatch(/sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}/);
    for (const line of content.split('\n')) {
      if (/_API_KEY=/.test(line)) expect(line.trim()).toMatch(/_API_KEY=$/);
    }
  });
});
