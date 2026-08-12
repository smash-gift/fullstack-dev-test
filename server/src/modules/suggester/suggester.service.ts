import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { LlmService } from '../llm/llm.service';
import { CacheService } from '../cache/cache.service';

export interface SuggestionResponseData {
  suggestions: string[];
  cached: boolean;
  provider: string;
}

export interface SuggestionResponse {
  status: 'success';
  data: SuggestionResponseData;
}

@Injectable()
export class SuggesterService {
  private readonly logger = new Logger(SuggesterService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly cacheService: CacheService,
  ) {}

  async getSuggestions(dto: CreateSuggestionDto): Promise<SuggestionResponse> {
    const language = dto.language || 'pt-BR';
    const cacheKey = this.generateCacheKey(
      dto.occasion,
      dto.relationship,
      language,
    );

    const cachedData =
      await this.cacheService.get<SuggestionResponseData>(cacheKey);

    if (cachedData && cachedData.suggestions?.length > 0) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return {
        status: 'success',
        data: {
          ...cachedData,
          cached: true,
        },
      };
    }

    this.logger.log(
      `Cache MISS for key: ${cacheKey}. Invoking LLM fallback chain...`,
    );

    const llmResult = await this.llmService.generateMessage(
      dto.occasion,
      dto.relationship,
      language,
    );

    const responseData: SuggestionResponseData = {
      suggestions: llmResult.suggestions,
      cached: false,
      provider: llmResult.providerName,
    };

    await this.cacheService.set(cacheKey, responseData, 86400000); // 24 hours

    return {
      status: 'success',
      data: responseData,
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
