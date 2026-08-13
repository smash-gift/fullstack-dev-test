import { z } from "zod";

const MAX_FIELD_LENGTH = 300;

export const giftMessageFormSchema = z.object({
  occasion: z
    .string({ message: "Descreva a ocasião." })
    .trim()
    .min(1, "Descreva a ocasião.")
    .max(
      MAX_FIELD_LENGTH,
      `A ocasião deve ter no máximo ${MAX_FIELD_LENGTH} caracteres.`,
    ),
  relationship: z
    .string({ message: "Descreva a relação com essa pessoa." })
    .trim()
    .min(1, "Descreva a relação com essa pessoa.")
    .max(
      MAX_FIELD_LENGTH,
      `A relação deve ter no máximo ${MAX_FIELD_LENGTH} caracteres.`,
    ),
});

export type GiftMessageFormValues = z.infer<typeof giftMessageFormSchema>;
