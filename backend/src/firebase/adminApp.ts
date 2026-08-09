import { getApps, initializeApp } from 'firebase-admin/app';

/**
 * Initialises the Admin SDK once, on first use.
 *
 * Shared by Firestore and Auth so neither owns the other's setup. Lazy for the
 * same reason everything else here is: Cloud Functions imports these modules
 * once merely to discover the exported functions, in an environment that is not
 * the one requests run under. Inside the emulator the SDK finds
 * FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST by itself.
 */
export function ensureAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}
