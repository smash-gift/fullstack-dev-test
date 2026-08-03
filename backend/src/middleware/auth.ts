import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { getAuth } from 'firebase-admin/auth';

/**
 * Builds an Express middleware that requires a valid Firebase ID token
 * (`Authorization: Bearer <token>`). Verified via the Admin SDK — which, under
 * the emulator, talks to the Auth emulator automatically.
 *
 * Exposed as a factory (rather than a plain middleware) so `firebase-admin` is
 * only imported/initialized on the Functions path; the standalone server never
 * loads it. On success the decoded uid is attached to `req.user`.
 */
export function createFirebaseAuthMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization ?? '';
    const match = /^Bearer (.+)$/i.exec(header);
    if (!match) {
      res.status(401).json({ error: 'unauthorized', message: 'Missing bearer token.' });
      return;
    }

    getAuth()
      .verifyIdToken(match[1])
      .then((decoded) => {
        (req as Request & { user?: { uid: string } }).user = { uid: decoded.uid };
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token.' });
      });
  };
}
