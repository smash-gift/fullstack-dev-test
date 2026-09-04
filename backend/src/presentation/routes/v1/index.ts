import { Router } from 'express';

import type { SuggestionsController } from '../../controllers/suggestions.controller.js';
import { suggestionsRoutes } from './suggestions.routes.js';

export function v1Routes(controller: SuggestionsController): Router {
  const router = Router();
  router.use(suggestionsRoutes(controller));
  return router;
}
