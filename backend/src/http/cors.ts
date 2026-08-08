import type { HttpRequest, HttpResponse } from './types';

const ALLOWED_METHODS = 'POST, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization';
const PREFLIGHT_MAX_AGE_SECONDS = '3600';

/**
 * Applies CORS headers.
 *
 * Flutter Web sends a preflight for this endpoint because the request carries
 * an Authorization header and a JSON content type, so without this the browser
 * blocks the call before the handler ever runs.
 */
export function applyCors(
  req: HttpRequest,
  res: HttpResponse,
  allowedOrigins: readonly string[],
): void {
  const origin = headerValue(req, 'origin');

  if (allowedOrigins.includes('*')) {
    res.set('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    // Caches must not serve one origin's response to another.
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.set('Access-Control-Max-Age', PREFLIGHT_MAX_AGE_SECONDS);
}

export function isPreflight(req: HttpRequest): boolean {
  return req.method.toUpperCase() === 'OPTIONS';
}

function headerValue(req: HttpRequest, name: string): string | undefined {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] : raw;
}
