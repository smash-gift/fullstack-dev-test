import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import { LlmInvalidResponseError } from '../../src/domain/errors/index.js';
import { GeminiProvider } from '../../src/infra/llm/gemini/gemini.provider.js';
import { OpenAiProvider } from '../../src/infra/llm/openai/openai.provider.js';
import { OpenRouterProvider } from '../../src/infra/llm/openrouter/openrouter.provider.js';
import { SUGGESTION_SYSTEM_PROMPT } from '../../src/infra/llm/prompt/suggestion-prompt.js';

const input: SuggestMessagesInput = {
  occasion: 'birthday',
  relationship: 'friend',
  tone: 'warm',
  language: 'en',
  count: 2,
};

const shared = { temperature: 0.8, maxOutputTokens: 400, apiKey: 'test-key' };

const openAi = new OpenAiProvider({ ...shared, model: 'gpt-4o-mini' });
const openRouter = new OpenRouterProvider({ ...shared, model: 'openai/gpt-4o-mini' });
const gemini = new GeminiProvider({ ...shared, model: 'gemini-3.8-flash' });

const suggestionsJson = JSON.stringify({ suggestions: ['Happy birthday!', 'Have a great one.'] });

const chatCompletion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

const geminiResponse = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
  });

/**
 * Typed with fetch's own signature so assertions on the captured request are
 * checked by the compiler rather than cast blindly.
 */
function mockFetch(respond: () => Response) {
  const spy = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(respond()));
  vi.stubGlobal('fetch', spy);
  return spy;
}

const signal = () => new AbortController().signal;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('all providers honour the same contract', () => {
  const providers = [
    ['openai', openAi, () => chatCompletion(suggestionsJson)] as const,
    ['openrouter', openRouter, () => chatCompletion(suggestionsJson)] as const,
    ['gemini', gemini, () => geminiResponse(suggestionsJson)] as const,
  ];

  it.each(providers)('%s returns parsed suggestions', async (_name, provider, response) => {
    mockFetch(response);

    const result = await provider.generateSuggestions(input, signal());

    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe('Happy birthday!');
    expect(result[0]?.id).toMatch(/^sug_/);
  });

  it.each(providers)('%s rejects an empty completion', async (_name, provider, _response) => {
    mockFetch(() => (provider.name === 'gemini' ? geminiResponse('') : chatCompletion('')));

    await expect(provider.generateSuggestions(input, signal())).rejects.toBeInstanceOf(
      LlmInvalidResponseError,
    );
  });

  it.each(providers)('%s rejects a payload with the wrong count', async (_name, provider, _r) => {
    const three = JSON.stringify({ suggestions: ['a', 'b', 'c'] });
    mockFetch(() => (provider.name === 'gemini' ? geminiResponse(three) : chatCompletion(three)));

    await expect(provider.generateSuggestions(input, signal())).rejects.toBeInstanceOf(
      LlmInvalidResponseError,
    );
  });

  // Same prompt across all three, so comparing models stays honest and the
  // difference between adapters is transport only.
  it.each(providers)('%s sends the shared system prompt', async (_name, provider, response) => {
    const spy = mockFetch(response);

    await provider.generateSuggestions(input, signal());

    const body = JSON.parse(spy.mock.calls[0]![1].body as string);
    const systemPrompt =
      body.systemInstruction?.parts?.[0]?.text ??
      body.messages?.find((m: { role: string }) => m.role === 'system')?.content;

    expect(systemPrompt).toBe(SUGGESTION_SYSTEM_PROMPT);
  });

  /**
   * The structural defence against prompt injection: user text travels as a
   * JSON value in the user message, never interpolated into the system prompt.
   */
  it.each(providers)('%s never puts user input in the system prompt', async (_n, provider, res) => {
    const spy = mockFetch(res);

    await provider.generateSuggestions({ ...input, occasion: 'INJECTED_MARKER' }, signal());

    const body = JSON.parse(spy.mock.calls[0]![1].body as string);
    const systemPrompt =
      body.systemInstruction?.parts?.[0]?.text ??
      body.messages?.find((m: { role: string }) => m.role === 'system')?.content;
    const userMessage =
      body.contents?.[0]?.parts?.[0]?.text ??
      body.messages?.find((m: { role: string }) => m.role === 'user')?.content;

    expect(systemPrompt).not.toContain('INJECTED_MARKER');
    expect(JSON.parse(userMessage).occasion).toBe('INJECTED_MARKER');
  });
});

