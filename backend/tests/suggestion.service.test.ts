import { SuggestionService } from '../src/services/suggestion.service';
import { LlmError, LlmProvider } from '../src/llm/llm.provider';
import { SuggestionRequest } from '../src/types';

const request: SuggestionRequest = { occasion: 'Birthday', relationship: 'Friend' };

/** A provider we fully control, so no network is ever touched. */
function providerReturning(suggestions: string[]): LlmProvider {
  return { name: 'mock', generateSuggestions: jest.fn(async () => suggestions) };
}

function providerThrowing(err: unknown): LlmProvider {
  return {
    name: 'mock',
    generateSuggestions: jest.fn(async () => {
      throw err;
    }),
  };
}

describe('SuggestionService', () => {
  describe('fallback path (the priority)', () => {
    it.each([
      new LlmError('timeout', 'timed out'),
      new LlmError('rate_limited', '429'),
      new LlmError('upstream', '503'),
      new LlmError('invalid_output', 'bad json'),
      new Error('totally unexpected'),
    ])('serves the static fallback and marks degraded when the LLM fails (%s)', async (err) => {
      const service = new SuggestionService(providerThrowing(err));

      const result = await service.getSuggestions(request);

      expect(result.source).toBe('fallback');
      expect(result.degraded).toBe(true);
      expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(result.suggestions.length).toBeLessThanOrEqual(3);
      result.suggestions.forEach((s) => expect(typeof s).toBe('string'));
    });

    it('never rethrows the raw LLM error to the caller', async () => {
      const service = new SuggestionService(providerThrowing(new Error('secret internal detail')));
      await expect(service.getSuggestions(request)).resolves.toBeDefined();
    });
  });

  describe('happy path', () => {
    it('returns LLM suggestions when the provider succeeds', async () => {
      const llmOut = ['Happy birthday, my friend!', 'Wishing you a wonderful year ahead.'];
      const service = new SuggestionService(providerReturning(llmOut));

      const result = await service.getSuggestions(request);

      expect(result.source).toBe('llm');
      expect(result.degraded).toBe(false);
      expect(result.suggestions).toEqual(llmOut);
    });
  });

  describe('caching', () => {
    it('returns cache on the second identical call and only hits the LLM once', async () => {
      // Re-import config with caching ON for just this test.
      jest.resetModules();
      process.env.CACHE_TTL_MS = '60000';
      const { SuggestionService: FreshService } =
        await import('../src/services/suggestion.service');

      const provider = providerReturning(['One suggestion.', 'Another suggestion.']);
      const service = new FreshService(provider);

      const first = await service.getSuggestions(request);
      const second = await service.getSuggestions(request);

      expect(first.source).toBe('llm');
      expect(second.source).toBe('cache');
      expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);

      process.env.CACHE_TTL_MS = '0';
      jest.resetModules();
    });
  });
});
