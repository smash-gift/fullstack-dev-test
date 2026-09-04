export const SUGGESTION_TONES = ['warm', 'funny', 'formal', 'heartfelt'] as const;
export const SUGGESTION_LANGUAGES = ['en', 'pt', 'es'] as const;

export type SuggestionTone = (typeof SUGGESTION_TONES)[number];
export type SuggestionLanguage = (typeof SUGGESTION_LANGUAGES)[number];

/** Minimum and maximum suggestions per request, as specified by the API contract. */
export const MIN_SUGGESTION_COUNT = 2;
export const MAX_SUGGESTION_COUNT = 3;

export type SuggestionCount = 2 | 3;

/**
 * A validated request reaching the domain.
 *
 * Optional fields are already resolved to their defaults by the presentation
 * layer, so the domain never deals with `undefined`.
 */
export interface SuggestMessagesInput {
  readonly occasion: string;
  readonly relationship: string;
  readonly tone: SuggestionTone;
  /**
   * The one field with no default, and the exception to the note above.
   *
   * `undefined` is a real answer here, not a missing one: it means the caller
   * did not pin a language, so the model writes in whichever language the
   * request itself is written in. Resolving it to `en` in the presentation
   * layer is exactly the bug this replaced.
   */
  readonly language?: SuggestionLanguage;
  readonly count: SuggestionCount;
}
