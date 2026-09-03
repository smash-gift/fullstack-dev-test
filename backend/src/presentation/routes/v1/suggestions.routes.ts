import { Router } from 'express';

import type { SuggestionsController } from '../../controllers/suggestions.controller.js';

export function suggestionsRoutes(controller: SuggestionsController): Router {
  const router = Router();
  router.post('/suggestions', controller.handle);
  return router;
}
