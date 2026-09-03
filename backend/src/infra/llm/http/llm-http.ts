import {
  LlmAuthError,
  LlmInvalidResponseError,
  LlmRateLimitError,
  LlmTimeoutError,
  LlmUnavailableError,
} from '../../../domain/errors/index.js';

export interface PostJsonOptions {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
  readonly signal: AbortSignal;
  /** Used only in error messages, never sent anywhere. */
  readonly providerName: string;
}

/**
 * The single place where an HTTP failure becomes a domain error.
 *
 * Uses `fetch` rather than a provider SDK, deliberately:
 *
 * - No dependency: `fetch` ships with Node 20, which keeps the supply-chain
 *   surface small (see docs/05-security/application-security.md).
 * - The AbortSignal contract stays ours. SDKs bring their own retry and
 *   timeout behaviour, which would compete with the policy the use case owns.
 * - Every provider status maps to a domain error explicitly, in one readable
 *   table, instead of being inferred from SDK-specific exception types.
 *
 * The cost is that request shapes are written by hand and could drift if a
 * provider changes its API. That is contained: a drifted response fails Zod
 * validation, becomes LlmInvalidResponseError, and degrades to the fallback
 * rather than corrupting data.
 */
export async function postJson(options: PostJsonOptions): Promise<unknown> {
  const response = await sendRequest(options);

  if (!response.ok) {
    throw mapStatusToDomainError(response.status, options.providerName);
  }

  try {
    return await response.json();
  } catch {
    throw new LlmInvalidResponseError(`${options.providerName} returned a non-JSON body`);
  }
}

async function sendRequest(options: PostJsonOptions): Promise<Response> {
  try {
    return await fetch(options.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    // Abort is our own timeout firing, not a provider fault.
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmTimeoutError();
    }
    // DNS failure, refused connection, TLS problem: unreachable, not invalid.
    throw new LlmUnavailableError(
      `${options.providerName} is unreachable: ${error instanceof Error ? error.name : 'unknown error'}`,
    );
  }
}

/**
 * Provider status to domain error.
 *
 * Note that "other 4xx" degrades rather than throwing an internal error. A
 * 400 from the provider usually means OUR request was malformed — a bug on
 * our side — but the user should still receive suggestions instead of a 500.
 * The log records it; the user gets the fallback.
 */
function mapStatusToDomainError(status: number, providerName: string) {
  if (status === 401 || status === 403) {
    return new LlmAuthError(`${providerName} rejected the credentials (HTTP ${status})`);
  }
  if (status === 429) {
    return new LlmRateLimitError(`${providerName} rate limit reached (HTTP 429)`);
  }
  if (status === 408 || status === 504) {
    return new LlmTimeoutError();
  }
  if (status >= 500) {
    return new LlmUnavailableError(`${providerName} returned HTTP ${status}`);
  }
  return new LlmUnavailableError(`${providerName} rejected the request (HTTP ${status})`);
}
