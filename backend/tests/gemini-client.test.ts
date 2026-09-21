import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  GoogleGenAI: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: mocks.GoogleGenAI,
}));

import { GeminiClient, createGeminiClient } from '../src/llm/gemini-client.js';

describe('Gemini client', () => {
  beforeEach(() => {
    mocks.generateContent.mockReset();
    mocks.GoogleGenAI.mockImplementation(() => ({
      models: { generateContent: mocks.generateContent },
    }));
  });

  it('parses the structured suggestions returned by Gemini', async () => {
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({ suggestions: ['Mensagem 1', 'Mensagem 2'] }),
    });

    const client = new GeminiClient('test-key', 'gemini-flash-lite-latest', 1000);
    await expect(
      client.generateSuggestions({ occasion: 'aniversário', relationship: 'amiga' }),
    ).resolves.toEqual(['Mensagem 1', 'Mensagem 2']);

    expect(mocks.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-flash-lite-latest',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
          maxOutputTokens: 300,
        }),
      }),
    );
  });

  it('rejects a provider response that violates the application contract', async () => {
    mocks.generateContent.mockResolvedValue({
      text: JSON.stringify({ suggestions: [''] }),
    });

    const client = new GeminiClient('test-key', 'gemini-flash-lite-latest', 1000);
    await expect(
      client.generateSuggestions({ occasion: 'aniversário', relationship: 'amiga' }),
    ).rejects.toThrow();
  });

  it('does not create a client without a key', () => {
    expect(
      createGeminiClient({ model: 'gemini-flash-lite-latest', timeoutMs: 1000 }),
    ).toBeUndefined();
  });
});
