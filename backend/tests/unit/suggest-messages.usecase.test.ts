import { describe, expect, it, vi } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../src/domain/entities/suggestion.js';
import type { LlmProvider } from '../../src/domain/providers/llm-provider.js';
import { SuggestMessagesUseCase } from '../../src/domain/usecases/suggest-messages.usecase.js';
import { InMemorySuggestionCache } from '../../src/infra/cache/in-memory-suggestion-cache.js';
import { NoOpSuggestionCache } from '../../src/infra/cache/no-op-suggestion-cache.js';

const input: SuggestMessagesInput = {
  occasion: 'birthday',
  relationship: 'friend',
  tone: 'warm',
  language: 'en',
  count: 3,
};

const generated: Suggestion[] = [
  { id: 'sug_1', text: 'Happy birthday!' },
  { id: 'sug_2', text: 'Have a great one.' },
  { id: 'sug_3', text: 'Wishing you the best.' },
];

/**
 * Substituting the provider takes a five-line object, with no network and no
 * API key. That is the payoff of depending on a port rather than an SDK.
 */
function fakeProvider(overrides: Partial<LlmProvider> = {}): LlmProvider {
  return {
    name: 'fake',
    model: 'fake-model-v1',
    generateSuggestions: vi.fn().mockResolvedValue(generated),
    ...overrides,
  };
}

const options = { llmTimeoutMs: 1000, cacheTtlMs: 60_000 };

describe('SuggestMessagesUseCase', () => {
  it('returns suggestions produced by the provider', async () => {
    const useCase = new SuggestMessagesUseCase(fakeProvider(), new NoOpSuggestionCache(), options);

    const result = await useCase.execute(input);

    expect(result.suggestions).toEqual(generated);
    expect(result.source).toBe('llm');
    expect(result.model).toBe('fake-model-v1');
    expect(result.degraded).toBe(false);
    expect(result.cached).toBe(false);
  });

  it('serves a second identical request from the cache', async () => {
    const provider = fakeProvider();
    const useCase = new SuggestMessagesUseCase(
      provider,
      new InMemorySuggestionCache({ maxEntries: 10 }),
      options,
    );

    await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(second.cached).toBe(true);
    expect(second.suggestions).toEqual(generated);
    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
  });

  it('calls the provider again when the request differs', async () => {
    const provider = fakeProvider();
    const useCase = new SuggestMessagesUseCase(
      provider,
      new InMemorySuggestionCache({ maxEntries: 10 }),
      options,
    );

    await useCase.execute(input);
    await useCase.execute({ ...input, occasion: 'wedding' });

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(2);
  });

  it('passes an AbortSignal to the provider', async () => {
    const generateSuggestions = vi.fn().mockResolvedValue(generated);
    const useCase = new SuggestMessagesUseCase(
      fakeProvider({ generateSuggestions }),
      new NoOpSuggestionCache(),
      options,
    );

    await useCase.execute(input);

    expect(generateSuggestions).toHaveBeenCalledWith(input, expect.any(AbortSignal));
  });

  // Phase 04 turns this into a fallback. For now it must at least not be
  // swallowed: an unhandled provider error has to reach the caller.
  it('propagates a provider failure', async () => {
    const useCase = new SuggestMessagesUseCase(
      fakeProvider({ generateSuggestions: vi.fn().mockRejectedValue(new Error('boom')) }),
      new NoOpSuggestionCache(),
      options,
    );

    await expect(useCase.execute(input)).rejects.toThrow('boom');
  });
});
