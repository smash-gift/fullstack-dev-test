import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./useAuthStore";

const initialState = useAuthStore.getState();

describe("useAuthStore", () => {
  afterEach(() => {
    useAuthStore.setState(initialState, true);
  });

  it("inicia como guest, sem usuário", () => {
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setAuthenticatedUser muda o status para authenticated e guarda o usuário", () => {
    useAuthStore.getState().setAuthenticatedUser({
      uid: "abc123",
      displayName: "Fulana",
      email: "fulana@example.com",
      photoUrl: null,
    });

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.uid).toBe("abc123");
  });

  it("signOutToGuest volta para guest e limpa o usuário", () => {
    useAuthStore.getState().setAuthenticatedUser({
      uid: "abc123",
      displayName: "Fulana",
      email: "fulana@example.com",
      photoUrl: null,
    });

    useAuthStore.getState().signOutToGuest();

    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().user).toBeNull();
  });
});
