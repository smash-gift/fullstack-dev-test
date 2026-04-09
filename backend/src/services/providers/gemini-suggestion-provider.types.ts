export type GenerateContentResultLike = {
  response:
    | {
        text(): string;
      }
    | Promise<{
        text(): string;
      }>;
};

export type GenerativeModelLike = {
  generateContent(prompt: string): Promise<GenerateContentResultLike>;
};

export type GenerativeModelFactory = (
  modelName: string,
  apiVersion: string,
) => GenerativeModelLike;