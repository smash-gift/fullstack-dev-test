import {
  Injectable,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ILlmProvider,
  ILlmProviderToken,
} from './interfaces/llm-provider.interface';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly TIMEOUT_MS = 7000; // 7000ms execution timeout per RN04

  constructor(
    @Inject(ILlmProviderToken) private readonly provider: ILlmProvider,
  ) {}

  async generateMessage(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<string[]> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `LLM provider call timed out after ${this.TIMEOUT_MS}ms (RN04)`,
          ),
        );
      }, this.TIMEOUT_MS);
    });

    try {
      const suggestions = await Promise.race([
        this.provider.generateSuggestions(occasion, relationship, language),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);
      return suggestions;
    } catch (error) {
      clearTimeout(timeoutId);
      this.logger.error(
        `LLM Provider Failure: ${error?.message || error}`,
        error?.stack,
      );
      throw new ServiceUnavailableException(
        'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
      );
    }
  }
}
