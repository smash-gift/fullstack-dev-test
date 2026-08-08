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

export function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'POST',
    headers: {},
    body: { occasion: 'Birthday', relationship: 'Friend' },
    ...overrides,
  };
}
