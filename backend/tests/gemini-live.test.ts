import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { createGeminiClient } from '../src/llm/gemini-client.js';

const liveTestsEnabled = process.env.RUN_LIVE_GEMINI_TESTS === '1';
const describeLive = liveTestsEnabled ? describe : describe.skip;

describeLive('Gemini live contract', () => {
  it('returns usable suggestions from the configured real model', async () => {
    const client = createGeminiClient({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? 'gemini-flash-lite-latest',
      timeoutMs: 15_000,
    });

    expect(client).toBeDefined();
    const suggestions = await client!.generateSuggestions({
      occasion: 'aniversário',
      relationship: 'melhor amiga',
    });

    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(new Set(suggestions).size).toBe(suggestions.length);

    for (const suggestion of suggestions) {
      expect(suggestion.trim().length).toBeGreaterThan(0);
      expect(suggestion.length).toBeLessThanOrEqual(240);
    }
  }, 20_000);
});
