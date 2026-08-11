import { Test, TestingModule } from '@nestjs/testing';
import { SuggesterService } from '../../src/modules/suggester/suggester.service';
import { LlmService } from '../../src/modules/llm/llm.service';
import { CacheService } from '../../src/modules/cache/cache.service';
import { TargetLanguage } from '../../src/modules/suggester/dto/create-suggestion.dto';

describe('SuggesterService', () => {
  let service: SuggesterService;
  let llmService: jest.Mocked<LlmService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockLlmService = {
      generateMessage: jest.fn(),
    };
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggesterService,
        { provide: LlmService, useValue: mockLlmService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<SuggesterService>(SuggesterService);
    llmService = module.get(LlmService);
    cacheService = module.get(CacheService);
  });

  it('should return cached suggestions on Cache HIT', async () => {
    const cachedData = {
      suggestions: ['Happy Birthday!', 'All the best!'],
      cached: false,
      provider: 'gemini-1.5-flash',
    };
    cacheService.get.mockResolvedValue(cachedData);

    const result = await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.EN_US,
    });

    expect(result.status).toBe('success');
    expect(result.data.cached).toBe(true);
    expect(result.data.suggestions).toEqual(cachedData.suggestions);
    expect(llmService.generateMessage).not.toHaveBeenCalled();
  });

  it('should call LLM service on Cache MISS and set cache', async () => {
    cacheService.get.mockResolvedValue(null);
    const llmSuggestions = [
      'Parabéns pelo aniversário!',
      'Felicidades sempre!',
    ];
    llmService.generateMessage.mockResolvedValue({
      suggestions: llmSuggestions,
      providerName: 'claude-3-opus-20240229',
    });

    const result = await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    });

    expect(result.status).toBe('success');
    expect(result.data.cached).toBe(false);
    expect(result.data.provider).toBe('claude-3-opus-20240229');
    expect(result.data.suggestions).toEqual(llmSuggestions);
    expect(llmService.generateMessage).toHaveBeenCalledWith(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(cacheService.set).toHaveBeenCalled();
  });
});
