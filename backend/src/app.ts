import cors from 'cors';
import express, { Express, RequestHandler } from 'express';
import { SuggestionCache } from './cache/suggestionCache';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import { buildRouter } from './routes';

/**
 * Options for {@link createApp}. Both are injected only on the Firebase
 * Functions path; the standalone server passes none and keeps its in-memory
 * cache and open (unauthenticated) endpoint.
 */
export interface CreateAppOptions {
  /** Cache backend for suggestions (defaults to in-memory inside the service). */
  cache?: SuggestionCache;
  /** When set, this middleware guards the suggestions endpoint (e.g. Firebase Auth). */
  authMiddleware?: RequestHandler;
}

/**
 * Builds the Express app. Exported separately from the server bootstrap so
 * tests (supertest) can exercise it without opening a port, and so the same
 * app can be wrapped in a Firebase Cloud Function handler (see `functions.ts`).
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
  app.use(express.json({ limit: '16kb' }));
  app.use(rateLimit);

  // Optional auth guard, applied before the routes when provided.
  if (options.authMiddleware) {
    app.use('/api/suggestions', options.authMiddleware);
  }

  app.use('/api', buildRouter(options.cache));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
