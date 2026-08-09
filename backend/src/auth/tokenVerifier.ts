export interface VerifiedCaller {
  uid: string;
}

/**
 * Turns an ID token into a caller identity, or throws.
 *
 * An interface so the handler can be tested without the Admin SDK — this file
 * deliberately imports nothing, since anything it pulls in the request path
 * pulls in too — and so a different identity provider would be a swap at the
 * composition root rather than an edit to the request path.
 */
export interface TokenVerifier {
  verify(token: string): Promise<VerifiedCaller>;
}

/**
 * Pulls the token out of an Authorization header.
 *
 * Returns undefined rather than throwing: a missing token and a malformed one
 * are the same answer to the client, and the difference is only worth a log
 * line.
 */
export function bearerToken(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) {
    return undefined;
  }

  const [scheme, token] = value.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token || token.trim().length === 0) {
    return undefined;
  }

  return token.trim();
}
