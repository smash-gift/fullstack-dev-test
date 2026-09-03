import type { Suggestion } from '../entities/suggestion.js';

/**
 * The last check before a model's words become our product.
 *
 * It is a port rather than a helper the adapters call, because "every
 * suggestion is validated" has to be a guarantee of the system and not a
 * convention an adapter author has to remember. Wired into the use case, the
 * check sits on the single path all providers share — there is no way around
 * it, including for providers written later.
 *
 * Implementations throw an LlmError, which routes the rejection into the
 * fallback path already built for provider failures.
 *
 * See docs/05-security/llm-security.md, layer 3.
 */
export interface SuggestionGuard {
  assertSafe(suggestions: readonly Suggestion[]): void;
}
