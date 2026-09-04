import { describe, expect, it } from 'vitest';

import { createLlmProvider } from '../../src/infra/llm/llm-provider.factory.js';
import { loadEnv } from '../../src/pkg/config/env.js';

const env = (vars: Record<string, string>) => loadEnv(vars as NodeJS.ProcessEnv);

/**
 * The claim ADR-0002 makes is that switching providers is an environment
 * variable and nothing else. This is that claim, checked.
 */
describe('createLlmProvider', () => {
  const cases: Array<[string, Record<string, string>, string, string]> = [
    ['openai', { LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'k' }, 'openai', 'gpt-4o-mini'],
    [
      'openrouter',
      { LLM_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'k' },
      'openrouter',
      'openai/gpt-4o-mini',
    ],
    ['gemini', { LLM_PROVIDER: 'gemini', GEMINI_API_KEY: 'k' }, 'gemini', 'gemini-3.8-flash'],
    ['stub', { LLM_PROVIDER: 'stub' }, 'stub', 'stub-deterministic-v1'],
  ];

  it.each(cases)('builds the %s provider from configuration', (_label, vars, name, model) => {
    const provider = createLlmProvider(env(vars));

    expect(provider.name).toBe(name);
    expect(provider.model).toBe(model);
  });

  it('honours an overridden model', () => {
    const provider = createLlmProvider(
      env({ LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'gpt-4.1-mini' }),
    );

    expect(provider.model).toBe('gpt-4.1-mini');
  });

  // Every adapter satisfies the same port, which is what makes the use case
  // unable to tell which one is running.
  it.each(cases)('%s satisfies the LlmProvider contract', (_label, vars) => {
    const provider = createLlmProvider(env(vars));

    expect(typeof provider.name).toBe('string');
    expect(typeof provider.model).toBe('string');
    expect(typeof provider.generateSuggestions).toBe('function');
    expect(provider.generateSuggestions).toHaveLength(2);
  });
});
