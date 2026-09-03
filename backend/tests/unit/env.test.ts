import { describe, expect, it } from 'vitest';

import { loadEnv, parseCorsOrigins } from '../../src/pkg/config/env.js';

describe('loadEnv', () => {
  it('applies defaults when nothing is provided', () => {
    const env = loadEnv({} as NodeJS.ProcessEnv);

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LLM_PROVIDER).toBe('stub');
    expect(env.LLM_TIMEOUT_MS).toBe(8000);
    expect(env.CACHE_ENABLED).toBe(true);
  });

  it('coerces numeric variables from strings', () => {
    const env = loadEnv({ PORT: '4000', LLM_TIMEOUT_MS: '1500' } as NodeJS.ProcessEnv);

    expect(env.PORT).toBe(4000);
    expect(env.LLM_TIMEOUT_MS).toBe(1500);
  });

  it('parses CACHE_ENABLED as a boolean', () => {
    expect(loadEnv({ CACHE_ENABLED: 'false' } as NodeJS.ProcessEnv).CACHE_ENABLED).toBe(false);
    expect(loadEnv({ CACHE_ENABLED: 'true' } as NodeJS.ProcessEnv).CACHE_ENABLED).toBe(true);
  });

  // Failing loudly at startup beats an undefined surfacing as a 500 later.
  it('throws when a variable is invalid', () => {
    expect(() => loadEnv({ PORT: 'not-a-number' } as NodeJS.ProcessEnv)).toThrow(
      /Invalid environment/,
    );
    expect(() => loadEnv({ LLM_PROVIDER: 'nope' } as NodeJS.ProcessEnv)).toThrow(
      /Invalid environment/,
    );
  });

  it('names the offending variable in the error message', () => {
    expect(() => loadEnv({ LOG_LEVEL: 'loud' } as NodeJS.ProcessEnv)).toThrow(/LOG_LEVEL/);
  });
});

describe('parseCorsOrigins', () => {
  it('returns the wildcard as-is', () => {
    expect(parseCorsOrigins('*')).toBe('*');
  });

  it('splits and trims a comma-separated list', () => {
    expect(parseCorsOrigins('http://a.test, http://b.test')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });
});
