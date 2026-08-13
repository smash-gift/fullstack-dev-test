import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthHeader } from "./AuthHeader";
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
} from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/useAuthStore";

vi.mock("@/lib/firebase/auth", () => ({
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
  subscribeToAuthChanges: vi.fn(() => () => {}),
}));

const mockedSignInWithGoogle = vi.mocked(signInWithGoogle);
const mockedSignOutUser = vi.mocked(signOutUser);
const mockedSubscribeToAuthChanges = vi.mocked(subscribeToAuthChanges);
const initialAuthState = useAuthStore.getState();

describe("AuthHeader", () => {
  afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
    vi.clearAllMocks();
    mockedSubscribeToAuthChanges.mockReturnValue(() => {});
  });

  it("mostra o botão de login quando guest", () => {
    render(<AuthHeader />);

    expect(
      screen.getByRole("button", { name: /entrar com google/i })
    ).toBeInTheDocument();
  });

  it("chama signInWithGoogle ao clicar em entrar", async () => {
    const user = userEvent.setup();
    mockedSignInWithGoogle.mockResolvedValue({
      uid: "uid-1",
      displayName: "Fulana",
      email: "fulana@example.com",
      photoUrl: null,
    });

    render(<AuthHeader />);
    await user.click(
      screen.getByRole("button", { name: /entrar com google/i })
    );

    expect(mockedSignInWithGoogle).toHaveBeenCalled();
  });

  it("mostra mensagem de erro quando o login falha", async () => {
    const user = userEvent.setup();
    mockedSignInWithGoogle.mockRejectedValue(new Error("popup fechado"));

    render(<AuthHeader />);
    await user.click(
      screen.getByRole("button", { name: /entrar com google/i })
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("mostra nome do usuário e botão de sair quando autenticado", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: null,
      },
    });

    render(<AuthHeader />);

    expect(screen.getByText("Fulana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("mostra a foto de perfil quando photoUrl está presente", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: "https://lh3.googleusercontent.com/a/abc123",
      },
    });

    const { container } = render(<AuthHeader />);

    const avatar = container.querySelector("img");
    expect(avatar).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/a/abc123"
    );
  });

  it("mostra as iniciais quando photoUrl é null", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: null,
      },
    });

    const { container } = render(<AuthHeader />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("chama signOutUser e volta para guest ao clicar em sair", async () => {
    const user = userEvent.setup();
    mockedSignOutUser.mockResolvedValue(undefined);
    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: null,
      },
    });

    render(<AuthHeader />);
    await user.click(screen.getByRole("button", { name: /sair/i }));

    expect(mockedSignOutUser).toHaveBeenCalled();
    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe("guest");
    });
  });

  it("assina subscribeToAuthChanges e atualiza a store quando o callback é notificado", () => {
    let capturedCallback:
      | ((user: {
          uid: string;
          displayName: string | null;
          email: string | null;
          photoUrl: string | null;
        } | null) => void)
      | undefined;

    mockedSubscribeToAuthChanges.mockImplementation((callback) => {
      capturedCallback = callback;
      return () => {};
    });

    render(<AuthHeader />);

    capturedCallback?.({
      uid: "uid-2",
      displayName: "Beltrana",
      email: "beltrana@example.com",
      photoUrl: null,
    });

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.uid).toBe("uid-2");
  });
});
