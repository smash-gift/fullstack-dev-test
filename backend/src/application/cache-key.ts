import { createHash } from 'node:crypto';
import type { SuggestionRequest } from '../domain/suggestion.js';

/**
 * Prompt version and model are part of the key so that changing either one
 * invalidates the pool instead of blending outputs from two different prompts.
 */
export function cacheKeyFor(
  request: SuggestionRequest,
  model: string,
  promptVersion: string,
): string {
  const parts = [promptVersion, model, request.locale, request.occasion, request.relationship];
  return createHash('sha256').update(parts.join('::')).digest('hex').slice(0, 32);
}
