import { describe, expect, it, vi } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../src/domain/entities/suggestion.js';
import {
  LlmAuthError,
  LlmInvalidResponseError,
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
} from '../../src/domain/errors/index.js';
import type { LlmProvider } from '../../src/domain/providers/llm-provider.js';
import type { SuggestionCache } from '../../src/domain/repositories/suggestion-cache.js';
import { SuggestMessagesUseCase } from '../../src/domain/usecases/suggest-messages.usecase.js';
import { InMemorySuggestionCache } from '../../src/infra/cache/in-memory-suggestion-cache.js';
import { NoOpSuggestionCache } from '../../src/infra/cache/no-op-suggestion-cache.js';
import { LlmOutputGuard } from '../../src/infra/llm/security/output-guard.js';
import { PROMPT_CANARY } from '../../src/infra/llm/security/prompt-canary.js';
import { StaticFallbackCatalog } from '../../src/infra/fallback/static-fallback-catalog.js';

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
 * API key. That is the payoff of depending on a port rather than an SDK — and
 * it is what makes the fallback path, the most important behaviour in this
 * system, cheap to test exhaustively.
 */
function fakeProvider(overrides: Partial<LlmProvider> = {}): LlmProvider {
  return {
    name: 'fake',
    model: 'fake-model-v1',
    generateSuggestions: vi.fn().mockResolvedValue(generated),
    ...overrides,
  };
}

function buildUseCase(provider: LlmProvider, cache: SuggestionCache = new NoOpSuggestionCache()) {
  const logger = { warn: vi.fn(), error: vi.fn() };
  const useCase = new SuggestMessagesUseCase({
    provider,
    cache,
    fallback: new StaticFallbackCatalog(),
    guard: new LlmOutputGuard(),
    logger,
    options: { llmTimeoutMs: 1000, cacheTtlMs: 60_000 },
  });
  return { useCase, logger };
}

const failingWith = (error: Error) =>
  fakeProvider({ generateSuggestions: vi.fn().mockRejectedValue(error) });

