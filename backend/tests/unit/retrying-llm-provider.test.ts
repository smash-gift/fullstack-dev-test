import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';

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
import { RetryingLlmProvider } from '../../src/infra/llm/resilience/retrying-llm.provider.js';

const input: SuggestMessagesInput = {
  occasion: 'birthday',
  relationship: 'friend',
  tone: 'warm',
  language: 'en',
  count: 2,
};

const generated: Suggestion[] = [
  { id: 'sug_1', text: 'One.' },
  { id: 'sug_2', text: 'Two.' },
];

const logger = pino({ level: 'silent' });

function wrap(generateSuggestions: LlmProvider['generateSuggestions'], maxRetries = 1) {
  const inner: LlmProvider = { name: 'inner', model: 'inner-v1', generateSuggestions };
  // random() fixed at 0 removes the jitter delay, so tests do not wait.
  return new RetryingLlmProvider(inner, {
    maxRetries,
    baseDelayMs: 300,
    logger,
    random: () => 0,
  });
}

const signal = () => new AbortController().signal;

describe('RetryingLlmProvider — transparency', () => {
  it('reports the wrapped provider name and model', () => {
    const provider = wrap(vi.fn().mockResolvedValue(generated));
    expect(provider.name).toBe('inner');
    expect(provider.model).toBe('inner-v1');
  });

  it('does not retry a successful call', async () => {
    const generate = vi.fn().mockResolvedValue(generated);

    await expect(wrap(generate).generateSuggestions(input, signal())).resolves.toEqual(generated);
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe('RetryingLlmProvider — what gets retried', () => {
  it('retries transient unavailability and succeeds on the second attempt', async () => {
    const generate = vi
      .fn()
      .mockRejectedValueOnce(new LlmUnavailableError('provider returned HTTP 503'))
      .mockResolvedValueOnce(generated);

    await expect(wrap(generate).generateSuggestions(input, signal())).resolves.toEqual(generated);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries and rethrows', async () => {
    const generate = vi.fn().mockRejectedValue(new LlmUnavailableError());

    await expect(wrap(generate, 1).generateSuggestions(input, signal())).rejects.toBeInstanceOf(
      LlmUnavailableError,
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('honours a higher retry budget', async () => {
    const generate = vi.fn().mockRejectedValue(new LlmUnavailableError());

    await expect(wrap(generate, 3).generateSuggestions(input, signal())).rejects.toThrow();
    expect(generate).toHaveBeenCalledTimes(4);
  });

  it('does not retry at all when the budget is zero', async () => {
    const generate = vi.fn().mockRejectedValue(new LlmUnavailableError());

    await expect(wrap(generate, 0).generateSuggestions(input, signal())).rejects.toThrow();
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

/**
 * The failures deliberately left alone. Retrying any of these either wastes
 * the user's time, spends money twice, or makes the upstream problem worse.
 */
describe('RetryingLlmProvider — what is never retried', () => {
  const noRetry: Array<[string, Error]> = [
    ['a timeout, because the budget is already spent', new LlmTimeoutError(8000)],
    ['a 429, because retrying into a rate limit worsens it', new LlmRateLimitError()],
    ['an auth error, because a wrong key stays wrong', new LlmAuthError()],
    ['an invalid response, because the prompt would repeat', new LlmInvalidResponseError()],
  ];

  it.each(noRetry)('does not retry %s', async (_label, error) => {
    const generate = vi.fn().mockRejectedValue(error);

    await expect(wrap(generate).generateSuggestions(input, signal())).rejects.toBe(error);
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe('RetryingLlmProvider — respects the time budget', () => {
  it('stops retrying once the signal is aborted', async () => {
    const controller = new AbortController();
    const generate = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(new LlmUnavailableError());
    });

    await expect(
      wrap(generate, 3).generateSuggestions(input, controller.signal),
    ).rejects.toBeInstanceOf(LlmUnavailableError);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not sleep past an abort', async () => {
    const controller = new AbortController();
    const generate = vi.fn().mockRejectedValue(new LlmUnavailableError());
    const provider = new RetryingLlmProvider(
      { name: 'inner', model: 'v1', generateSuggestions: generate },
      { maxRetries: 1, baseDelayMs: 60_000, logger, random: () => 1 },
    );

    const started = Date.now();
    const pending = provider.generateSuggestions(input, controller.signal);
    setTimeout(() => controller.abort(), 10);

    await expect(pending).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
