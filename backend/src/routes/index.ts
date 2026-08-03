import { Router } from 'express';
import { SuggestionCache } from '../cache/suggestionCache';
import { SuggestionController } from '../controllers/suggestion.controller';
import { createLlmProvider } from '../llm/llm.factory';
import { SuggestionService } from '../services/suggestion.service';

/**
 * Wires the dependency graph (provider → service → controller) and mounts the
 * routes. Kept in one place so composition is easy to follow and to override
 * in tests. An optional cache lets the Functions entry point inject a
 * Firestore-backed cache; omitted, the service uses its in-memory default.
 */
export function buildRouter(cache?: SuggestionCache): Router {
  const router = Router();

  const service = new SuggestionService(createLlmProvider(), cache);
  const controller = new SuggestionController(service);

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  router.post('/suggestions', controller.create);

  return router;
}
