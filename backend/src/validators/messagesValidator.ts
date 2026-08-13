export const MAX_FIELD_LENGTH = 300;

export interface ValidMessagesRequest {
  valid: true;
  data: {
    occasion: string;
    relationship: string;
    regenerate: boolean;
  };
}

export interface InvalidMessagesRequest {
  valid: false;
  errors: string[];
}

export type MessagesRequestValidation =
  | ValidMessagesRequest
  | InvalidMessagesRequest;

function validateField(
  name: string,
  value: unknown,
  errors: string[],
): string | undefined {
  if (value === undefined || value === null) {
    errors.push(`${name} is required`);
    return undefined;
  }
  if (typeof value !== "string") {
    errors.push(`${name} must be a string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    errors.push(`${name} must be a non-empty string`);
    return undefined;
  }
  if (trimmed.length > MAX_FIELD_LENGTH) {
    errors.push(`${name} must be at most ${MAX_FIELD_LENGTH} characters long`);
    return undefined;
  }
  return trimmed;
}

function validateRegenerate(value: unknown, errors: string[]): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value !== "boolean") {
    errors.push("regenerate must be a boolean");
    return false;
  }
  return value;
}

/**
 * Validates the body of POST /messages. Returns either
 * { valid: true, data: { occasion, relationship } } or
 * { valid: false, errors: string[] }.
 */
export function validateMessagesRequest(
  body: unknown,
): MessagesRequestValidation {
  const errors: string[] = [];
  const source: Record<string, unknown> =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const occasion = validateField("occasion", source.occasion, errors);
  const relationship = validateField(
    "relationship",
    source.relationship,
    errors,
  );
  const regenerate = validateRegenerate(source.regenerate, errors);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      occasion: occasion as string,
      relationship: relationship as string,
      regenerate,
    },
  };
}
