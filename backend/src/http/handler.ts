import { randomUUID } from 'node:crypto';

import type { SuggestionService } from '../domain/suggestionService';
import type { Logger } from '../domain/types';
import { validateInput } from '../domain/validateInput';
import { applyCors, isPreflight } from './cors';
import { ErrorCode, sendError, sendSuggestions } from './responses';
import type { HttpRequest, HttpResponse } from './types';

export interface HandlerDeps {
  service: SuggestionService;
  logger: Logger;
  allowedOrigins: readonly string[];
}

export type Handler = (req: HttpRequest, res: HttpResponse) => Promise<void>;

/**
 * The HTTP edge: CORS, method, body shape, validation, and the single response
 * format. Every decision about *which* suggestions to return lives in the
 * service; this function only translates between HTTP and the domain.
 */
export function createHandler(deps: HandlerDeps): Handler {
  return async function handle(req: HttpRequest, res: HttpResponse): Promise<void> {
    const requestId = randomUUID();
    res.set('X-Request-Id', requestId);

    applyCors(req, res, deps.allowedOrigins);

    if (isPreflight(req)) {
      res.status(204).send();
      return;
    }

    if (req.method.toUpperCase() !== 'POST') {
      sendError(
        res,
        405,
        ErrorCode.MethodNotAllowed,
        'Use POST to request suggestions.',
      );
      return;
    }

    const validation = validateInput(parseBody(req.body));
    if (!validation.ok) {
      sendError(res, 400, ErrorCode.InvalidInput, validation.message);
      return;
    }

    try {
      const result = await deps.service.suggest(validation.value);
      sendSuggestions(res, result);
    } catch (error) {
      // The service already absorbs model and cache failures, so reaching this
      // point means a genuine bug. The client gets a generic message; the
      // details stay in the log, tied to the request id we sent back.
      deps.logger.error('unhandled_request_failure', {
        requestId,
        reason: error instanceof Error ? error.stack ?? error.message : 'unknown',
      });
      sendError(res, 500, ErrorCode.InternalError, 'Something went wrong.');
    }
  };
}

/**
 * Cloud Functions parses JSON bodies for us, but a request sent without the
 * JSON content type arrives as a string or a Buffer.
 */
function parseBody(body: unknown): unknown {
  if (typeof body !== 'string' && !Buffer.isBuffer(body)) {
    return body;
  }

  try {
    return JSON.parse(body.toString());
  } catch {
    return null;
  }
}
