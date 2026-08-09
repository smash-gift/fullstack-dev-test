import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { ensureAdminApp } from '../firebase/adminApp';

let instance: Firestore | undefined;

/** The Firestore handle, created on first use. */
export function firestore(): Firestore {
  if (!instance) {
    ensureAdminApp();
    instance = getFirestore();
  }

  return instance;
}
