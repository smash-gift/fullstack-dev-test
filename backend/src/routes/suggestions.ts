import type { FastifyPluginAsync } from 'fastify';
import { InvalidInputError } from '../lib/errors.js';
import type { SuggestionService } from '../services/suggestion.service.js';
import { suggestionRequestSchema } from '../types.js';

interface SuggestionsRouteOptions {
  service: SuggestionService;
}

/**
 * POST /api/suggestions
 * Validates the body with Zod, delegates to the service, and returns the
 * suggestions plus their `source` ("llm" | "fallback").
 */
export const suggestionsRoutes: FastifyPluginAsync<
  SuggestionsRouteOptions
> = async (fastify, opts) => {
  const { service } = opts;

  fastify.post('/api/suggestions', async (request, reply) => {
    const parsed = suggestionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => i.message)
        .join('; ');
      throw new InvalidInputError(message);
    }

    const result = await service.getSuggestions(parsed.data, request.log);
    return reply.code(200).send(result);
  });
};
