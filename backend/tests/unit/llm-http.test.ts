import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LlmAuthError,
  LlmInvalidResponseError,
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
} from '../../src/domain/errors/index.js';
import { postJson } from '../../src/infra/llm/http/llm-http.js';

const call = () =>
  postJson({
    url: 'https://provider.test/v1/chat',
    headers: { Authorization: 'Bearer test-key' },
    body: { hello: 'world' },
    signal: new AbortController().signal,
    providerName: 'testprovider',
  });

/** Typed with fetch's own signature so captured-request assertions type-check. */
function mockFetch(respond: () => Promise<Response> | Response) {
  const spy = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(respond()));
  vi.stubGlobal('fetch', spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postJson — success', () => {
  it('returns the parsed body', async () => {
    mockFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(call()).resolves.toEqual({ ok: true });
  });

  it('sends the credential in the Authorization header, not the URL', async () => {
    const spy = mockFetch(() => new Response('{}', { status: 200 }));

    await call();

    const [url, init] = spy.mock.calls[0]!;
    expect(url).not.toContain('test-key');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
  });
});

/**
 * The mapping table that turns provider failures into domain errors. Every
 * one of these degrades to the fallback rather than reaching the client.
 */
describe('postJson — status mapping', () => {
  const cases: Array<[number, unknown]> = [
    [401, LlmAuthError],
    [403, LlmAuthError],
    [429, LlmRateLimitError],
    [408, LlmTimeoutError],
    [504, LlmTimeoutError],
    [500, LlmUnavailableError],
    [502, LlmUnavailableError],
    [503, LlmUnavailableError],
    [400, LlmUnavailableError],
    [404, LlmUnavailableError],
  ];

  it.each(cases)('maps HTTP %i to the right domain error', async (status, expected) => {
    mockFetch(() => new Response('{}', { status }));
    await expect(call()).rejects.toBeInstanceOf(expected as never);
  });

  it('never leaks the credential into the error message', async () => {
    mockFetch(() => new Response('{}', { status: 401 }));
    await expect(call()).rejects.toThrow(/^(?!.*test-key).*$/);
  });
});

describe('postJson — transport failures', () => {
  it('maps an abort to a timeout, not a provider fault', async () => {
    mockFetch(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(call()).rejects.toBeInstanceOf(LlmTimeoutError);
  });

  it('maps a network failure to unavailable', async () => {
    mockFetch(() => Promise.reject(new TypeError('fetch failed')));
    await expect(call()).rejects.toBeInstanceOf(LlmUnavailableError);
  });

  it('maps a non-JSON success body to an invalid response', async () => {
    mockFetch(() => new Response('<html>maintenance</html>', { status: 200 }));
    await expect(call()).rejects.toBeInstanceOf(LlmInvalidResponseError);
  });
});
