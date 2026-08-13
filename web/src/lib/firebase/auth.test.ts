import { afterEach, describe, expect, it, vi } from "vitest";

const signInWithPopupMock = vi.fn();
const signOutMock = vi.fn();
const onAuthStateChangedMock = vi.fn();
const getAuthMock = vi.fn(() => ({ id: "auth" }));

class FakeGoogleAuthProvider {}

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: FakeGoogleAuthProvider,
  getAuth: getAuthMock,
  signInWithPopup: signInWithPopupMock,
  signOut: signOutMock,
  onAuthStateChanged: onAuthStateChangedMock,
}));

const isFirebaseConfiguredMock = vi.fn(() => true);
const getFirebaseAppMock = vi.fn(() => ({ id: "app" }));

vi.mock("./client", () => ({
  getFirebaseApp: getFirebaseAppMock,
  isFirebaseConfigured: isFirebaseConfiguredMock,
}));

const upsertUserProfileMock = vi.fn().mockResolvedValue(undefined);

vi.mock("./firestore", () => ({
  upsertUserProfile: upsertUserProfileMock,
}));

const { signInWithGoogle, signOutUser, subscribeToAuthChanges } =
  await import("./auth");

describe("signInWithGoogle", () => {
  afterEach(() => vi.clearAllMocks());

  it("retorna o usuário mapeado a partir da credencial do Google", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoURL: "https://example.com/photo.png",
      },
    });

    const result = await signInWithGoogle();

    expect(result).toEqual({
      uid: "uid-1",
      displayName: "Fulana",
      email: "fulana@example.com",
      photoUrl: "https://example.com/photo.png",
    });
  });
});

describe("signOutUser", () => {
  afterEach(() => vi.clearAllMocks());

  it("chama signOut do Firebase Auth", async () => {
    signOutMock.mockResolvedValue(undefined);

    await signOutUser();

    expect(signOutMock).toHaveBeenCalled();
  });
});

describe("subscribeToAuthChanges", () => {
  afterEach(() => vi.clearAllMocks());

  it("retorna um no-op e não assina nada quando o Firebase não está configurado", () => {
    isFirebaseConfiguredMock.mockReturnValue(false);
    const onChange = vi.fn();

    const unsubscribe = subscribeToAuthChanges(onChange);

    expect(onAuthStateChangedMock).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });

  it("chama onChange(null) e não faz upsert quando não há usuário autenticado", () => {
    isFirebaseConfiguredMock.mockReturnValue(true);
    const onChange = vi.fn();
    onAuthStateChangedMock.mockImplementation(
      (_auth: unknown, callback: (user: unknown) => void) => {
        callback(null);
        return () => {};
      }
    );

    subscribeToAuthChanges(onChange);

    expect(onChange).toHaveBeenCalledWith(null);
    expect(upsertUserProfileMock).not.toHaveBeenCalled();
  });

  it("mapeia o usuário, chama onChange e faz upsert do perfil quando há usuário", () => {
    isFirebaseConfiguredMock.mockReturnValue(true);
    const onChange = vi.fn();
    onAuthStateChangedMock.mockImplementation(
      (_auth: unknown, callback: (user: unknown) => void) => {
        callback({
          uid: "uid-2",
          displayName: "Beltrana",
          email: "beltrana@example.com",
          photoURL: null,
        });
        return () => {};
      }
    );

    subscribeToAuthChanges(onChange);

    const expectedUser = {
      uid: "uid-2",
      displayName: "Beltrana",
      email: "beltrana@example.com",
      photoUrl: null,
    };

    expect(onChange).toHaveBeenCalledWith(expectedUser);
    expect(upsertUserProfileMock).toHaveBeenCalledWith(expectedUser);
  });
});
