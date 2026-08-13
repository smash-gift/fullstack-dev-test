import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GiftCard } from "./GiftCard";

describe("GiftCard", () => {
  it("renderiza a mensagem escolhida e o contexto de ocasião/relação", () => {
    render(
      <GiftCard
        message="Feliz aniversário, mãe! Você é incrível."
        occasionLabel="Aniversário"
        relationshipLabel="Mãe"
      />
    );

    expect(
      screen.getByText("Feliz aniversário, mãe! Você é incrível.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Aniversário/)).toBeInTheDocument();
    expect(screen.getByText(/Mãe/)).toBeInTheDocument();
  });
});
