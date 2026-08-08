import { createHash } from 'node:crypto';

import type { SuggestionRequest } from './types';

/**
 * Builds the cache key for a request.
 *
 * Lowercased and whitespace-collapsed so that "Birthday" and " birthday " share
 * one entry, which is where most of the cost saving comes from. Hashed because
 * free-text input has no business being a document id.
 */
export function cacheKey(input: SuggestionRequest): string {
  const normalized = `${normalize(input.occasion)}|${normalize(input.relationship)}`;
  return createHash('sha256').update(normalized).digest('hex');
}

function normalize(value: string): string {
  return value.trim().toLowerCase().split(/\s+/).join(' ');
}
