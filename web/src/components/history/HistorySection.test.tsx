import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistorySection } from "./HistorySection";
import { useAuthStore } from "@/store/useAuthStore";
import { subscribeToHistoryEntries } from "@/lib/firebase/firestore";

// Cada chamada retorna um unsubscribe novo — evita que o cleanup automático do RTL entre testes
// (afterEach global em src/test/setup.ts) contamine a contagem de chamadas do teste seguinte.
vi.mock("@/lib/firebase/firestore", () => ({
  subscribeToHistoryEntries: vi.fn(() => vi.fn()),
}));

const mockedSubscribeToHistoryEntries = vi.mocked(subscribeToHistoryEntries);

const initialAuthState = useAuthStore.getState();

describe("HistorySection", () => {
  afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
    mockedSubscribeToHistoryEntries.mockClear();
  });

  it("não renderiza nada para guest", () => {
    const { container } = render(<HistorySection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza a lista de histórico para usuário autenticado", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: null,
      },
    });

    render(<HistorySection />);

    expect(
      screen.getByRole("heading", { name: /seu histórico/i })
    ).toBeInTheDocument();
  });

  it("cancela a inscrição do histórico (unsubscribe) quando o usuário desloga", async () => {
    const unsubscribeMock = vi.fn();
    mockedSubscribeToHistoryEntries.mockImplementationOnce(
      () => unsubscribeMock
    );

    useAuthStore.setState({
      status: "authenticated",
      user: {
        uid: "uid-1",
        displayName: "Fulana",
        email: "fulana@example.com",
        photoUrl: null,
      },
    });

    render(<HistorySection />);

    expect(mockedSubscribeToHistoryEntries).toHaveBeenCalledWith(
      "uid-1",
      expect.any(Function),
      expect.any(Function)
    );
    expect(unsubscribeMock).not.toHaveBeenCalled();

    useAuthStore.setState({ status: "guest", user: null });

    await waitFor(() => {
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
