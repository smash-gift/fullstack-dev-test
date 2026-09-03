import { describe, expect, it } from 'vitest';

import { loadEnv, parseCorsOrigins } from '../../src/pkg/config/env.js';

const env = (overrides: Record<string, string> = {}) =>
  loadEnv({ LLM_PROVIDER: 'stub', ...overrides } as NodeJS.ProcessEnv);

describe('loadEnv', () => {
  it('applies defaults when nothing is provided', () => {
    const result = env();

    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.LLM_TIMEOUT_MS).toBe(8000);
    expect(result.LLM_TEMPERATURE).toBe(0.8);
    expect(result.CACHE_ENABLED).toBe(true);
  });

  // The brief asks for "OpenAI or Google AI", so the default path is OpenAI.
  it('defaults LLM_PROVIDER to openai', () => {
    expect(loadEnv({ OPENAI_API_KEY: 'test-key' } as NodeJS.ProcessEnv).LLM_PROVIDER).toBe(
      'openai',
    );
  });

  it('defaults to model identifiers confirmed against each catalogue', () => {
    const result = env();

    expect(result.OPENAI_MODEL).toBe('gpt-4o-mini');
    expect(result.OPENROUTER_MODEL).toBe('openai/gpt-4o-mini');
    expect(result.GEMINI_MODEL).toBe('gemini-3.8-flash');
  });

  it('coerces numeric variables from strings', () => {
    const result = env({ PORT: '4000', LLM_TIMEOUT_MS: '1500', LLM_TEMPERATURE: '0.2' });

    expect(result.PORT).toBe(4000);
    expect(result.LLM_TIMEOUT_MS).toBe(1500);
    expect(result.LLM_TEMPERATURE).toBe(0.2);
  });

  it('parses CACHE_ENABLED as a boolean', () => {
    expect(env({ CACHE_ENABLED: 'false' }).CACHE_ENABLED).toBe(false);
    expect(env({ CACHE_ENABLED: 'true' }).CACHE_ENABLED).toBe(true);
  });

  // Failing loudly at startup beats an undefined surfacing as a 500 later.
  it('throws when a variable is invalid', () => {
    expect(() => env({ PORT: 'not-a-number' })).toThrow(/Invalid environment/);
    expect(() => env({ LLM_PROVIDER: 'nope' })).toThrow(/Invalid environment/);
    expect(() => env({ LLM_TEMPERATURE: '9' })).toThrow(/Invalid environment/);
  });

  it('names the offending variable in the error message', () => {
    expect(() => env({ LOG_LEVEL: 'loud' })).toThrow(/LOG_LEVEL/);
  });
});

describe('loadEnv — provider credentials', () => {
  const cases: Array<[string, string]> = [
    ['openai', 'OPENAI_API_KEY'],
    ['openrouter', 'OPENROUTER_API_KEY'],
    ['gemini', 'GEMINI_API_KEY'],
  ];

  it.each(cases)('requires the key for provider %s', (provider, variable) => {
    expect(() => loadEnv({ LLM_PROVIDER: provider } as NodeJS.ProcessEnv)).toThrow(
      new RegExp(variable),
    );
  });

  it.each(cases)('accepts provider %s once its key is set', (provider, variable) => {
    const result = loadEnv({
      LLM_PROVIDER: provider,
      [variable]: 'test-key',
    } as NodeJS.ProcessEnv);

    expect(result.LLM_PROVIDER).toBe(provider);
  });

  // Demanding all three keys would force accounts with providers nobody uses.
  it('does not require keys for providers that are not selected', () => {
    expect(() =>
      loadEnv({ LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'test-key' } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('requires no credentials at all for the stub provider', () => {
    expect(() => loadEnv({ LLM_PROVIDER: 'stub' } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('treats a blank key as missing', () => {
    expect(() =>
      loadEnv({ LLM_PROVIDER: 'openai', OPENAI_API_KEY: '   ' } as NodeJS.ProcessEnv),
    ).toThrow(/OPENAI_API_KEY/);
  });

  it('points to the stub as a way out when a key is missing', () => {
    expect(() => loadEnv({ LLM_PROVIDER: 'openai' } as NodeJS.ProcessEnv)).toThrow(
      /LLM_PROVIDER=stub/,
    );
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
