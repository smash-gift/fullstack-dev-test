import { UpstreamFailure } from '../domain/errors.js';
import type { Suggestion } from '../domain/suggestion.js';

const MAX_CHARACTERS = 220;
const MIN_CHARACTERS = 8;
const MAX_SENTENCES = 2;

/**
 * Anything here means the model drifted off task or repeated back part of the
 * envelope. We would rather ship a curated fallback than a card message that
 * quotes our own prompt.
 */
const LEAK_MARKERS = [
  /https?:\/\//i,
  /<\s*\/?\s*[a-z]/i,
  /```/,
  /\b(system|developer)\s*(prompt|instruction|message)\b/i,
  /\buntrusted\b|\benvelope\b|\bcanary\b/i,
];

function countSentences(text: string): number {
  const matches = text.match(/[.!?…]+(\s|$)/g);
  return matches ? matches.length : 1;
}

export interface GuardOptions {
  canary: string;
  expected: number;
}

/**
 * Validates model output before it is allowed anywhere near a client. Throws an
 * UpstreamFailure so the caller treats it exactly like a provider outage.
 */
export function guardSuggestions(raw: unknown, { canary, expected }: GuardOptions): Suggestion[] {
  if (!Array.isArray(raw)) {
    throw new UpstreamFailure('invalid_output', 'Model did not return a list of suggestions');
  }

  const texts = raw
    .map((item) => (typeof item === 'string' ? item : (item as { text?: unknown })?.text))
    .filter((text): text is string => typeof text === 'string')
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 0);

  if (texts.length < expected) {
    throw new UpstreamFailure(
      'invalid_output',
      `Model returned ${texts.length} usable suggestions, expected ${expected}`,
    );
  }

  const accepted = texts.slice(0, expected);

  for (const text of accepted) {
    if (text.includes(canary)) {
      throw new UpstreamFailure('unsafe_output', 'Model echoed the prompt canary');
    }
    if (text.length < MIN_CHARACTERS || text.length > MAX_CHARACTERS) {
      throw new UpstreamFailure('invalid_output', 'Suggestion length outside the accepted range');
    }
    if (countSentences(text) > MAX_SENTENCES) {
      throw new UpstreamFailure('invalid_output', 'Suggestion is longer than two sentences');
    }
    if (LEAK_MARKERS.some((marker) => marker.test(text))) {
      throw new UpstreamFailure('unsafe_output', 'Suggestion contains disallowed content');
    }
  }

  const unique = new Set(accepted.map((text) => text.toLowerCase()));
  if (unique.size !== accepted.length) {
    throw new UpstreamFailure('invalid_output', 'Model returned duplicate suggestions');
  }

  return accepted.map((text, index) => ({ id: `s${index + 1}`, text }));
}
