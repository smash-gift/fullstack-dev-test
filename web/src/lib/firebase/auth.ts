import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import type { AuthenticatedUser } from "@/store/useAuthStore";
import { getFirebaseApp, isFirebaseConfigured } from "./client";
import { upsertUserProfile } from "./firestore";

export async function signInWithGoogle(): Promise<AuthenticatedUser> {
  const auth = getAuth(getFirebaseApp());
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);

  return mapFirebaseUser(credential.user);
}

export async function signOutUser(): Promise<void> {
  const auth = getAuth(getFirebaseApp());
  await signOut(auth);
}

function mapFirebaseUser(firebaseUser: FirebaseUser): AuthenticatedUser {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoUrl: firebaseUser.photoURL,
  };
}

export function subscribeToAuthChanges(
  onChange: (user: AuthenticatedUser | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    return () => {};
  }

  const auth = getAuth(getFirebaseApp());

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null);
      return;
    }

    const user = mapFirebaseUser(firebaseUser);
    onChange(user);
    void upsertUserProfile(user);
  });
}
