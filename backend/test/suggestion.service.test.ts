import { describe, expect, it } from 'vitest';
import { LlmUnavailableError } from '../src/lib/errors.js';
import { SuggestionService } from '../src/services/suggestion.service.js';
import type { LlmProvider, SuggestionRequest } from '../src/types.js';

const request: SuggestionRequest = {
  occasion: 'birthday',
  relationship: 'friend',
};

/** A provider that always fails, to exercise the fallback path. */
class FailingProvider implements LlmProvider {
  readonly name = 'failing';
  generateSuggestions(): Promise<string[]> {
    return Promise.reject(new LlmUnavailableError('boom'));
  }
}

/** A provider that returns valid suggestions, for the happy path. */
class OkProvider implements LlmProvider {
  readonly name = 'ok';
  generateSuggestions(): Promise<string[]> {
    return Promise.resolve(['one', 'two', 'three']);
  }
}

describe('SuggestionService', () => {
  it('falls back with source="fallback" and non-empty messages when the LLM fails', async () => {
    const service = new SuggestionService({ llm: new FailingProvider() });

    const result = await service.getSuggestions(request);

    expect(result.source).toBe('fallback');
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.suggestions.every((s) => s.trim().length > 0)).toBe(true);
  });

  it('runs in fallback-only mode when no LLM is configured', async () => {
    const service = new SuggestionService({});

    const result = await service.getSuggestions(request);

    expect(result.source).toBe('fallback');
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('returns LLM suggestions with source="llm" on success', async () => {
    const service = new SuggestionService({ llm: new OkProvider() });

    const result = await service.getSuggestions(request);

    expect(result.source).toBe('llm');
    expect(result.suggestions).toEqual(['one', 'two', 'three']);
  });

  it('serves a cached LLM result on the second identical call', async () => {
    let calls = 0;
    const counting: LlmProvider = {
      name: 'counting',
      generateSuggestions: () => {
        calls += 1;
        return Promise.resolve(['a', 'b']);
      },
    };
    const service = new SuggestionService({
      llm: counting,
      cacheTtlMs: 60_000,
    });

    await service.getSuggestions(request);
    const second = await service.getSuggestions(request);

    expect(calls).toBe(1);
    expect(second.source).toBe('llm');
  });
});
