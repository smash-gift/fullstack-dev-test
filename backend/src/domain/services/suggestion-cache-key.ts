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
    // Spelled out rather than left to `join` turning undefined into "". A
    // request that pins a language and one that lets the text decide are
    // different requests and must not share an entry - otherwise the first
    // English answer would be served to the next Portuguese caller.
    input.language ?? 'auto',
    String(input.count),
  ].join('|');

  return createHash('sha1').update(normalized).digest('hex');
}
