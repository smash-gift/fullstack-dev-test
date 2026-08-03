import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import { createApp } from './app';
import { FirestoreSuggestionCache } from './cache/firestoreCache';
import { config } from './config/env';
import { createFirebaseAuthMiddleware } from './middleware/auth';

/**
 * Firebase Cloud Functions entry point.
 *
 * The very same Express app that powers the standalone server is exported here
 * as an HTTPS function — the payoff of keeping `createApp()` separate from the
 * server bootstrap. On this path it is wired with the Firebase-native pieces:
 *   - Firestore-backed cache (shared, survives cold starts),
 *   - Firebase Auth (every request must carry a valid ID token).
 *
 * Runs fully against the Firebase Local Emulator Suite — no cloud project or
 * billing required (see the README "Firebase" section).
 */
initializeApp();

const app = createApp({
  cache: new FirestoreSuggestionCache(getFirestore(), config.cache.ttlMs),
  authMiddleware: createFirebaseAuthMiddleware(),
});

export const api = onRequest({ region: 'us-central1' }, app);
