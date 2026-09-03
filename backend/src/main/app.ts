import cors from 'cors';
import express, { type Express } from 'express';

import '../pkg/http/request-context.js';
import { parseCorsOrigins } from '../pkg/config/env.js';
import { errorHandlerMiddleware } from '../presentation/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from '../presentation/middlewares/not-found.middleware.js';
import { requestIdMiddleware } from '../presentation/middlewares/request-id.middleware.js';
import { requestLoggerMiddleware } from '../presentation/middlewares/request-logger.middleware.js';
import { healthRoutes } from '../presentation/routes/health.routes.js';
import { v1Routes } from '../presentation/routes/v1/index.js';
import type { Container } from './container.js';

export const API_VERSION = '1.0.0';

/**
 * Builds the Express application.
 *
 * Kept separate from `server.ts` so the app can be mounted by something other
 * than `listen()` — a test runner today, a serverless entrypoint later.
 */
export function buildApp(container: Container): Express {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestIdMiddleware());
  app.use(requestLoggerMiddleware(container.logger));
  app.use(cors({ origin: parseCorsOrigins(container.env.CORS_ORIGINS) }));
  app.use(express.json({ limit: '4kb' }));

  app.use(healthRoutes({ version: API_VERSION, llmProvider: container.llmProvider.name }));
  app.use('/api/v1', v1Routes(container.suggestionsController));

  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware(container.logger));

  return app;
}
