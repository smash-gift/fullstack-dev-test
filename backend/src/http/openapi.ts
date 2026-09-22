const errorResponse = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'array', items: { type: 'string' } },
      },
    },
    requestId: { type: 'string' },
  },
} as const;

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Gift Card Message Suggester API',
    version: '1.0.0',
    description:
      'Returns two or three short gift card messages for an occasion and a relationship. ' +
      'Any failure of the language model degrades into a curated catalog, reported through ' +
      'the "source" and "degradedReason" fields, never as an HTTP error.',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Liveness probe and language model configuration status',
        responses: {
          '200': {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    llm: { type: 'string', enum: ['configured', 'not_configured'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/suggestions': {
      post: {
        summary: 'Suggest gift card messages',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['occasion', 'relationship'],
                properties: {
                  occasion: { type: 'string', minLength: 2, maxLength: 40, example: 'birthday' },
                  relationship: { type: 'string', minLength: 2, maxLength: 40, example: 'friend' },
                  locale: { type: 'string', enum: ['en', 'pt-BR'], default: 'en' },
                  count: { type: 'integer', minimum: 2, maximum: 3, default: 3 },
                  refresh: {
                    type: 'boolean',
                    default: false,
                    description: 'Skip the cache and ask the model for new messages.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggestions, from the model or from the fallback catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requestId: { type: 'string' },
                    source: { type: 'string', enum: ['llm', 'cache', 'fallback'] },
                    degradedReason: {
                      type: 'string',
                      enum: [
                        'not_configured',
                        'timeout',
                        'rate_limited',
                        'upstream_error',
                        'invalid_output',
                        'unsafe_output',
                        'budget_exhausted',
                      ],
                      description: 'Present only when source is "fallback".',
                    },
                    suggestions: {
                      type: 'array',
                      minItems: 2,
                      maxItems: 3,
                      items: {
                        type: 'object',
                        properties: { id: { type: 'string' }, text: { type: 'string' } },
                      },
                    },
                    meta: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': {
            description:
              'The request itself is invalid, including inputs rejected by the input policy',
            content: { 'application/json': { schema: errorResponse } },
          },
          '429': {
            description: 'Client exceeded the per-IP rate limit',
            content: { 'application/json': { schema: errorResponse } },
          },
        },
      },
    },
  },
} as const;
