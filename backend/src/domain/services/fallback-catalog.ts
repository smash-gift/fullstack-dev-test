import type { SuggestMessagesInput } from '../dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../entities/suggestion.js';

/**
 * Source of suggestions when the model cannot provide them.
 *
 * Must never throw and never return an empty list: it is the last line before
 * the user sees an empty screen.
 *
 * See docs/01-architecture/decisions/adr-0003-fallback-strategy.md
 */
export interface FallbackCatalog {
  get(input: SuggestMessagesInput): readonly Suggestion[];
}
