import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GiftMessageForm } from "./GiftMessageForm";

describe("GiftMessageForm", () => {
  it("renderiza os campos de ocasião e relação (texto livre) e o botão de submit", () => {
    render(<GiftMessageForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByLabelText(/qual é a ocasião/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/qual a relação/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /gerar mensagens/i })
    ).toBeInTheDocument();
  });

  it("mostra erros de validação ao submeter sem preencher nada", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GiftMessageForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: /gerar mensagens/i }));

    expect(await screen.findByText("Descreva a ocasião.")).toBeInTheDocument();
    expect(
      await screen.findByText("Descreva a relação com essa pessoa.")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("mostra erro quando o texto excede o limite de 300 caracteres", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GiftMessageForm onSubmit={onSubmit} isSubmitting={false} />);

    fireEvent.change(screen.getByLabelText(/qual é a ocasião/i), {
      target: { value: "a".repeat(301) },
    });
    await user.type(screen.getByLabelText(/qual a relação/i), "minha mãe");
    await user.click(screen.getByRole("button", { name: /gerar mensagens/i }));

    expect(
      await screen.findByText("A ocasião deve ter no máximo 300 caracteres.")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("chama onSubmit com os valores digitados quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<GiftMessageForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(
      screen.getByLabelText(/qual é a ocasião/i),
      "aniversário de 15 anos da minha afilhada"
    );
    await user.type(screen.getByLabelText(/qual a relação/i), "madrinha");
    await user.click(screen.getByRole("button", { name: /gerar mensagens/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        occasion: "aniversário de 15 anos da minha afilhada",
        relationship: "madrinha",
      },
      expect.anything()
    );
  });

  it("desabilita o botão de submit quando isSubmitting é true", () => {
    render(<GiftMessageForm onSubmit={vi.fn()} isSubmitting={true} />);

    expect(
      screen.getByRole("button", { name: /gerando mensagens/i })
    ).toBeDisabled();
  });
});
