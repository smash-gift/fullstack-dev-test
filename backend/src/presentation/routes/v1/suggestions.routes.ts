import { Router } from 'express';

import { MethodNotAllowedError } from '../../../domain/errors/index.js';
import type { SuggestionsController } from '../../controllers/suggestions.controller.js';

const ALLOWED_METHODS = ['POST'] as const;

export function suggestionsRoutes(controller: SuggestionsController): Router {
  const router = Router();

  router.post('/suggestions', controller.handle);

  // Without this, a GET on an endpoint that exists falls through to the
  // not-found handler and answers 404 — telling the caller to check the URL
  // when the URL was right all along.
  router.all('/suggestions', (_req, res, next) => {
    res.set('Allow', ALLOWED_METHODS.join(', '));
    next(new MethodNotAllowedError(ALLOWED_METHODS));
  });

  return router;
}
