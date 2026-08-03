import { SuggestionRequest } from '../types';

/**
 * Deterministic, offline fallback used whenever the LLM is unavailable
 * (missing key, timeout, 429, 5xx, malformed output).
 *
 * The goal is graceful degradation: the user still gets usable, on-topic
 * messages instead of an error. Templates are intentionally generic and
 * lightly personalized with the occasion/relationship so they read naturally
 * for the common cases while never failing.
 */
export function fallbackSuggestions(input: SuggestionRequest): string[] {
  const occasion = normalize(input.occasion) || 'this special day';
  const relationship = normalize(input.relationship) || 'you';

  return [
    `Wishing you all the best on ${occasion}. So grateful to have ${article(relationship)} like you.`,
    `Happy ${occasion}! Thinking of you and sending warm wishes your way.`,
    `Here's to ${occasion} — may it bring you joy. You truly mean a lot to me.`,
  ];
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Small grammar helper so "a friend" / "an aunt" read naturally. */
function article(noun: string): string {
  return /^[aeiou]/.test(noun) ? `an ${noun}` : `a ${noun}`;
}
