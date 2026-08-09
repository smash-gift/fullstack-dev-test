import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let instance: Firestore | undefined;

/**
 * The Firestore handle, created on first use.
 *
 * Lazy for the same reason the handler is: Cloud Functions imports this module
 * once just to discover exports, and initialising the Admin SDK then would run
 * against an environment that is not the one requests use. Inside the emulator
 * the SDK picks up FIRESTORE_EMULATOR_HOST on its own, so nothing here needs to
 * know whether it is running locally.
 */
export function firestore(): Firestore {
  if (!instance) {
    if (getApps().length === 0) {
      initializeApp();
    }
    instance = getFirestore();
  }

  return instance;
}
