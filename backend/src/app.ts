import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { config } from './config.js';
import { createSuggestionService } from './suggestion-service.js';
import type { LlmClient, SuggestionService } from './types.js';
import { suggestionInputSchema } from './validation.js';

type BuildAppOptions = {
  llmClient?: LlmClient;
  suggestionService?: SuggestionService;
  logger?: boolean;
  rateLimitMax?: number;
  rateLimitWindow?: string;
};

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });
  const service =
    options.suggestionService ?? createSuggestionService(options.llmClient, app.log);

  app.register(helmet);
  app.register(cors, { origin: true });
  app.register(rateLimit, {
    global: true,
    max: options.rateLimitMax ?? config.rateLimitMax,
    timeWindow: options.rateLimitWindow ?? config.rateLimitWindow,
    errorResponseBuilder: () =>
      Object.assign(new Error('Too many requests. Please try again shortly.'), {
        code: 'RATE_LIMITED',
        statusCode: 429,
      }),
  });

  app.register(async (routes) => {
    routes.get('/health', async () => ({ status: 'ok' }));

    routes.post('/api/suggestions', async (request, reply) => {
      const parsed = suggestionInputSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'occasion and relationship are required text fields.',
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const result = await service.suggest(parsed.data);
      return reply.code(200).send(result);
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined;
    const errorCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;

    if (statusCode === 429) {
      return reply.code(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again shortly.',
        },
      });
    }

    if (statusCode === 400 || errorCode === 'FST_ERR_CTP_INVALID_JSON_BODY') {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request body must be valid JSON.',
        },
      });
    }

    request.log.error({ err: error }, 'Unhandled request error');
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
      },
    });
  });

  return app;
}
