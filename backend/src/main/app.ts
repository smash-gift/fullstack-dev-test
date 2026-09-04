import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import '../pkg/http/request-context.js';
import { parseCorsOrigins } from '../pkg/config/env.js';
import { buildOpenApiDocument } from '../presentation/docs/openapi.js';
import { contentTypeMiddleware } from '../presentation/middlewares/content-type.middleware.js';
import { errorHandlerMiddleware } from '../presentation/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from '../presentation/middlewares/not-found.middleware.js';
import { rateLimitMiddleware } from '../presentation/middlewares/rate-limit.middleware.js';
import { requestIdMiddleware } from '../presentation/middlewares/request-id.middleware.js';
import { requestLoggerMiddleware } from '../presentation/middlewares/request-logger.middleware.js';
import { docsRoutes } from '../presentation/routes/docs.routes.js';
import { healthRoutes } from '../presentation/routes/health.routes.js';
import { v1Routes } from '../presentation/routes/v1/index.js';
import type { Container } from './container.js';

export const API_VERSION = '1.0.0';

/**
 * This API answers JSON to programmatic clients; it never returns a document a
 * browser renders. So the document-oriented policies are turned off rather than
 * left at a default that suggests a protection this service does not need, and
 * the ones that matter for a JSON endpoint are kept.
 *
 * `contentSecurityPolicy` is disabled globally for that reason, and set
 * tightly on `/docs` — the one route that does serve HTML. See
 * `presentation/routes/docs.routes.ts`.
 */
const HELMET_OPTIONS = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // This API exists to be called from another origin — the Flutter app. Helmet
  // defaults CORP to `same-origin`, a header that contradicts the product.
  // Access control here is CORS, configured per environment; leaving a
  // restrictive CORP next to a permissive CORS would be a header that looks
  // like a control and is not one.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
} as const;

/**
 * Builds the Express application.
 *
 * Kept separate from `server.ts` so the app can be mounted by something other
 * than `listen()` — a test runner today, a serverless entrypoint later.
 */
export function buildApp(container: Container): Express {
  const app = express();

  // Express advertises itself in every response by default. Free reconnaissance
  // for anyone scanning for a framework with a known advisory.
  app.disable('x-powered-by');

  // ETags on a JSON API buy nothing here and leak a weak fingerprint of the
  // response body.
  app.disable('etag');

  app.use(helmet(HELMET_OPTIONS));

  // Rate limiting keys on the client IP. Behind a reverse proxy every request
  // would otherwise arrive with the proxy's address, so one caller could spend
  // everybody's quota. A hop count, never `true`: trusting the whole
  // `X-Forwarded-For` chain lets a caller forge a fresh identity per request.
  app.set('trust proxy', container.env.TRUST_PROXY_HOPS);

  app.use(requestIdMiddleware());
  app.use(requestLoggerMiddleware(container.logger));

  // CORS before the rate limiter so a blocked cross-origin request still comes
  // back with the headers a browser needs — otherwise the client sees a CORS
  // failure and never learns it was rate limited.
  //
  // The method list is the one this API actually serves. Advertising DELETE on
  // an endpoint that answers 405 for it would be a header contradicting the
  // routing table.
  app.use(
    cors({
      origin: parseCorsOrigins(container.env.CORS_ORIGINS),
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  );

  // Before the body parser and the controller: a blocked request must cost
  // nothing, neither a parsed body nor a token. `/health` and `/docs` are
  // outside the scope — an orchestrator's health check is frequent by design,
  // and documentation should never be locked out by accident.
  if (container.env.RATE_LIMIT_ENABLED) {
    app.use(
      '/api/v1',
      rateLimitMiddleware({
        windowMs: container.env.RATE_LIMIT_WINDOW_MS,
        max: container.env.RATE_LIMIT_MAX,
      }),
    );
  }

  app.use(contentTypeMiddleware());

  // 4kb for two fields capped at 60 characters each is generous. The cap is
  // also what bounds JSON nesting depth: the deepest object that fits is around
  // 560 levels, which the parser handles without breaking a sweat. A separate
  // depth rule would be a rule that never fires.
  app.use(express.json({ limit: '4kb' }));

  app.use(healthRoutes({ version: API_VERSION, llmProvider: container.llmProvider.name }));
  app.use('/api/v1', v1Routes(container.suggestionsController));

  if (container.env.DOCS_ENABLED) {
    app.use('/docs', docsRoutes(buildOpenApiDocument({ version: API_VERSION })));
  }

  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware(container.logger));

  return app;
}
