import { create } from "zustand";

export interface AuthenticatedUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

interface AuthState {
  status: "guest" | "authenticated";
  user: AuthenticatedUser | null;
  setAuthenticatedUser: (user: AuthenticatedUser) => void;
  signOutToGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "guest",
  user: null,
  setAuthenticatedUser: (user) => set({ status: "authenticated", user }),
  signOutToGuest: () => set({ status: "guest", user: null }),
}));
