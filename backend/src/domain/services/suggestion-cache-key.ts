import { createHash } from 'node:crypto';

import type { SuggestMessagesInput } from '../dtos/suggest-messages-input.dto.js';

/**
 * Identity of a suggestion request, for caching purposes.
 *
 * `provider` and `model` are part of the key: without them, switching
 * LLM_PROVIDER would keep serving the previous provider's results until the
 * TTL expired — a subtle bug that is hard to diagnose and easy to hit during
 * a demo.
 *
 * The values are hashed rather than concatenated so that user-typed text is
 * not held verbatim as a cache key.
 */
export function buildSuggestionCacheKey(
  provider: string,
  model: string,
  input: SuggestMessagesInput,
): string {
  const normalized = [
    provider,
    model,
    input.occasion.trim().toLowerCase(),
    input.relationship.trim().toLowerCase(),
    input.tone,
    input.language,
    String(input.count),
  ].join('|');

  return createHash('sha1').update(normalized).digest('hex');
}
