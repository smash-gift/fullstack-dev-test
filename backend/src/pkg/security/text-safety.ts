/**
 * Unicode primitives shared by input sanitisation and output validation.
 *
 * They live in `pkg` because both sides need them and they belong to neither:
 * the input side runs in `presentation` (rejecting with 400) and the output
 * side runs in `infra` (degrading to the fallback). Duplicating the character
 * tables across two layers would guarantee they drift apart.
 *
 * Every pattern is written with escape sequences on purpose. A literal
 * zero-width character in the source would be invisible to the next reader.
 *
 * See docs/05-security/llm-security.md
 */

/**
 * Bidirectional overrides — the Trojan Source class of attack: the text a
 * human reviews and the text the model receives are different strings.
 *
 * Always rejected, never silently stripped. A legitimate occasion label has
 * no reason to reorder its own rendering, so this is a signal, not noise.
 */
const BIDI_CONTROL = '[\\u202A-\\u202E\\u2066-\\u2069]';

/** Zero-width characters: payload hidden between visible glyphs. */
const ZERO_WIDTH = '[\\u200B-\\u200D\\u2060\\uFEFF]';

/** Unicode tag block: an invisible channel for smuggling instructions. */
const UNICODE_TAGS = '[\\u{E0000}-\\u{E007F}]';

/**
 * Line and paragraph structure: what lets a value escape its own line and
 * look like a new instruction. Rejected rather than stripped, for the same
 * reason as bidi.
 */
const LINE_STRUCTURE = '[\\n\\r\\t\\u000B\\u000C\\u0085\\u2028\\u2029]';

/** Remaining C0/C1 control characters, once line structure is accounted for. */
const CONTROL_CHARS = '[\\u0000-\\u0008\\u000E-\\u001F\\u007F-\\u009F]';

const matcher = (pattern: string) => new RegExp(pattern, 'u');
const replacer = (pattern: string) => new RegExp(pattern, 'gu');

const BIDI_MATCHER = matcher(BIDI_CONTROL);
const LINE_MATCHER = matcher(LINE_STRUCTURE);
const INVISIBLE_MATCHER = matcher(
  [BIDI_CONTROL, ZERO_WIDTH, UNICODE_TAGS, LINE_STRUCTURE, CONTROL_CHARS].join('|'),
);
const STRIPPABLE = replacer([ZERO_WIDTH, UNICODE_TAGS, CONTROL_CHARS].join('|'));

export function hasBidiControl(value: string): boolean {
  return BIDI_MATCHER.test(value);
}

export function hasLineStructure(value: string): boolean {
  return LINE_MATCHER.test(value);
}

/** True when the string carries any invisible, control or bidi character. */
export function hasInvisibleCharacters(value: string): boolean {
  return INVISIBLE_MATCHER.test(value);
}

/**
 * Removes the invisible characters that carry no meaning.
 *
 * Deliberately does NOT remove bidi or line structure: those are rejection
 * conditions, and stripping them would hide the attempt instead of reporting
 * it.
 */
export function stripInvisibleCharacters(value: string): string {
  return value.replace(STRIPPABLE, '');
}

/**
 * NFKC, applied before every other check.
 *
 * Without it, compatibility forms and homoglyphs walk straight past any
 * allowlist or heuristic: `ⅰgnore` (U+2170 ROMAN NUMERAL ONE) does not match
 * /ignore/, but the model reads it as the same word.
 */
export function normalizeUnicode(value: string): string {
  return value.normalize('NFKC');
}
