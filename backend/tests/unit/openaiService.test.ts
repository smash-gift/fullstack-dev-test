import {
  createOpenAiService,
  FALLBACK_MESSAGES,
  type OpenAiChatClient,
  type ChatCompletionResult,
} from '../../src/services/openaiService';

function makeClientReturning(content: string): OpenAiChatClient {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content } }],
        } as ChatCompletionResult),
      },
    },
  };
}

interface DeferredClient {
  client: OpenAiChatClient;
  resolve: (content: string) => void;
  reject: (err: unknown) => void;
}

function makeDeferredClient(): DeferredClient {
  let resolveFn!: (value: ChatCompletionResult) => void;
  let rejectFn!: (err: unknown) => void;
  const pending = new Promise<ChatCompletionResult>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  const create = jest.fn().mockReturnValue(pending);
  const client: OpenAiChatClient = { chat: { completions: { create } } };

  return {
    client,
    resolve: (content: string) =>
      resolveFn({ choices: [{ message: { content } }] }),
    reject: (err: unknown) => rejectFn(err),
  };
}

describe('openaiService.generateMessages', () => {
  it('returns 3 messages parsed from a valid OpenAI JSON response', async () => {
    const client = makeClientReturning(
      JSON.stringify({ messages: ['msg one', 'msg two', 'msg three'] }),
    );
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({
      messages: ['msg one', 'msg two', 'msg three'],
      cached: false,
      fallback: false,
    });
  });

  it('calls the OpenAI client with the configured model and json response format', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5-mini',
        response_format: { type: 'json_object' },
        messages: expect.any(Array),
      }),
    );
  });

  it('includes occasion and relationship in the prompt sent to OpenAI', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    const create = client.chat.completions.create as jest.Mock;
    const callArgs = create.mock.calls[0][0];
    const promptText = callArgs.messages.map((m: { content: string }) => m.content).join('\n');

    expect(promptText).toContain('birthday');
    expect(promptText).toContain('mother');
  });

  it('instructs the model to treat occasion/relationship as free-form user data, not commands', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    const create = client.chat.completions.create as jest.Mock;
    const callArgs = create.mock.calls[0][0];
    const systemPrompt = callArgs.messages.find((m: { role: string }) => m.role === 'system').content;

    expect(systemPrompt).toContain('free-form');
    expect(systemPrompt.toLowerCase()).toContain('ignore');
  });

  it('passes max_completion_tokens to the OpenAI client, defaulting to 600', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 600 }),
    );
  });

  it('passes reasoning_effort "minimal" to the OpenAI client on every call', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ reasoning_effort: 'minimal' }),
    );
  });

  it('passes a configured max_completion_tokens override to the OpenAI client', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', maxOutputTokens: 250 });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 250 }),
    );
  });

  it('instructs the model to vary the tone across the 3 messages', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    const create = client.chat.completions.create as jest.Mock;
    const callArgs = create.mock.calls[0][0];
    const systemPrompt = callArgs.messages.find((m: { role: string }) => m.role === 'system').content;

    expect(systemPrompt.toLowerCase()).toContain('tone');
    expect(systemPrompt.toLowerCase()).toContain('formal');
  });

  it('returns the fixed fallback messages when the client call fails on every retry attempt', async () => {
    const create = jest.fn().mockRejectedValue(new Error('network down'));
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
    // 1 initial attempt + 2 retries (retryDelaysMs has 2 entries) = 3 total calls.
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('returns the fixed fallback messages when content is not valid JSON', async () => {
    const client = makeClientReturning('not json at all');
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
  });

  it('returns the fixed fallback messages when messages is not an array of 3 strings', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['only one'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
  });

  it('returns the fixed fallback messages when a message entry is empty', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', '', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result.fallback).toBe(true);
  });
});

describe('openaiService.generateMessages retry on transient OpenAI failures', () => {
  it('retries after a transient failure and succeeds once the client call eventually succeeds', async () => {
    const create = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ messages: ['a', 'b', 'c'] }) } }],
      } as ChatCompletionResult);
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting all retry attempts and returns a fallback result (never rejects)', async () => {
    const create = jest.fn().mockRejectedValue(new Error('still down'));
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('does not retry on a parsing failure (invalid JSON), since that is not an upstream call failure', async () => {
    const client = makeClientReturning('not json at all');
    const create = client.chat.completions.create as jest.Mock;
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result.fallback).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('shares a single retry sequence between concurrent deduplicated calls (retry does not break dedup)', async () => {
    const create = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ messages: ['a', 'b', 'c'] }) } }],
      } as ChatCompletionResult);
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0] });

    const [r1, r2] = await Promise.all([
      service.generateMessages({ occasion: 'birthday', relationship: 'mother' }),
      service.generateMessages({ occasion: 'birthday', relationship: 'mother' }),
    ]);

    expect(r1).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    expect(r2).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    // Only ONE retry sequence (1 failed attempt + 1 successful retry = 2 calls
    // total), shared by both concurrent callers -- not 4, which is what would
    // happen if each caller triggered its own independent retry sequence.
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe('openaiService.generateMessages deduplication of in-flight calls', () => {
  it('deduplicates concurrent calls with the same normalized occasion/relationship into a single OpenAI call', async () => {
    const { client, resolve } = makeDeferredClient();
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    const p1 = service.generateMessages({ occasion: 'Birthday', relationship: '  Mother ' });
    const p2 = service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    resolve(JSON.stringify({ messages: ['a', 'b', 'c'] }));

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    expect(r2).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
  });

  it('shares the same fallback result between concurrent callers and shares a single retry sequence', async () => {
    const { client, reject } = makeDeferredClient();
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const p1 = service.generateMessages({ occasion: 'birthday', relationship: 'mother' });
    const p2 = service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    reject(new Error('network down'));

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
    expect(r2).toEqual({ messages: FALLBACK_MESSAGES, cached: false, fallback: true });
    // 1 initial attempt + 2 retries = 3 calls total, shared by both callers
    // (not 6 -- proves retry runs inside the deduplicated unit, not per-caller).
    expect(client.chat.completions.create).toHaveBeenCalledTimes(3);
  });

  it('does NOT deduplicate sequential calls (proves this is not a time-based cache)', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });
    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('clears the in-flight entry after a failure too, so a later call triggers a real new request', async () => {
    const create = jest
      .fn()
      // All 3 attempts of the FIRST generateMessages call fail (1 initial + 2 retries)...
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new Error('network down'))
      // ...and the SECOND, independent generateMessages call succeeds on its first attempt.
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ messages: ['a', 'b', 'c'] }) } }],
      } as ChatCompletionResult);
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', retryDelaysMs: [0, 0] });

    const firstResult = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });
    expect(firstResult.fallback).toBe(true);

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('never shares the in-flight call between concurrent requests with different normalized input', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await Promise.all([
      service.generateMessages({ occasion: 'birthday', relationship: 'mother' }),
      service.generateMessages({ occasion: 'birthday', relationship: 'father' }),
    ]);

    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });
});

