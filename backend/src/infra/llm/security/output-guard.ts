import type { Suggestion } from '../../../domain/entities/suggestion.js';
import { LlmOutputBlockedError } from '../../../domain/errors/index.js';
import type { SuggestionGuard } from '../../../domain/services/suggestion-guard.js';
import { hasInvisibleCharacters } from '../../../pkg/security/text-safety.js';
import { containsCanary } from './prompt-canary.js';

/**
 * Layer 3 of the prompt-injection defence — the layer that GUARANTEES.
 *
 * Layers 1 and 2 lower the probability that an injection lands. This one
 * limits the damage regardless of what the model did, which is why it is the
 * strictest of the four: every completion is treated as untrusted input,
 * because part of it was shaped by whoever typed into the form.
 *
 * Two properties make it work:
 *
 * 1. It reuses the resilience path already built in phase 04. A security
 *    rejection needs no new mechanism — it becomes an LlmInvalidResponseError
 *    and flows into the fallback like any provider failure.
 * 2. It gives the attacker nothing. A blocked injection produces the same
 *    `200 degraded` with reason `llm_invalid_response` as a model returning
 *    malformed JSON, so probing cannot tell "my payload was caught" from
 *    "the model had a bad day".
 *
 * See docs/05-security/llm-security.md and ADR-0009.
 */

/** The brief asks for 1-2 short sentences. More than that is not our product. */
const MAX_SENTENCES = 2;

/** What tripped. Never carries the offending text: logs are not a sink for attacker input. */
export type OutputViolation =
  | 'sentence_count'
  | 'url'
  | 'contact_details'
  | 'markdown_link'
  | 'html_tag'
  | 'code_fence'
  | 'canary'
  | 'invisible_characters'
  | 'meta_response';

const URL_PATTERN = /\bhttps?:\/\/|:\/\/|\bwww\.\w/i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
/**
 * Deliberately narrow. A loose digit run would flag `Happy 30th, see you on
 * 12-31` — the cost of a false positive here is a degraded response, so the
 * pattern targets shapes that are actually phone numbers.
 */
const PHONE_PATTERN = /\+\d[\d\s().-]{6,}\d|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\s*\([^)]*\)/;
const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;
const CODE_FENCE_PATTERN = /```|~~~/;

/**
 * The model talking ABOUT its instructions instead of writing a card.
 *
 * `I cannot` is matched only with a refusal verb after it. The documented
 * rule was the bare phrase, but `I cannot wait to celebrate with you` is a
 * perfectly good gift card message — a guard that discards it would be
 * degrading real responses to catch a phrase it never needed.
 */
const META_RESPONSE_PATTERNS: readonly RegExp[] = [
  /\bas an ai\b/i,
  /\bas a language model\b/i,
  /\bi am an ai\b/i,
  /\bsystem (prompt|message|instruction)/i,
  /\b(my|your|the|previous|above) instructions\b/i,
  /\bi cannot (comply|assist|help|fulfil|fulfill|do that|provide|reveal|share)\b/i,
  /\bi'm sorry, but i\b/i,
];

/**
 * Checks every suggestion and throws on the first violation.
 *
 * Rejecting the whole batch rather than filtering the offending item is
 * deliberate: if one suggestion was steered, the others came from the same
 * compromised completion and are not more trustworthy than their sibling.
 */
export function assertSuggestionsAreSafe(texts: readonly string[]): void {
  for (const text of texts) {
    const violation = findViolation(text);
    if (violation) {
      throw new LlmOutputBlockedError(violation, {
        severe: violation === 'canary',
        recoverable: STYLE_VIOLATIONS.has(violation),
      });
    }
  }
}

/**
 * The violations that are about shape, not safety.
 *
 * Everything else in `OutputViolation` describes content that must not reach a
 * user - a leaked canary, a link, markup, contact details, the model talking
 * about its own instructions. This one describes a message that is perfectly
 * safe and simply longer than the product allows, which measurement showed the
 * model producing on roughly one funny-toned request in five even though the
 * prompt states the limit.
 */
const STYLE_VIOLATIONS: ReadonlySet<OutputViolation> = new Set(['sentence_count']);

/** The port implementation wired into the use case. */
export class LlmOutputGuard implements SuggestionGuard {
  assertSafe(suggestions: readonly Suggestion[]): void {
    assertSuggestionsAreSafe(suggestions.map((suggestion) => suggestion.text));
  }
}

function findViolation(text: string): OutputViolation | null {
  if (containsCanary(text)) return 'canary';
  if (hasInvisibleCharacters(text)) return 'invisible_characters';
  if (CODE_FENCE_PATTERN.test(text)) return 'code_fence';
  if (MARKDOWN_LINK_PATTERN.test(text)) return 'markdown_link';
  if (HTML_TAG_PATTERN.test(text)) return 'html_tag';
  if (URL_PATTERN.test(text)) return 'url';
  if (EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text)) return 'contact_details';
  if (META_RESPONSE_PATTERNS.some((pattern) => pattern.test(text))) return 'meta_response';
  if (countSentences(text) > MAX_SENTENCES) return 'sentence_count';

  return null;
}

function countSentences(text: string): number {
  return text
    .split(/[.!?…]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0).length;
}
