import {
  hasBidiControl,
  hasLineStructure,
  normalizeUnicode,
  stripInvisibleCharacters,
} from './text-safety.js';

/**
 * Layer 1 of the prompt-injection defence: sanitise what enters the system.
 *
 * This layer is explicitly the WEAKEST of the four, and is treated as a noise
 * filter rather than as the defence. No input filter can be proven complete,
 * so the guarantee lives in layer 3 (output validation). What this layer buys
 * is a much smaller attack surface for the same effort.
 *
 * See docs/05-security/llm-security.md and ADR-0009.
 */

/**
 * Characters a gift card occasion or relationship legitimately needs.
 *
 * Allowlist rather than denylist: a denylist protects against what you
 * remembered to list, an allowlist protects against what you never imagined.
 * `\p{L}` covers every alphabet, so `aniversário`, `結婚式` and `عيد ميلاد`
 * stay valid — a filter that broke those would be worse than the threat.
 *
 * Beyond the documented set this also admits the typographic apostrophe and
 * dashes: an iPhone turns `Mother's Day` into `Mother’s Day` without asking,
 * and rejecting that would be a self-inflicted bug. `&` is admitted for the
 * same reason (`Mr. & Mrs.`). None of the three can build prompt structure.
 *
 * Everything else is out, which removes ` { } < > # | \ [ ] : " * _ ~ = in one
 * rule — the building blocks of delimiters and code fences.
 */
const ALLOWED_CHARACTERS = /^[\p{L}\p{N} '‘’\-–—.,!?&]+$/u;

/**
 * Patterns that match an explicit attempt to redirect the model.
 *
 * Structural markers (backtick fences, `<|`, `###`) are absent on purpose:
 * the allowlist above already rejects every character they are made of, and
 * a redundant rule that can never fire is a rule nobody maintains. They are
 * enforced on the OUTPUT side, where those characters can appear.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /\bignore\s+(all\s+|the\s+)?(previous|prior|above|earlier|preceding)/i,
  /\bdisregard\s+(all\s+|the\s+)?(previous|prior|above|earlier|instructions)/i,
  /\bforget\s+(everything|all|your|the\s+above)/i,
  /\bsystem\s+(prompt|message|instruction)/i,
  /\byou\s+are\s+(now|no\s+longer|a|an)\b/i,
  /\bnew\s+instructions?\b/i,
  /\bact\s+as\s+(a|an)?\b/i,
  /\bpretend\s+(to\s+be|you\s+are)\b/i,
  /\b(repeat|print|reveal|show|output)\s+(the|your|all)\s+(prompt|instructions?|rules)/i,
  /\bdo\s+not\s+follow\s+(the|your|any)\b/i,
];

export type SanitizationFailure =
  'invisible_characters' | 'line_break' | 'unsupported_characters' | 'unsupported_content';

export type SanitizationResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: SanitizationFailure };

/**
 * Order matters. Normalisation runs first so that every later check sees the
 * same string the model will see; rejections run before stripping so that an
 * attempt is reported rather than quietly cleaned up.
 */
export function sanitizeFreeText(rawValue: string): SanitizationResult {
  const normalized = normalizeUnicode(rawValue);

  if (hasBidiControl(normalized)) return { ok: false, reason: 'invisible_characters' };
  if (hasLineStructure(normalized)) return { ok: false, reason: 'line_break' };

  const value = stripInvisibleCharacters(normalized).trim();

  if (value.length === 0) return { ok: false, reason: 'unsupported_characters' };
  if (!ALLOWED_CHARACTERS.test(value)) return { ok: false, reason: 'unsupported_characters' };
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(value))) {
    return { ok: false, reason: 'unsupported_content' };
  }

  return { ok: true, value };
}

/**
 * Client-facing wording.
 *
 * Format problems say what to fix, because the caller is almost always a user
 * who typed something ordinary. The injection reason stays vague on purpose:
 * naming the rule that fired would hand an attacker a free oracle for tuning
 * the next payload.
 */
export function describeSanitizationFailure(field: string, reason: SanitizationFailure): string {
  switch (reason) {
    case 'invisible_characters':
      return `${field} contains invisible or bidirectional control characters`;
    case 'line_break':
      return `${field} must be a single line`;
    case 'unsupported_characters':
      return `${field} contains characters that are not allowed`;
    case 'unsupported_content':
      return `${field} contains content that cannot be processed`;
  }
}
