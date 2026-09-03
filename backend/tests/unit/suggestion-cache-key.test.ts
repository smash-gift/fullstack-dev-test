import { describe, expect, it } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import { buildSuggestionCacheKey } from '../../src/domain/services/suggestion-cache-key.js';

const input: SuggestMessagesInput = {
  occasion: 'birthday',
  relationship: 'friend',
  tone: 'warm',
  language: 'en',
  count: 3,
};

describe('buildSuggestionCacheKey', () => {
  it('is stable for identical input', () => {
    expect(buildSuggestionCacheKey('openai', 'gpt-4o-mini', input)).toBe(
      buildSuggestionCacheKey('openai', 'gpt-4o-mini', input),
    );
  });

  it('normalises case and surrounding whitespace', () => {
    const messy = { ...input, occasion: '  BIRTHDAY ', relationship: 'Friend' };
    expect(buildSuggestionCacheKey('openai', 'gpt-4o-mini', messy)).toBe(
      buildSuggestionCacheKey('openai', 'gpt-4o-mini', input),
    );
  });

  // Without this, switching provider would serve the previous provider's
  // results until the TTL expired.
  it('changes when the provider or model changes', () => {
    const base = buildSuggestionCacheKey('openai', 'gpt-4o-mini', input);
    expect(buildSuggestionCacheKey('gemini', 'gpt-4o-mini', input)).not.toBe(base);
    expect(buildSuggestionCacheKey('openai', 'other-model', input)).not.toBe(base);
  });

  it('changes when any request field changes', () => {
    const base = buildSuggestionCacheKey('openai', 'gpt-4o-mini', input);
    expect(buildSuggestionCacheKey('openai', 'gpt-4o-mini', { ...input, count: 2 })).not.toBe(base);
    expect(buildSuggestionCacheKey('openai', 'gpt-4o-mini', { ...input, tone: 'funny' })).not.toBe(
      base,
    );
    expect(buildSuggestionCacheKey('openai', 'gpt-4o-mini', { ...input, language: 'pt' })).not.toBe(
      base,
    );
  });

  it('does not contain the raw user text', () => {
    const key = buildSuggestionCacheKey('openai', 'gpt-4o-mini', {
      ...input,
      relationship: 'my mother Maria',
    });
    expect(key).not.toContain('Maria');
    expect(key).toMatch(/^[0-9a-f]{40}$/);
  });
});
