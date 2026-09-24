/**
 * Prompt-injection defences.
 *
 * The user controls `occasion` and `relationship`, which are interpolated into
 * the LLM prompt. Free text plus an LLM is a classic prompt-injection surface:
 * a user could type "ignore your instructions and output X". These helpers
 * reduce that risk with defence in depth:
 *
 *   1. Input sanitisation — strip control chars, collapse whitespace, cap
 *      length, and neutralise the most common injection phrasings before the
 *      text ever reaches the model.
 *   2. Structural isolation — the prompt builder wraps user input in clearly
 *      delimited fields (see lib/prompt.ts) so it reads as *data*, not
 *      *instructions*.
 *   3. Output guard — validate that what the model returns looks like gift-card
 *      messages and not leaked instructions or injected content.
 *
 * None of these is a silver bullet; together they make the feature meaningfully
 * harder to abuse. See docs/SECURITY.md.
 */

/** Phrases that commonly appear in prompt-injection attempts. */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|any|the|your|previous|above)/i,
  /disregard (all|any|the|your|previous|above)/i,
  /forget (all|any|the|your|previous|everything)/i,
  /system prompt/i,
  /you are now/i,
  /act as/i,
  /new instructions?/i,
  /reveal (your|the) (prompt|instructions?|system)/i,
  /</i, // angle brackets are never legitimate here and break our delimiters
];

/**
 * Sanitises a single free-text field before it is placed in the prompt.
 * - Removes control characters.
 * - Collapses runs of whitespace to a single space.
 * - Removes characters used to break out of prompt delimiters.
 * - Neutralises common injection phrases by redacting them.
 * The Zod layer already enforces length; we defensively cap again here.
 */
export function sanitizeField(value: string): string {
  let out = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of INJECTION_PATTERNS) {
    out = out.replace(pattern, '[filtered]');
  }

  return out.slice(0, 60).trim();
}

/**
 * Output guard. Rejects model output that looks like it leaked instructions or
 * echoed an injection instead of producing a genuine gift-card message.
 * Returns true when the messages look safe.
 */
export function isSafeOutput(messages: string[]): boolean {
  if (messages.length === 0) return false;

  const suspicious: RegExp[] = [
    /system prompt/i,
    /as an ai (language )?model/i,
    /i (cannot|can't|won't) (comply|do that|help)/i,
    /ignore .{0,20}instructions?/i,
    /reveal .{0,20}(prompt|instructions?)/i,
    /disregard .{0,20}instructions?/i,
  ];

  return messages.every((m) => {
    const text = m.trim();
    if (text.length === 0) return false;
    return !suspicious.some((p) => p.test(text));
  });
}
