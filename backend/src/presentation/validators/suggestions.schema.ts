import { z } from 'zod';

import {
  MAX_SUGGESTION_COUNT,
  MIN_SUGGESTION_COUNT,
  SUGGESTION_LANGUAGES,
  SUGGESTION_TONES,
} from '../../domain/dtos/suggest-messages-input.dto.js';
import {
  describeSanitizationFailure,
  sanitizeFreeText,
} from '../../pkg/security/input-sanitizer.js';

/**
 * Shape first, then safety.
 *
 * The length bounds run before sanitisation so that an ordinary typo gets an
 * ordinary message instead of a security-flavoured one. The 60-character cap
 * doubles as a control here: it is very little room in which to build an
 * elaborate injection.
 */
const freeTextField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(60, `${label} must be at most 60 characters`)
    .transform((value, ctx) => {
      const result = sanitizeFreeText(value);

      if (!result.ok) {
        ctx.addIssue({
          code: 'custom',
          message: describeSanitizationFailure(label, result.reason),
          params: { securityReason: result.reason },
        });
        return z.NEVER;
      }

      return result.value;
    });

/**
 * Validation happens at the edge; the domain receives an input it can trust.
 *
 * `occasion` and `relationship` are free text on purpose — the brief says the
 * user can "choose or type", so the schema constrains shape and length, not
 * vocabulary.
 *
 * `count` is rejected outside 2..3 rather than silently clamped: quietly
 * changing a request hides from the caller that it was not honoured.
 */
export const suggestMessagesBodySchema = z.object({
  occasion: freeTextField('occasion'),
  relationship: freeTextField('relationship'),
  tone: z.enum(SUGGESTION_TONES).default('warm'),
  language: z.enum(SUGGESTION_LANGUAGES).default('en'),
  count: z.coerce
    .number()
    .int('count must be an integer')
    .min(MIN_SUGGESTION_COUNT, `count must be ${MIN_SUGGESTION_COUNT} or ${MAX_SUGGESTION_COUNT}`)
    .max(MAX_SUGGESTION_COUNT, `count must be ${MIN_SUGGESTION_COUNT} or ${MAX_SUGGESTION_COUNT}`)
    .default(MAX_SUGGESTION_COUNT),
});

export type SuggestMessagesBody = z.infer<typeof suggestMessagesBodySchema>;
