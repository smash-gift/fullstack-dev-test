import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIAdapter, type AIResponse } from './ai.adapter';
import { StatusCodes } from 'http-status-codes';
import { AppError, NotFoundError } from '../../utils/errors';

export class GeminiAdapter extends AIAdapter {
  private readonly MODEL_PRIORITY = [
    'gemini-2.5-flash', // 1ª Opção: Melhor custo-benefício atual
    'gemini-2.5-flash-lite', // 2ª Opção: Mais rápido/barato se o principal falhar
    'gemini-2.0-flash', // 3ª Opção: Versão anterior estável
    'gemini-2.5-pro', // 4ª Opção: "Tanque de guerra" (mais lento/caro, mas resolve tudo)
  ];

  protected modelName: string;
  protected apiKey: string;
  private genAI: GoogleGenerativeAI;

  constructor(modelName: string, apiKey: string) {
    super(apiKey, modelName);
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async suggestMessage(prompt: string, retries = 3, modelIndex = 0): Promise<AIResponse> {
    const currentModelName =
      modelIndex < this.MODEL_PRIORITY.length ? this.MODEL_PRIORITY[modelIndex] : this.modelName;

    try {
      console.info(
        `[GeminiAdapter] - Tentando modelo: ${currentModelName} (Retentativas: ${retries})`,
      );

      const model = this.genAI.getGenerativeModel({
        model: currentModelName || this.modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const phrases: string[] = JSON.parse(response.text());

      return {
        result: phrases,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        model: this.modelName,
      };
    } catch (error: any) {
      const maxRetries = 4;
      const isRetryable =
        error.status === StatusCodes.SERVICE_UNAVAILABLE ||
        error.status === StatusCodes.TOO_MANY_REQUESTS;

      if (isRetryable && retries > 0) {
        const waitTime = (maxRetries - retries) * 1000;
        console.warn(
          `[GeminiAdapter] Erro ${error.status}. Tentando novamente em ${waitTime}ms...`,
        );

        await new Promise((res) => setTimeout(res, waitTime));
        return this.suggestMessage(prompt, retries - 1, modelIndex);
      }

      const isNotFound = error.status === StatusCodes.NOT_FOUND;
      const nextModelIndex = modelIndex + 1;

      if (
        (isNotFound || (isRetryable && retries === 0)) &&
        nextModelIndex < this.MODEL_PRIORITY.length
      ) {
        console.error(
          `[GeminiAdapter] Modelo ${currentModelName} falhou/expirou. Mudando para fallback...`,
        );

        // Reset
        return this.suggestMessage(prompt, 3, nextModelIndex);
      }

      // Se chegamos aqui, todas as tentativas falharam
      if (error.status === StatusCodes.NOT_FOUND) {
        throw new NotFoundError(`Modelo AI não encontrado ou não suportado: ${currentModelName}`);
      }

      throw new AppError(
        error.message || 'Erro inesperado na integração com Gemini',
        error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
