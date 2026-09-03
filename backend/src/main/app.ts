import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import '../pkg/http/request-context.js';
import { parseCorsOrigins } from '../pkg/config/env.js';
import { contentTypeMiddleware } from '../presentation/middlewares/content-type.middleware.js';
import { errorHandlerMiddleware } from '../presentation/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from '../presentation/middlewares/not-found.middleware.js';
import { requestIdMiddleware } from '../presentation/middlewares/request-id.middleware.js';
import { requestLoggerMiddleware } from '../presentation/middlewares/request-logger.middleware.js';
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
 * `contentSecurityPolicy` is disabled here and revisited in phase 07, when
 * Swagger UI starts serving an actual HTML page.
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

  app.use(requestIdMiddleware());
  app.use(requestLoggerMiddleware(container.logger));
  app.use(cors({ origin: parseCorsOrigins(container.env.CORS_ORIGINS) }));
  app.use(contentTypeMiddleware());

  // 4kb for two fields capped at 60 characters each is generous. The cap is
  // also what bounds JSON nesting depth: the deepest object that fits is around
  // 560 levels, which the parser handles without breaking a sweat. A separate
  // depth rule would be a rule that never fires.
  app.use(express.json({ limit: '4kb' }));

  app.use(healthRoutes({ version: API_VERSION, llmProvider: container.llmProvider.name }));
  app.use('/api/v1', v1Routes(container.suggestionsController));

  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware(container.logger));

  return app;
}
