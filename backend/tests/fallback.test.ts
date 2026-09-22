import { describe, expect, it } from 'vitest';
import { SuggestMessages } from '../src/application/suggest-messages.js';
import { UpstreamFailure } from '../src/domain/errors.js';
import { StaticFallbackCatalog } from '../src/infra/fallback-catalog.js';
import {
  StubLlmProvider,
  failingProvider,
  requestOf,
  silentLogger,
  succeedingProvider,
} from './helpers.js';

function useCaseWith(provider: StubLlmProvider): SuggestMessages {
  return new SuggestMessages({
    provider,
    fallback: new StaticFallbackCatalog(),
    cache: null,
    budget: { tryConsume: () => true },
    logger: silentLogger,
    timeoutMs: 50,
  });
}

describe('SuggestMessages fallback path', () => {
  it('should serve the fallback catalog when the model times out', async () => {
    const useCase = useCaseWith(failingProvider(new UpstreamFailure('timeout', 'timed out')));

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(result.source).toBe('fallback');
    expect(result.degradedReason).toBe('timeout');
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions.every((item) => item.text.length > 0)).toBe(true);
  });

  it('should serve the fallback catalog when the model is rate limited', async () => {
    const useCase = useCaseWith(failingProvider(new UpstreamFailure('rate_limited', '429')));

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(result.source).toBe('fallback');
    expect(result.degradedReason).toBe('rate_limited');
  });

  it('should serve the fallback catalog when the provider throws an unexpected error', async () => {
    const useCase = useCaseWith(failingProvider(new Error('socket hang up')));

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(result.source).toBe('fallback');
    expect(result.degradedReason).toBe('upstream_error');
  });

  it('should never call the model when no api key is configured', async () => {
    const provider = new StubLlmProvider(async () => {
      throw new Error('should not be reached');
    }, false);
    const useCase = useCaseWith(provider);

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(provider.calls).toBe(0);
    expect(result.source).toBe('fallback');
    expect(result.degradedReason).toBe('not_configured');
  });

  it('should stop calling the model once the daily budget is spent', async () => {
    const provider = succeedingProvider();
    const useCase = new SuggestMessages({
      provider,
      fallback: new StaticFallbackCatalog(),
      cache: null,
      budget: { tryConsume: () => false },
      logger: silentLogger,
      timeoutMs: 50,
    });

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(provider.calls).toBe(0);
    expect(result.degradedReason).toBe('budget_exhausted');
  });

  it('should return localised fallback messages', async () => {
    const useCase = useCaseWith(failingProvider(new UpstreamFailure('upstream_error', 'boom')));

    const result = await useCase.execute(requestOf({ locale: 'pt-BR' }), 'req_test');

    expect(result.suggestions[0]?.text).toContain('anivers');
  });

  it('should return model suggestions when the model succeeds', async () => {
    const useCase = useCaseWith(succeedingProvider());

    const result = await useCase.execute(requestOf(), 'req_test');

    expect(result.source).toBe('llm');
    expect(result.degradedReason).toBeUndefined();
    expect(result.suggestions.map((item) => item.text)).toEqual(['One.', 'Two.', 'Three.']);
  });
});
