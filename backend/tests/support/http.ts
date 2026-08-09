import type { HttpRequest, HttpResponse } from '../../src/http/types';

export class FakeResponse implements HttpResponse {
  statusCode = 200;
  body: unknown = undefined;
  readonly headers: Record<string, string> = {};

  status(code: number): HttpResponse {
    this.statusCode = code;
    return this;
  }

  set(name: string, value: string): HttpResponse {
    this.headers[name] = value;
    return this;
  }

  json(payload: unknown): unknown {
    this.body = payload;
    return this;
  }

  send(payload?: unknown): unknown {
    this.body = payload;
    return this;
  }
}

/**
 * A valid request by default. Header overrides are merged rather than replacing
 * the set, so a test that cares about Origin does not silently drop the
 * Authorization header and end up asserting against a 401.
 */
export function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  const { headers, ...rest } = overrides;

  return {
    method: 'POST',
    body: { occasion: 'Birthday', relationship: 'Friend' },
    ...rest,
    headers: { authorization: 'Bearer valid-token', ...headers },
  };
}
