import {
  Injectable,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ILlmProvider,
  ILlmProviderToken,
  LlmResult,
} from './interfaces/llm-provider.interface';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly TIMEOUT_PER_PROVIDER_MS = 3000; // 3 seconds timeout per provider (RN05)

  constructor(
    @Inject(ILlmProviderToken) private readonly providers: ILlmProvider[],
  ) {}

  async generateMessage(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<LlmResult> {
    const configuredProviders = this.providers.filter((p) => p.isConfigured());

    if (configuredProviders.length === 0) {
      this.logger.warn(
        'No LLM API keys configured. All providers in fallback chain skipped.',
      );
      throw new ServiceUnavailableException(
        'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
      );
    }

    for (const provider of configuredProviders) {
      try {
        this.logger.log(`Attempting LLM Provider: ${provider.name}...`);
        const result = await this.executeWithTimeout(
          provider,
          occasion,
          relationship,
          language,
        );
        this.logger.log(`LLM Provider Succeeded: ${provider.name}`);
        return result;
      } catch (error) {
        this.logger.warn(
          `LLM Provider Failure [${provider.name}]: ${error?.message || error}. Trying next provider in fallback chain...`,
        );
      }
    }

    this.logger.error(
      'All configured LLM providers in fallback chain failed (RN04/RN05).',
    );
    throw new ServiceUnavailableException(
      'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
    );
  }

  private async executeWithTimeout(
    provider: ILlmProvider,
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<LlmResult> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Provider [${provider.name}] timed out after ${this.TIMEOUT_PER_PROVIDER_MS}ms`,
          ),
        );
      }, this.TIMEOUT_PER_PROVIDER_MS);
    });

    try {
      const result = await Promise.race([
        provider.generateSuggestions(occasion, relationship, language),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
