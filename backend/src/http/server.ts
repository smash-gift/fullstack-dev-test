import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { SuggestMessages } from '../application/suggest-messages.js';
import { normalizeField } from '../application/normalize-input.js';
import { InvalidRequestError } from '../domain/errors.js';
import type { Logger } from '../domain/ports.js';
import type { SuggestionRequest } from '../domain/suggestion.js';
import { FixedWindowRateLimiter } from './rate-limiter.js';
import { openApiDocument } from './openapi.js';

const bodySchema = z.object({
  occasion: z.unknown(),
  relationship: z.unknown(),
  locale: z.enum(['en', 'pt-BR']).default('en'),
  count: z.coerce.number().int().min(2).max(3).default(3),
  refresh: z.boolean().default(false),
});

export interface ServerDeps {
  suggestMessages: SuggestMessages;
  logger: Logger;
  rateLimiter: FixedWindowRateLimiter;
  corsOrigin: string;
  llmConfigured: boolean;
  /** Only behind a proxy you control: otherwise X-Forwarded-For is attacker-chosen. */
  trustProxy?: boolean;
}

const CLIENT_ERROR_CODES: Record<number, string> = {
  413: 'payload_too_large',
  415: 'unsupported_media_type',
};

export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify({
    logger: false,
    bodyLimit: 8 * 1024,
    trustProxy: deps.trustProxy ?? false,
    genReqId: () => randomRequestId(),
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('access-control-allow-origin', deps.corsOrigin);
    reply.header('access-control-allow-headers', 'content-type');
    reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
    reply.header('x-request-id', request.id);
    if (request.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  app.get('/health', async () => ({
    status: 'ok',
    llm: deps.llmConfigured ? 'configured' : 'not_configured',
  }));

  app.get('/openapi.json', async () => openApiDocument);

  app.post('/v1/suggestions', async (request, reply) => {
    const decision = deps.rateLimiter.check(request.ip || 'unknown');

    reply.header('x-ratelimit-remaining', String(decision.remaining));
    if (!decision.allowed) {
      return reply
        .code(429)
        .header('retry-after', String(decision.retryAfterSeconds))
        .send({
          error: {
            code: 'rate_limited',
            message: 'Too many requests. Please retry shortly.',
            retryAfterSeconds: decision.retryAfterSeconds,
          },
          requestId: request.id,
        });
    }

    const parsed = bodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      throw new InvalidRequestError(
        'Request body is invalid',
        parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`),
      );
    }

    const occasion = normalizeField('occasion', parsed.data.occasion);
    const relationship = normalizeField('relationship', parsed.data.relationship);

    const suggestionRequest: SuggestionRequest = {
      occasion: occasion.value,
      relationship: relationship.value,
      locale: parsed.data.locale,
      count: parsed.data.count,
      refresh: parsed.data.refresh,
    };

    const result = await deps.suggestMessages.execute(suggestionRequest, request.id);

    return reply.code(200).send({
      requestId: request.id,
      source: result.source,
      ...(result.degradedReason ? { degradedReason: result.degradedReason } : {}),
      suggestions: result.suggestions,
      meta: {
        occasion: suggestionRequest.occasion,
        relationship: suggestionRequest.relationship,
        locale: suggestionRequest.locale,
        model: result.model ?? null,
        promptVersion: result.promptVersion ?? null,
        latencyMs: result.latencyMs,
      },
    });
  });

  app.setNotFoundHandler(async (request, reply) =>
    reply.code(404).send({
      error: { code: 'not_found', message: 'Unknown route' },
      requestId: request.id,
    }),
  );

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof InvalidRequestError) {
      return reply.code(400).send({
        error: { code: 'invalid_request', message: error.message, details: error.details },
        requestId: request.id,
      });
    }

    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({
        error: {
          code: CLIENT_ERROR_CODES[statusCode] ?? 'invalid_request',
          message: 'Request could not be processed. Check the body, its size and its content type.',
        },
        requestId: request.id,
      });
    }

    const message = error instanceof Error ? error.message : 'unknown error';
    deps.logger.error({ requestId: request.id, message }, 'unhandled error');
    return reply.code(500).send({
      error: { code: 'internal_error', message: 'Unexpected error. Please retry.' },
      requestId: request.id,
    });
  });

  return app;
}

function randomRequestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
