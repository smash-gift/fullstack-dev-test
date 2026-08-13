import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageOptionsList } from "./MessageOptionsList";

const options = ["Primeira opção", "Segunda opção", "Terceira opção"];

describe("MessageOptionsList", () => {
  it("renderiza as 3 opções recebidas", () => {
    render(<MessageOptionsList options={options} onSelect={vi.fn()} />);

    for (const option of options) {
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  });

  it("chama onSelect com o texto da opção escolhida", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MessageOptionsList options={options} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: /Segunda opção/ })
    );

    expect(onSelect).toHaveBeenCalledWith("Segunda opção");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("mostra skeletons no lugar dos cards quando isRegenerating é true", () => {
    const { container } = render(
      <MessageOptionsList options={options} onSelect={vi.fn()} isRegenerating />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    for (const option of options) {
      expect(screen.queryByText(option)).not.toBeInTheDocument();
    }

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(options.length);
  });

  it("volta a mostrar os cards reais quando isRegenerating é false", () => {
    render(<MessageOptionsList options={options} onSelect={vi.fn()} />);

    for (const option of options) {
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  });
});