describe('openaiService.generateMessages cache', () => {
  function makeFakeCache(initial: Record<string, string[]> = {}) {
    const store = { ...initial };
    const setCalls: Array<{ key: string; messages: string[] }> = [];
    return {
      cache: {
        get: async (key: string) => store[key] ?? null,
        set: async (key: string, entry: { messages: string[] }) => {
          store[key] = entry.messages;
          setCalls.push({ key, messages: entry.messages });
        },
      },
      setCalls,
    };
  }

  it('returns a cache hit without calling the OpenAI client', async () => {
    const key = JSON.stringify(['birthday', 'mother']);
    const { cache } = makeFakeCache({ [key]: ['cached one', 'cached two', 'cached three'] });
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({
      messages: ['cached one', 'cached two', 'cached three'],
      cached: true,
      fallback: false,
    });
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it('writes a successful generation to the cache and reports cached:false', async () => {
    const { cache, setCalls } = makeFakeCache();
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
    await Promise.resolve();
    expect(setCalls).toEqual([
      { key: JSON.stringify(['birthday', 'mother']), messages: ['a', 'b', 'c'] },
    ]);
  });

  it('treats a cache read failure as a miss and still returns a live generation', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const cache = {
      get: async () => {
        throw new Error('firestore unavailable');
      },
      set: async () => {},
    };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
  });

  it('does not fail the request when the cache write fails', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const cache = {
      get: async () => null,
      set: async () => {
        throw new Error('firestore write failed');
      },
    };
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result).toEqual({ messages: ['a', 'b', 'c'], cached: false, fallback: false });
  });

  it('does not write a fallback result to the cache', async () => {
    const create = jest.fn().mockRejectedValue(new Error('network down'));
    const client: OpenAiChatClient = { chat: { completions: { create } } };
    const { cache, setCalls } = makeFakeCache();
    const service = createOpenAiService(client, {
      model: 'gpt-5-mini',
      retryDelaysMs: [0, 0],
      cache,
    });

    const result = await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    expect(result.fallback).toBe(true);
    await Promise.resolve();
    expect(setCalls).toEqual([]);
  });

  it('defaults to a no-op cache (always miss) when none is provided', async () => {
    const client = makeClientReturning(JSON.stringify({ messages: ['a', 'b', 'c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini' });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });
    await service.generateMessages({ occasion: 'birthday', relationship: 'mother' });

    // No cache configured -> in-flight dedup doesn't apply across sequential
    // calls -> both hit the OpenAI client for real.
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('bypasses a cache hit and calls the OpenAI client when regenerate is true', async () => {
    const key = JSON.stringify(['birthday', 'mother']);
    const { cache } = makeFakeCache({ [key]: ['cached one', 'cached two', 'cached three'] });
    const client = makeClientReturning(JSON.stringify({ messages: ['fresh a', 'fresh b', 'fresh c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: true,
    });

    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      messages: ['fresh a', 'fresh b', 'fresh c'],
      cached: false,
      fallback: false,
    });
  });

  it('still writes the regenerated result to the cache when regenerate is true', async () => {
    const key = JSON.stringify(['birthday', 'mother']);
    const { cache, setCalls } = makeFakeCache({ [key]: ['cached one', 'cached two', 'cached three'] });
    const client = makeClientReturning(JSON.stringify({ messages: ['fresh a', 'fresh b', 'fresh c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    await service.generateMessages({ occasion: 'birthday', relationship: 'mother', regenerate: true });
    await Promise.resolve();

    expect(setCalls).toEqual([
      { key, messages: ['fresh a', 'fresh b', 'fresh c'] },
    ]);
  });

  it('still returns a cache hit when regenerate is false and a cache entry is present', async () => {
    const key = JSON.stringify(['birthday', 'mother']);
    const { cache } = makeFakeCache({ [key]: ['cached one', 'cached two', 'cached three'] });
    const client = makeClientReturning(JSON.stringify({ messages: ['fresh a', 'fresh b', 'fresh c'] }));
    const service = createOpenAiService(client, { model: 'gpt-5-mini', cache });

    const result = await service.generateMessages({
      occasion: 'birthday',
      relationship: 'mother',
      regenerate: false,
    });

    expect(client.chat.completions.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      messages: ['cached one', 'cached two', 'cached three'],
      cached: true,
      fallback: false,
    });
  });
});
