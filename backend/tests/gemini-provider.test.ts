import { describe, expect, it, vi } from 'vitest';
import { UpstreamFailure } from '../src/domain/errors.js';
import { GeminiProvider } from '../src/infra/gemini-provider.js';
import { requestOf } from './helpers.js';

function geminiResponse(suggestions: string[], status = 200): Response {
  const text = JSON.stringify({ suggestions });
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const threeMessages = [
  'Happy birthday! Wishing you a wonderful year ahead.',
  'Hope your day is full of laughter and cake.',
  'Another year wiser. Enjoy every minute of it!',
];

function providerWith(fetchImpl: typeof fetch, maxRetries = 1): GeminiProvider {
  return new GeminiProvider({ apiKey: 'test-key', model: 'test-model', maxRetries, fetchImpl });
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'none';
  } catch (error) {
    return error instanceof UpstreamFailure ? error.reason : 'not-upstream';
  }
}

describe('GeminiProvider', () => {
  it('should return guarded suggestions and send the key only as a header', async () => {
    const fetchImpl = vi.fn(async () => geminiResponse(threeMessages));
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const result = await provider.generate(requestOf(), new AbortController().signal);

    expect(result.suggestions.map((item) => item.text)).toEqual(threeMessages);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain('test-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
  });

  it('should not retry a status the provider will keep returning', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"error":"bad key"}', { status: 400 }));
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const reason = await reasonOf(provider.generate(requestOf(), new AbortController().signal));

    expect(reason).toBe('upstream_error');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('should retry once on a server error and then give up', async () => {
    const fetchImpl = vi.fn(async () => new Response('oops', { status: 503 }));
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const reason = await reasonOf(provider.generate(requestOf(), new AbortController().signal));

    expect(reason).toBe('upstream_error');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('should report rate limiting when the provider keeps answering 429', async () => {
    const fetchImpl = vi.fn(async () => new Response('slow down', { status: 429 }));
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const reason = await reasonOf(provider.generate(requestOf(), new AbortController().signal));

    expect(reason).toBe('rate_limited');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('should succeed on the retry after a transient failure', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('oops', { status: 500 }))
      .mockResolvedValueOnce(geminiResponse(threeMessages));
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const result = await provider.generate(requestOf(), new AbortController().signal);

    expect(result.suggestions).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('should report a timeout when the abort signal fires during the call', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => {
      controller.abort();
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    const provider = providerWith(fetchImpl as unknown as typeof fetch);

    const reason = await reasonOf(provider.generate(requestOf(), controller.signal));

    expect(reason).toBe('timeout');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('should discard output that echoes the per-call canary', async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as {
        systemInstruction: { parts: { text: string }[] };
      };
      const canary = /Session token: ([a-z0-9]+)\./.exec(
        body.systemInstruction.parts[0]!.text,
      )![1]!;
      return geminiResponse([
        `Happy birthday ${canary}, enjoy it.`,
        threeMessages[1]!,
        threeMessages[2]!,
      ]);
    });
    const provider = providerWith(fetchImpl as unknown as typeof fetch, 0);

    const reason = await reasonOf(provider.generate(requestOf(), new AbortController().signal));

    expect(reason).toBe('unsafe_output');
  });

  it('should report invalid output when the response carries no text part', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );
    const provider = providerWith(fetchImpl as unknown as typeof fetch, 0);

    const reason = await reasonOf(provider.generate(requestOf(), new AbortController().signal));

    expect(reason).toBe('invalid_output');
  });
});