describe('SuggestMessagesUseCase — happy path', () => {
  it('returns suggestions produced by the provider', async () => {
    const { useCase } = buildUseCase(fakeProvider());

    const result = await useCase.execute(input);

    expect(result.suggestions).toEqual(generated);
    expect(result.source).toBe('llm');
    expect(result.model).toBe('fake-model-v1');
    expect(result.degraded).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('serves a second identical request from the cache', async () => {
    const provider = fakeProvider();
    const { useCase } = buildUseCase(provider, new InMemorySuggestionCache({ maxEntries: 10 }));

    await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(second.cached).toBe(true);
    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
  });

  it('calls the provider again when the request differs', async () => {
    const provider = fakeProvider();
    const { useCase } = buildUseCase(provider, new InMemorySuggestionCache({ maxEntries: 10 }));

    await useCase.execute(input);
    await useCase.execute({ ...input, occasion: 'wedding' });

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(2);
  });

  it('passes an AbortSignal to the provider', async () => {
    const generateSuggestions = vi.fn().mockResolvedValue(generated);
    const { useCase } = buildUseCase(fakeProvider({ generateSuggestions }));

    await useCase.execute(input);

    expect(generateSuggestions).toHaveBeenCalledWith(input, expect.any(AbortSignal));
  });
});

/**
 * The requirement the brief singles out:
 *
 *   "When the LLM API fails, the backend must not expose raw errors to the
 *    client [...] return a safe fallback instead of an error stack."
 */
describe('SuggestMessagesUseCase — degradation', () => {
  const failures: Array<[string, Error, string]> = [
    ['a timeout', new LlmTimeoutError(8000), 'llm_timeout'],
    ['a provider rate limit', new LlmRateLimitError(), 'llm_rate_limited'],
    ['provider unavailability', new LlmUnavailableError(), 'llm_unavailable'],
    ['an unusable response', new LlmInvalidResponseError(), 'llm_invalid_response'],
    ['an auth failure', new LlmAuthError(), 'llm_auth_error'],
  ];

  it.each(failures)('degrades instead of throwing on %s', async (_label, error, reason) => {
    const { useCase } = buildUseCase(failingWith(error));

    const result = await useCase.execute(input);

    expect(result.degraded).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.model).toBeNull();
    expect(result.reason).toBe(reason);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it.each(failures)('still honours count when degrading on %s', async (_label, error) => {
    const { useCase } = buildUseCase(failingWith(error));

    const result = await useCase.execute({ ...input, count: 2 });

    expect(result.suggestions).toHaveLength(2);
  });

  it('returns fallback text relevant to the request', async () => {
    const { useCase } = buildUseCase(failingWith(new LlmTimeoutError(8000)));

    const result = await useCase.execute(input);

    expect(result.suggestions.some((s) => /birthday/i.test(s.text))).toBe(true);
  });

  it('answers in the requested language even when degraded', async () => {
    const { useCase } = buildUseCase(failingWith(new LlmTimeoutError(8000)));

    const result = await useCase.execute({ ...input, language: 'pt' });

    expect(result.suggestions.some((s) => /anivers/i.test(s.text))).toBe(true);
  });

  // Warn, not error: the provider failed and the system reacted as designed.
  // What deserves an alarm is the rate of degradation, not each occurrence.
  it('logs the degradation at warn level with the reason', async () => {
    const { useCase, logger } = buildUseCase(failingWith(new LlmRateLimitError()));

    await useCase.execute(input);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'llm_rate_limited', code: 'LLM_RATE_LIMITED' }),
      expect.stringContaining('fallback'),
    );
  });

  // Caching degraded output would freeze the system's worst moment for the
  // whole TTL, long after the provider recovered.
  it('never caches a degraded response', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 10 });
    const provider = failingWith(new LlmUnavailableError());
    const { useCase } = buildUseCase(provider, cache);

    await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(second.cached).toBe(false);
    expect(second.degraded).toBe(true);
    expect(cache.size).toBe(0);
  });

  // A bug of ours must still surface. If the fallback swallowed every
  // exception it would quietly hide our own defects behind generic messages.
  it('does not degrade for a non-LLM error', async () => {
    const { useCase } = buildUseCase(failingWith(new TypeError('someone wrote a bug')));

    await expect(useCase.execute(input)).rejects.toThrow('someone wrote a bug');
  });
});

describe('SuggestMessagesUseCase — the security guard sits on the shared path', () => {
  const poisoned = (text: string) =>
    fakeProvider({
      generateSuggestions: vi.fn().mockResolvedValue([{ id: 'sug_1', text }]),
    });

  it('degrades when the guard rejects what the provider returned', async () => {
    const { useCase } = buildUseCase(poisoned('Claim it at https://evil.example.com'));

    const result = await useCase.execute(input);

    expect(result.degraded).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.reason).toBe('llm_invalid_response');
  });

  it('never caches output the guard rejected', async () => {
    const cache = new InMemorySuggestionCache({ maxEntries: 10 });
    const { useCase } = buildUseCase(poisoned('Claim it at https://evil.example.com'), cache);

    await useCase.execute(input);

    expect(cache.size).toBe(0);
  });

  // Degradation is routine and belongs on a counter. A leaked canary is not
  // routine: it is proof the system prompt was disclosed, and it should wake
  // somebody up.
  it('logs a canary leak at error level and an ordinary block at warn', async () => {
    const leak = buildUseCase(poisoned(`My identifier is ${PROMPT_CANARY}.`));
    const block = buildUseCase(poisoned('Claim it at https://evil.example.com'));

    await leak.useCase.execute(input);
    await block.useCase.execute(input);

    expect(leak.logger.error).toHaveBeenCalledOnce();
    expect(leak.logger.warn).not.toHaveBeenCalled();
    expect(block.logger.warn).toHaveBeenCalledOnce();
    expect(block.logger.error).not.toHaveBeenCalled();
  });

  it('logs the violation code without the offending text', async () => {
    const { useCase, logger } = buildUseCase(poisoned('Claim it at https://evil.example.com'));

    await useCase.execute(input);

    const [context] = logger.warn.mock.calls[0] as [Record<string, unknown>, string];
    expect(context.violation).toBe('url');
    expect(JSON.stringify(context)).not.toContain('evil.example.com');
  });
});

