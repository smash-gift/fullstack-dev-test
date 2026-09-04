import { z } from 'zod';

/**
 * The response, described once.
 *
 * These schemas are not used to validate anything at runtime — the server is
 * the authority on its own output. They exist so the published OpenAPI
 * document and the controller's return type come from the same declaration:
 * `SuggestMessagesData` below is inferred from this schema, so a field the
 * controller stops sending stops compiling, and the documentation cannot
 * quietly describe a response the API no longer produces.
 */
export const suggestionSchema = z.object({
  id: z
    .string()
    .meta({ description: 'Stable within this response; not persisted.', example: 's1' }),
  text: z.string().meta({
    description: 'One or two sentences, ready to print on a card.',
    example: 'Wishing you a birthday as wonderful as you are.',
  }),
});

export const suggestMessagesDataSchema = z.object({
  suggestions: z.array(suggestionSchema).min(2).max(3),
  source: z.enum(['llm', 'fallback']).meta({
    description: '`fallback` means the model could not be used and curated messages were served.',
  }),
  model: z
    .string()
    .nullable()
    .meta({ description: 'Null when the suggestions did not come from a model.' }),
  degraded: z.boolean().meta({
    description: 'True when the response is a fallback. The request still succeeded.',
  }),
});

export const responseMetaSchema = z.object({
  requestId: z.string().meta({ example: 'req_8f3c1a2b4d5e6f70' }),
  generatedAt: z.iso.datetime(),
  cached: z.boolean().meta({ description: 'True when served from the in-memory cache.' }),
  reason: z
    .enum([
      'llm_timeout',
      'llm_rate_limited',
      'llm_unavailable',
      'llm_invalid_response',
      'llm_auth_error',
    ])
    .optional()
    .meta({ description: 'Present only when `degraded` is true. Stable code, safe to switch on.' }),
});

export const suggestMessagesResponseSchema = z.object({
  data: suggestMessagesDataSchema,
  meta: responseMetaSchema,
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string().meta({ description: 'Stable code. The message may be reworded.' }),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.iso.datetime(),
  }),
});

/** The payload the controller must produce. Inferred, never retyped. */
export type SuggestMessagesData = z.infer<typeof suggestMessagesDataSchema>;
export type SuggestMessagesResponseMeta = z.infer<typeof responseMetaSchema>;
