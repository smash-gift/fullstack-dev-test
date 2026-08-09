import { getAuth } from 'firebase-admin/auth';

import { ensureAdminApp } from '../firebase/adminApp';
import type { TokenVerifier, VerifiedCaller } from './tokenVerifier';

/**
 * Kept apart from the `TokenVerifier` interface so that importing the contract
 * does not drag the Admin SDK along. The handler needs the contract; only the
 * composition root needs this.
 */
export class FirebaseTokenVerifier implements TokenVerifier {
  async verify(token: string): Promise<VerifiedCaller> {
    ensureAdminApp();
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  }
}