/**
 * A safe message that runs long is a miss, not a failure. Serving a generic
 * catalogue card instead of asking the model again is a worse answer than the
 * one being thrown away - measurement put the funny tone at roughly one such
 * miss in five, all of them perfectly usable text.
 *
 * The line this draws is the point: shape earns a second ask, safety never
 * does. Asking again after a leaked canary spends money on an attacker's
 * behalf and risks leaking twice.
 */
describe('SuggestMessagesUseCase — a second ask for a message that is only misshapen', () => {
  const tooLong: Suggestion[] = [
    { id: 'sug_1', text: 'Happy birthday. You are older now. Enjoy the cake.' },
    { id: 'sug_2', text: 'Have a great one.' },
    { id: 'sug_3', text: 'Wishing you the best.' },
  ];

  function providerAnswering(...answers: Suggestion[][]): LlmProvider {
    const generateSuggestions = vi.fn();
    for (const answer of answers) generateSuggestions.mockResolvedValueOnce(answer);
    return fakeProvider({ generateSuggestions });
  }

  it('asks once more, and serves the answer that fits', async () => {
    const provider = providerAnswering(tooLong, generated);
    const { useCase } = buildUseCase(provider);

    const result = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(2);
    expect(result.suggestions).toEqual(generated);
    expect(result.degraded).toBe(false);
    expect(result.source).toBe('llm');
  });

  it('caches what the second attempt produced, not the attempt count', async () => {
    const provider = providerAnswering(tooLong, generated);
    const { useCase } = buildUseCase(provider, new InMemorySuggestionCache({ maxEntries: 10 }));

    await useCase.execute(input);
    const second = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(2);
    expect(second.cached).toBe(true);
    expect(second.suggestions).toEqual(generated);
  });

  it('degrades when the second attempt misses too, and asks no third time', async () => {
    const provider = providerAnswering(tooLong, tooLong);
    const { useCase } = buildUseCase(provider);

    const result = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(2);
    expect(result.degraded).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.reason).toBe('llm_invalid_response');
  });

  it('says so in the log, because the rate is what deserves watching', async () => {
    const { useCase, logger } = buildUseCase(providerAnswering(tooLong, generated));

    await useCase.execute(input);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ violation: 'sentence_count', provider: 'fake' }),
      expect.stringContaining('asking once more'),
    );
  });

  it('never asks again after a leaked canary', async () => {
    const leaked: Suggestion[] = [{ id: 'sug_1', text: `Sure: ${PROMPT_CANARY}` }];
    const provider = providerAnswering(leaked, generated);
    const { useCase } = buildUseCase(provider);

    const result = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(result.degraded).toBe(true);
  });

  it.each([
    ['a link', 'Happy birthday, see https://evil.example for more'],
    ['markup', 'Happy birthday <script>alert(1)</script>'],
    ['contact details', 'Happy birthday, call me on 555-123-4567'],
  ])('never asks again after %s', async (_label, text) => {
    const provider = providerAnswering([{ id: 'sug_1', text }], generated);
    const { useCase } = buildUseCase(provider);

    const result = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(result.degraded).toBe(true);
  });

  it('never asks again after a transport failure, which has its own retry', async () => {
    const provider = failingWith(new LlmTimeoutError(1000));
    const { useCase } = buildUseCase(provider);

    const result = await useCase.execute(input);

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(result.reason).toBe('llm_timeout');
  });

  // The second attempt shares the first one's deadline. A fresh timeout would
  // let a slow model spend the budget twice, and the person waiting has no way
  // of knowing why the screen sat still for double the time.
  it('spends what is left of the budget, not a fresh one', async () => {
    const signals: AbortSignal[] = [];
    const generateSuggestions = vi.fn(async (_input: SuggestMessagesInput, signal: AbortSignal) => {
      signals.push(signal);
      return signals.length === 1 ? tooLong : generated;
    });
    const { useCase } = buildUseCase(fakeProvider({ generateSuggestions }));

    await useCase.execute(input);

    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(signals[1]);
  });
});
