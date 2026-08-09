/**
 * The slice of Express's request and response the handler actually uses.
 *
 * Declaring it structurally instead of importing Express lets the handler be
 * tested with plain object literals, and keeps the HTTP framework a detail of
 * the runtime rather than something the code depends on.
 */
export interface HttpRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface HttpResponse {
  status(code: number): HttpResponse;
  set(name: string, value: string): HttpResponse;
  json(payload: unknown): unknown;
  send(payload?: unknown): unknown;
}
