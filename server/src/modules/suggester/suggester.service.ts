import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { LlmService } from '../llm/llm.service';
import { CacheService } from '../cache/cache.service';

export interface SuggestionResponse {
  status: 'success';
  data: {
    suggestions: string[];
    cached: boolean;
    provider: string;
  };
}

@Injectable()
export class SuggesterService {
  private readonly logger = new Logger(SuggesterService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly cacheService: CacheService,
  ) {}

  async getSuggestions(
    dto: CreateSuggestionDto,
  ): Promise<SuggestionResponse> {
    const language = dto.language || 'pt-BR';
    const cacheKey = this.generateCacheKey(
      dto.occasion,
      dto.relationship,
      language,
    );

    const cachedSuggestions =
      await this.cacheService.get<string[]>(cacheKey);

    if (cachedSuggestions && cachedSuggestions.length > 0) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return {
        status: 'success',
        data: {
          suggestions: cachedSuggestions,
          cached: true,
          provider: 'gemini-2.5-flash',
        },
      };
    }

    this.logger.log(`Cache MISS for key: ${cacheKey}. Invoking LLM...`);

    const suggestions = await this.llmService.generateMessage(
      dto.occasion,
      dto.relationship,
      language,
    );

    await this.cacheService.set(cacheKey, suggestions, 86400000); // 24 hours

    return {
      status: 'success',
      data: {
        suggestions,
        cached: false,
        provider: 'gemini-2.5-flash',
      },
    };
  }

  private generateCacheKey(
    occasion: string,
    relationship: string,
    language: string,
  ): string {
    const raw = `${occasion.trim().toLowerCase()}:${relationship.trim().toLowerCase()}:${language}`;
    return `suggestion:${createHash('sha256').update(raw).digest('hex')}`;
  }
}