describe('OpenAiProvider', () => {
  it('requests structured output constrained by a schema', async () => {
    const spy = mockFetch(() => chatCompletion(suggestionsJson));

    await openAi.generateSuggestions(input, signal());

    const [url, init] = spy.mock.calls[0]!;
    const body = JSON.parse(init.body as string);

    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.response_format.json_schema.strict).toBe(true);
  });

  it('reports its name and model', () => {
    expect(openAi.name).toBe('openai');
    expect(openAi.model).toBe('gpt-4o-mini');
  });
});

describe('OpenRouterProvider', () => {
  // The model is user-selected here, and not every model in the catalogue
  // supports schema-constrained decoding.
  it('requests json_object rather than a schema', async () => {
    const spy = mockFetch(() => chatCompletion(suggestionsJson));

    await openRouter.generateSuggestions(input, signal());

    const [url, init] = spy.mock.calls[0]!;
    const body = JSON.parse(init.body as string);

    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  // OpenRouter reads these two headers to attribute traffic on its dashboard.
  // They are optional on purpose — the factory sets them, a bare construction
  // does not — and both shapes have to leave a well-formed request.
  it('sends the attribution headers when they are configured', async () => {
    const spy = mockFetch(() => chatCompletion(suggestionsJson));
    const attributed = new OpenRouterProvider({
      ...shared,
      model: 'openai/gpt-4o-mini',
      appUrl: 'https://example.com/gift-cards',
      appTitle: 'Gift Card Message Suggester',
    });

    await attributed.generateSuggestions(input, signal());

    const headers = spy.mock.calls[0]![1].headers as Record<string, string>;

    expect(headers['HTTP-Referer']).toBe('https://example.com/gift-cards');
    expect(headers['X-Title']).toBe('Gift Card Message Suggester');
    expect(headers.Authorization).toBe('Bearer test-key');
  });

  it('omits them entirely when they are not', async () => {
    const spy = mockFetch(() => chatCompletion(suggestionsJson));

    await openRouter.generateSuggestions(input, signal());

    const headers = spy.mock.calls[0]![1].headers as Record<string, string>;

    expect(headers).not.toHaveProperty('HTTP-Referer');
    expect(headers).not.toHaveProperty('X-Title');
  });
});

describe('GeminiProvider', () => {
  it('sends the key in a header, never in the query string', async () => {
    const spy = mockFetch(() => geminiResponse(suggestionsJson));

    await gemini.generateSuggestions(input, signal());

    const [url, init] = spy.mock.calls[0]!;

    expect(url).not.toContain('test-key');
    expect(url).not.toContain('?key=');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
  });

  it('constrains the response with a schema', async () => {
    const spy = mockFetch(() => geminiResponse(suggestionsJson));

    await gemini.generateSuggestions(input, signal());

    const body = JSON.parse(spy.mock.calls[0]![1].body as string);

    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema.required).toEqual(['suggestions']);
  });

  // A safety block returns 200 with no parts: the call succeeded, the content
  // did not. That has to degrade, not crash.
  it('rejects a safety-blocked candidate', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ candidates: [{ finishReason: 'SAFETY' }] }), { status: 200 }),
    );

    await expect(gemini.generateSuggestions(input, signal())).rejects.toThrow(/SAFETY/);
  });
});
