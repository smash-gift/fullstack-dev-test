import { callAI } from '../src/services/llm.service';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  jest.useRealTimers();
});

describe('callAI - provider routing', () => {
  it('throws for unsupported provider', async () => {
    await expect(callAI('prompt', 'unknown_provider')).rejects.toThrow(
      'Unsupported AI provider: unknown_provider',
    );
  });

  it('throws when GEMINI_API_KEY is not set', async () => {
    await expect(callAI('prompt', 'gemini')).rejects.toThrow(
      'GEMINI_API_KEY is not configured',
    );
  });

  it('throws when OPENAI_API_KEY is not set', async () => {
    await expect(callAI('prompt', 'openai')).rejects.toThrow(
      'OPENAI_API_KEY is not configured',
    );
  });

  it('throws on Gemini API HTTP 429 error', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    }) as unknown as typeof fetch;

    await expect(callAI('prompt', 'gemini')).rejects.toThrow('Gemini API error: 429');
  });

  it('throws on Gemini API HTTP 5xx error', async () => {
    process.env.GEMINI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    }) as unknown as typeof fetch;

    await expect(callAI('prompt', 'gemini')).rejects.toThrow('Gemini API error: 500');
  });

  it('throws on OpenAI API HTTP 429 error', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    }) as unknown as typeof fetch;

    await expect(callAI('prompt', 'openai')).rejects.toThrow('OpenAI API error: 429');
  });

  it('throws on OpenAI API HTTP 5xx error', async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    }) as unknown as typeof fetch;

    await expect(callAI('prompt', 'openai')).rejects.toThrow('OpenAI API error: 500');
  });

  it('aborts Gemini request after 10s timeout', async () => {
    jest.useFakeTimers();
    process.env.GEMINI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new Error('The operation was aborted')),
          );
        }),
    ) as unknown as typeof fetch;

    const promise = callAI('prompt', 'gemini');
    jest.advanceTimersByTime(11_000);

    await expect(promise).rejects.toThrow();
  });

  it('aborts OpenAI request after 10s timeout', async () => {
    jest.useFakeTimers();
    process.env.OPENAI_API_KEY = 'test-key';

    global.fetch = jest.fn().mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new Error('The operation was aborted')),
          );
        }),
    ) as unknown as typeof fetch;

    const promise = callAI('prompt', 'openai');
    jest.advanceTimersByTime(11_000);

    await expect(promise).rejects.toThrow();
  });
});
