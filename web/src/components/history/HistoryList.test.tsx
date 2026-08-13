import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoryList } from "./HistoryList";
import { subscribeToHistoryEntries } from "@/lib/firebase/firestore";
import type { HistoryEntry } from "@/lib/firebase/firestore";

vi.mock("@/lib/firebase/firestore", () => ({
  subscribeToHistoryEntries: vi.fn(),
}));

const mockedSubscribeToHistoryEntries = vi.mocked(subscribeToHistoryEntries);

let capturedOnUpdate: ((entries: HistoryEntry[]) => void) | undefined;
let capturedOnError: ((error: unknown) => void) | undefined;

describe("HistoryList", () => {
  afterEach(() => {
    mockedSubscribeToHistoryEntries.mockReset();
    capturedOnUpdate = undefined;
    capturedOnError = undefined;
  });

  /** Fresh unsubscribe mock por chamada — evita contaminação entre testes pelo cleanup automático do RTL. */
  function setupSubscribeMock() {
    const unsubscribeMock = vi.fn();
    mockedSubscribeToHistoryEntries.mockImplementation(
      (_uid, onUpdate, onError) => {
        capturedOnUpdate = onUpdate;
        capturedOnError = onError;
        return unsubscribeMock;
      }
    );
    return unsubscribeMock;
  }

  it("mostra loading e depois a lista de entradas quando o onSnapshot dispara", () => {
    setupSubscribeMock();

    render(<HistoryList uid="uid-1" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(mockedSubscribeToHistoryEntries).toHaveBeenCalledWith(
      "uid-1",
      expect.any(Function),
      expect.any(Function)
    );

    act(() => {
      capturedOnUpdate?.([
        {
          id: "entry-1",
          occasion: "aniversário",
          relationship: "mãe",
          messageOptions: ["a", "b", "c"],
          selectedMessage: "Feliz aniversário, mãe!",
          createdAt: new Date("2026-08-01T10:00:00Z"),
        },
      ]);
    });

    expect(screen.getByText("Feliz aniversário, mãe!")).toBeInTheDocument();
  });

  it("atualiza a lista quando o callback do onSnapshot dispara de novo (tempo real)", () => {
    setupSubscribeMock();

    render(<HistoryList uid="uid-1" />);

    act(() => {
      capturedOnUpdate?.([
        {
          id: "entry-1",
          occasion: "aniversário",
          relationship: "mãe",
          messageOptions: ["a", "b", "c"],
          selectedMessage: "Feliz aniversário, mãe!",
          createdAt: new Date("2026-08-01T10:00:00Z"),
        },
      ]);
    });
    expect(screen.getByText("Feliz aniversário, mãe!")).toBeInTheDocument();

    act(() => {
      capturedOnUpdate?.([
        {
          id: "entry-2",
          occasion: "formatura",
          relationship: "amiga",
          messageOptions: ["x", "y", "z"],
          selectedMessage: "Parabéns pela formatura!",
          createdAt: new Date("2026-08-05T10:00:00Z"),
        },
      ]);
    });

    expect(screen.getByText("Parabéns pela formatura!")).toBeInTheDocument();
    expect(
      screen.queryByText("Feliz aniversário, mãe!")
    ).not.toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há entradas", () => {
    setupSubscribeMock();

    render(<HistoryList uid="uid-1" />);

    act(() => {
      capturedOnUpdate?.([]);
    });

    expect(
      screen.getByText(/ainda não gerou nenhuma mensagem/i)
    ).toBeInTheDocument();
  });

  it("mostra o estado de erro quando a inscrição falha", () => {
    setupSubscribeMock();

    render(<HistoryList uid="uid-1" />);

    act(() => {
      capturedOnError?.(new Error("firestore indisponível"));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("cancela a inscrição (unsubscribe) quando o componente desmonta", () => {
    const unsubscribeMock = setupSubscribeMock();

    const { unmount } = render(<HistoryList uid="uid-1" />);
    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
