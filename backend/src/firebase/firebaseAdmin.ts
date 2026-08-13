import * as admin from "firebase-admin";
import { getEnv } from "../config/env";

let app: admin.app.App | null = null;

export function getFirebaseAdminApp(): admin.app.App {
  if (!app) {
    const env = getEnv();
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdminApp().firestore();
}

export default { getFirebaseAdminApp, getFirestore };
