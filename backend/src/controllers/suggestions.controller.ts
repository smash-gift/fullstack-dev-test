import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { suggestionSchema } from '../schemas/suggestion.schema';
import { getSuggestions } from '../services/llm.service';
import { getFallbackMessages } from '../services/fallback.service';
import { InMemoryCache } from '../utils/cache';
import type { SuggestionResponse } from '../types';

export const cache = new InMemoryCache<string[]>();

export async function suggestMessages(req: Request, res: Response): Promise<void> {
  let occasion: string;
  let relationship: string;

  try {
    const parsed = suggestionSchema.parse(req.body);
    occasion = parsed.occasion;
    relationship = parsed.relationship;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Invalid input',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const cacheKey = `${occasion.toLowerCase()}:${relationship.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    const response: SuggestionResponse = { suggestions: cached, source: 'cache' };
    res.status(200).json(response);
    return;
  }

  try {
    const suggestions = await getSuggestions(occasion, relationship);
    cache.set(cacheKey, suggestions);
    const response: SuggestionResponse = { suggestions, source: 'llm' };
    res.status(200).json(response);
  } catch (error) {
    console.error('[LLM Error]', error instanceof Error ? error.message : String(error));
    const suggestions = getFallbackMessages(occasion);
    const response: SuggestionResponse = { suggestions, source: 'fallback' };
    res.status(200).json(response);
  }
}
