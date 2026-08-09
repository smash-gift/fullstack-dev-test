import { randomUUID } from 'node:crypto';

import type { SuggestionService } from '../domain/suggestionService';
import type { Logger, RateLimiter } from '../domain/types';
import { validateInput } from '../domain/validateInput';
import { applyCors, isPreflight } from './cors';
import { ErrorCode, sendError, sendSuggestions } from './responses';
import type { HttpRequest, HttpResponse } from './types';

export interface HandlerDeps {
  service: SuggestionService;
  rateLimiter: RateLimiter;
  logger: Logger;
  allowedOrigins: readonly string[];
}

export type Handler = (req: HttpRequest, res: HttpResponse) => Promise<void>;

/**
 * The HTTP edge: CORS, method, rate limit, body shape, validation, and the
 * single response format. Every decision about *which* suggestions to return
 * lives in the service; this function only translates between HTTP and the
 * domain.
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
      sendError(res, 405, ErrorCode.MethodNotAllowed, 'Use POST to request suggestions.');
      return;
    }

    // Ahead of validation on purpose: a client hammering the endpoint with
    // malformed bodies is exactly the traffic a limit is there to stop.
    const decision = await consumeRateLimit(deps, clientKey(req), requestId);
    if (!decision.allowed) {
      res.set('Retry-After', String(decision.retryAfterSeconds));
      sendError(res, 429, ErrorCode.RateLimited, 'Too many requests. Try again shortly.');
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
        reason: error instanceof Error ? (error.stack ?? error.message) : 'unknown',
      });
      sendError(res, 500, ErrorCode.InternalError, 'Something went wrong.');
    }
  };
}

/**
 * Consults the limiter, failing open.
 *
 * If the counter store is unreachable, the choice is between refusing everyone
 * and briefly not enforcing a limit. For this product the second is clearly
 * less bad: the limit protects cost, and an outage of the counter should not
 * become an outage of the service. The trade-off is that an attacker able to
 * break Firestore also removes the limit — noted in the README.
 */
async function consumeRateLimit(
  deps: HandlerDeps,
  key: string,
  requestId: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    return await deps.rateLimiter.consume(key);
  } catch (error) {
    deps.logger.warn('rate_limit_unavailable', {
      requestId,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * Who the limit is counted against.
 *
 * The client address for now; stage 5 replaces it with the authenticated user
 * id, which is fairer — one office behind a single address is many people, and
 * one person can change address freely.
 */
function clientKey(req: HttpRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  return sanitizeKey(req.ip ?? first ?? 'unknown');
}

/** Firestore document ids cannot contain a slash. */
function sanitizeKey(value: string): string {
  return value.replace(/\//g, '_');
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
