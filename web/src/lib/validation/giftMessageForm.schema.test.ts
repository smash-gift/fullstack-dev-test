import { describe, expect, it } from "vitest";
import { giftMessageFormSchema } from "./giftMessageForm.schema";

describe("giftMessageFormSchema", () => {
  it("aceita valores válidos de texto livre", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "aniversário de 15 anos da minha afilhada",
      relationship: "madrinha",
    });

    expect(result.success).toBe(true);
  });

  it("remove espaços nas pontas (trim) antes de validar", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "  aniversário  ",
      relationship: "  mãe  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.occasion).toBe("aniversário");
      expect(result.data.relationship).toBe("mãe");
    }
  });

  it("rejeita quando occasion está vazio", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "",
      relationship: "mãe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "occasion");
      expect(issue?.message).toBe("Descreva a ocasião.");
    }
  });

  it("rejeita quando occasion só tem espaços em branco", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "   ",
      relationship: "mãe",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita quando relationship está vazio", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "aniversário",
      relationship: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "relationship"
      );
      expect(issue?.message).toBe("Descreva a relação com essa pessoa.");
    }
  });

  it("rejeita quando os campos estão ausentes", () => {
    const result = giftMessageFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("aceita occasion com exatamente 300 caracteres", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "a".repeat(300),
      relationship: "mãe",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita occasion com mais de 300 caracteres", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "a".repeat(301),
      relationship: "mãe",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "occasion");
      expect(issue?.message).toBe(
        "A ocasião deve ter no máximo 300 caracteres."
      );
    }
  });

  it("rejeita relationship com mais de 300 caracteres", () => {
    const result = giftMessageFormSchema.safeParse({
      occasion: "aniversário",
      relationship: "a".repeat(301),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "relationship"
      );
      expect(issue?.message).toBe(
        "A relação deve ter no máximo 300 caracteres."
      );
    }
  });
});
