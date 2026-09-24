import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { loadConfig, type AppConfig } from './lib/config.js';
import { InternalError, isAppError, type AppError } from './lib/errors.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { suggestionsRoutes } from './routes/suggestions.js';
import { SuggestionService } from './services/suggestion.service.js';

export interface BuildServerOptions {
  config?: AppConfig;
  /** Inject a pre-built service (tests). Overrides provider wiring. */
  service?: SuggestionService;
}

/**
 * Builds a fully wired Fastify instance. Kept as a factory so tests can inject
 * a fake service and call `.inject()` without opening a socket.
 */
export async function buildServer(
  opts: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const config = opts.config ?? loadConfig();

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      // Correlate every log line with the request id.
      redact: ['req.headers.authorization'],
    },
    // Fastify generates a request id and exposes it as request.id.
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  await app.register(cors, { origin: config.corsOrigins });
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });

  // Echo the request id back so clients/support can reference it.
  app.addHook('onSend', (request, reply, _payload, done) => {
    void reply.header('x-request-id', request.id);
    done();
  });

  // Global error handler: maps typed domain errors to safe responses and never
  // leaks stack traces or provider internals to the client.
  app.setErrorHandler((error, request, reply) => {
    // Fastify's rate-limit plugin sets statusCode 429.
    if (
      typeof (error as { statusCode?: number }).statusCode === 'number' &&
      (error as { statusCode: number }).statusCode === 429
    ) {
      request.log.warn({ err: error }, 'rate limited');
      return reply.code(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again shortly.',
        },
      });
    }

    const appError: AppError = isAppError(error)
      ? error
      : new InternalError('Unexpected error', { cause: error });

    if (appError.statusCode >= 500) {
      request.log.error({ err: error }, 'unhandled error');
    } else {
      request.log.info({ err: error }, 'request rejected');
    }

    return reply.code(appError.statusCode).send({
      error: { code: appError.code, message: appError.message },
    });
  });

  app.get('/health', async () => ({
    status: 'ok',
    llmEnabled: config.llmEnabled,
    model: config.GEMINI_MODEL,
  }));

  const service =
    opts.service ??
    new SuggestionService({
      llm: config.llmEnabled ? new GeminiProvider(config) : undefined,
      cacheTtlMs: config.CACHE_TTL_MS,
    });

  await app.register(suggestionsRoutes, { service });

  return app;
}
