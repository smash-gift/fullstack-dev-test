import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GiftFlow } from "./GiftFlow";
import { generateMessages } from "@/lib/api/generateMessages";
import { addHistoryEntry } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";

vi.mock("@/lib/api/generateMessages", () => ({
  generateMessages: vi.fn(),
  GenerateMessagesError: class GenerateMessagesError extends Error {},
}));

vi.mock("@/lib/firebase/firestore", () => ({
  addHistoryEntry: vi.fn().mockResolvedValue(undefined),
}));

const mockedGenerateMessages = vi.mocked(generateMessages);
const mockedAddHistoryEntry = vi.mocked(addHistoryEntry);
const initialAuthState = useAuthStore.getState();

async function fillAndSubmitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText(/qual é a ocasião/i),
    "aniversário de 15 anos"
  );
  await user.type(screen.getByLabelText(/qual a relação/i), "minha afilhada");
  await user.click(screen.getByRole("button", { name: /gerar mensagens/i }));
}

describe("GiftFlow", () => {
  beforeEach(() => {
    mockedGenerateMessages.mockReset();
    mockedAddHistoryEntry.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
  });

  it("mostra o formulário no estado inicial", () => {
    render(<GiftFlow />);
    expect(
      screen.getByRole("button", { name: /gerar mensagens/i })
    ).toBeInTheDocument();
  });

  it("percorre form -> loading -> options -> result", async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { messages: string[] }) => void = () => {};
    mockedGenerateMessages.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<GiftFlow />);
    await fillAndSubmitForm(user);

    expect(screen.getByRole("status")).toBeInTheDocument();

    resolvePromise({ messages: ["Opção A", "Opção B", "Opção C"] });

    await waitFor(() => {
      expect(screen.getByText("Opção A")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Opção B"));

    expect(screen.getByText("Opção B")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /gerar novamente/i })
    ).toBeInTheDocument();
  });

  it("volta ao formulário ao clicar em gerar novamente após um resultado", async () => {
    const user = userEvent.setup();
    mockedGenerateMessages.mockResolvedValue({
      messages: ["Opção A", "Opção B", "Opção C"],
    });

    render(<GiftFlow />);
    await fillAndSubmitForm(user);

    await waitFor(() => screen.getByText("Opção A"));
    await user.click(screen.getByText("Opção A"));

    await user.click(screen.getByRole("button", { name: /gerar novamente/i }));

    expect(
      screen.getByRole("button", { name: /gerar mensagens/i })
    ).toBeInTheDocument();
  });

  it("mostra o estado de erro quando o backend falha e permite tentar novamente", async () => {
    const user = userEvent.setup();
    mockedGenerateMessages.mockRejectedValue(new Error("falha de rede"));

    render(<GiftFlow />);
    await fillAndSubmitForm(user);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(
      screen.getByRole("button", { name: /gerar mensagens/i })
    ).toBeInTheDocument();
  });

  it("mostra o estado vazio quando o backend responde sem mensagens", async () => {
    const user = userEvent.setup();
    mockedGenerateMessages.mockResolvedValue({ messages: [] });

    render(<GiftFlow />);
    await fillAndSubmitForm(user);

    expect(
      await screen.findByText(/nenhuma mensagem foi gerada/i)
    ).toBeInTheDocument();
  });

  describe("gerar outras opções (regeneração)", () => {
    async function reachOptionsStep(user: ReturnType<typeof userEvent.setup>) {
      mockedGenerateMessages.mockResolvedValueOnce({
        messages: ["Opção A", "Opção B", "Opção C"],
      });

      render(<GiftFlow />);
      await fillAndSubmitForm(user);
      await waitFor(() => screen.getByText("Opção A"));
    }

    it("dispara generateMessages com os valores já preenchidos ao clicar no botão", async () => {
      const user = userEvent.setup();
      await reachOptionsStep(user);
      mockedGenerateMessages.mockResolvedValueOnce({
        messages: ["Opção D", "Opção E", "Opção F"],
      });

      await user.click(
        screen.getByRole("button", { name: /gerar outras opções/i })
      );

      await waitFor(() => screen.getByText("Opção D"));

      expect(mockedGenerateMessages).toHaveBeenCalledTimes(2);
      expect(mockedGenerateMessages).toHaveBeenNthCalledWith(1, {
        occasion: "aniversário de 15 anos",
        relationship: "minha afilhada",
      });
      expect(mockedGenerateMessages).toHaveBeenNthCalledWith(2, {
        occasion: "aniversário de 15 anos",
        relationship: "minha afilhada",
        regenerate: true,
      });
    });

    it("mostra skeletons e substitui o botão pela mensagem de carregamento durante a regeneração", async () => {
      const user = userEvent.setup();
      await reachOptionsStep(user);

      let resolveRegeneration: (value: { messages: string[] }) => void = () => {};
      mockedGenerateMessages.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRegeneration = resolve;
        })
      );

      await user.click(
        screen.getByRole("button", { name: /gerar outras opções/i })
      );

      expect(
        screen.queryByRole("button", { name: /gerar outras opções/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText(/gerando novas opções/i)).toBeInTheDocument();
      expect(screen.queryByText("Opção A")).not.toBeInTheDocument();

      resolveRegeneration({ messages: ["Opção D", "Opção E", "Opção F"] });

      await waitFor(() => screen.getByText("Opção D"));
      expect(
        screen.getByRole("button", { name: /gerar outras opções/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/gerando novas opções/i)).not.toBeInTheDocument();
    });

    it("mantém as mensagens antigas visíveis e mostra erro inline quando a regeneração falha", async () => {
      const user = userEvent.setup();
      await reachOptionsStep(user);
      mockedGenerateMessages.mockRejectedValueOnce(new Error("falha de rede"));

      await user.click(
        screen.getByRole("button", { name: /gerar outras opções/i })
      );

      await waitFor(() => screen.getByRole("alert"));

      expect(screen.getByText("Opção A")).toBeInTheDocument();
      expect(screen.getByText("Opção B")).toBeInTheDocument();
      expect(screen.getByText("Opção C")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /gerar outras opções/i })
      ).toBeInTheDocument();
    });

    it("não dispara uma segunda chamada enquanto a regeneração ainda está em andamento", async () => {
      const user = userEvent.setup();
      await reachOptionsStep(user);

      mockedGenerateMessages.mockReturnValueOnce(new Promise(() => {}));

      await user.click(
        screen.getByRole("button", { name: /gerar outras opções/i })
      );

      expect(
        screen.queryByRole("button", { name: /gerar outras opções/i })
      ).not.toBeInTheDocument();
      expect(mockedGenerateMessages).toHaveBeenCalledTimes(2);
    });
  });

  describe("histórico (Firestore)", () => {
    it("não grava histórico quando o usuário é guest", async () => {
      const user = userEvent.setup();
      mockedGenerateMessages.mockResolvedValue({
        messages: ["Opção A", "Opção B", "Opção C"],
      });

      render(<GiftFlow />);
      await fillAndSubmitForm(user);
      await waitFor(() => screen.getByText("Opção A"));
      await user.click(screen.getByText("Opção A"));

      expect(mockedAddHistoryEntry).not.toHaveBeenCalled();
    });

    it("grava uma entrada no histórico quando o usuário autenticado seleciona uma mensagem", async () => {
      useAuthStore.setState({
        status: "authenticated",
        user: {
          uid: "user-1",
          displayName: "Fulana",
          email: "fulana@example.com",
          photoUrl: null,
        },
      });

      const user = userEvent.setup();
      mockedGenerateMessages.mockResolvedValue({
        messages: ["Opção A", "Opção B", "Opção C"],
      });

      render(<GiftFlow />);
      await fillAndSubmitForm(user);
      await waitFor(() => screen.getByText("Opção A"));
      await user.click(screen.getByText("Opção A"));

      expect(mockedAddHistoryEntry).toHaveBeenCalledWith("user-1", {
        occasion: "aniversário de 15 anos",
        relationship: "minha afilhada",
        messageOptions: ["Opção A", "Opção B", "Opção C"],
        selectedMessage: "Opção A",
      });
    });
  });
});
