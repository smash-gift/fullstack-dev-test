import { describe, expect, it, vi } from 'vitest';
import { createSuggestionService } from '../src/suggestion-service.js';

describe('suggestion service', () => {
  it('returns a safe fallback when the LLM fails', async () => {
    const logger = { warn: vi.fn() };
    const llmClient = {
      generateSuggestions: vi.fn().mockRejectedValue(new Error('provider unavailable')),
    };

    const service = createSuggestionService(llmClient, logger);
    const result = await service.suggest({ occasion: 'aniversário', relationship: 'amiga' });

    expect(result.fallback).toBe(true);
    expect(result.source).toBe('fallback');
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions.join(' ')).not.toContain('provider unavailable');
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('returns the provider suggestions on success', async () => {
    const llmClient = {
      generateSuggestions: vi.fn().mockResolvedValue(['Mensagem 1', 'Mensagem 2']),
    };

    const service = createSuggestionService(llmClient);
    await expect(
      service.suggest({ occasion: 'casamento', relationship: 'amigo' }),
    ).resolves.toEqual({
      suggestions: ['Mensagem 1', 'Mensagem 2'],
      source: 'llm',
      fallback: false,
    });
  });
});
