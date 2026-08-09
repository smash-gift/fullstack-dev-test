import type { SuggestionRequest } from './types';

export const MAX_FIELD_LENGTH = 60;

export type ValidationResult =
  | { ok: true; value: SuggestionRequest }
  | { ok: false; message: string };

/**
 * Validates the two request fields.
 *
 * Surrounding whitespace is trimmed, but embedded control characters are
 * rejected rather than stripped: silently rewriting what someone typed hides
 * the problem, and a newline inside a 60-character field is far more likely to
 * be an injection attempt than a genuine occasion.
 */
export function validateInput(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Request body must be a JSON object.' };
  }

  const { occasion, relationship } = body as Record<string, unknown>;

  const validatedOccasion = validateField(occasion, 'occasion');
  if (!validatedOccasion.ok) {
    return validatedOccasion;
  }

  const validatedRelationship = validateField(relationship, 'relationship');
  if (!validatedRelationship.ok) {
    return validatedRelationship;
  }

  return {
    ok: true,
    value: {
      occasion: validatedOccasion.value,
      relationship: validatedRelationship.value,
    },
  };
}

type FieldResult = { ok: true; value: string } | { ok: false; message: string };

function validateField(raw: unknown, name: string): FieldResult {
  if (typeof raw !== 'string') {
    return { ok: false, message: `${name} is required and must be a string.` };
  }

  const value = raw.trim();

  if (value.length === 0) {
    return { ok: false, message: `${name} must not be empty.` };
  }

  if (value.length > MAX_FIELD_LENGTH) {
    return {
      ok: false,
      message: `${name} must be at most ${MAX_FIELD_LENGTH} characters.`,
    };
  }

  if (hasControlCharacter(value)) {
    return { ok: false, message: `${name} must not contain control characters.` };
  }

  return { ok: true, value };
}

/** True if the string holds any C0 or C1 control character (newlines and tabs included). */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    const isC0 = code < 0x20;
    const isC1 = code >= 0x7f && code <= 0x9f;
    if (isC0 || isC1) {
      return true;
    }
  }

  return false;
}
