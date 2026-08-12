import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
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

  // ─── Cenários existentes ───────────────────────────────────────────────────

  it('[Cache HIT] deve retornar sugestões cacheadas sem chamar o LLM', async () => {
    const cachedData = {
      suggestions: ['Happy Birthday!', 'All the best!'],
      cached: false,
      provider: 'gemini-1.5-flash-lite',
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

  it('[Cache MISS] deve chamar o LLM e salvar no cache', async () => {
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

  // ─── Novos cenários ────────────────────────────────────────────────────────

  it('[Default Language] deve usar pt-BR como language quando não informado', async () => {
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockResolvedValue({
      suggestions: ['Parabéns!', 'Feliz aniversário!'],
      providerName: 'gemini-1.5-flash-lite',
    });

    // Sem language → usa default
    await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: undefined,
    });

    expect(llmService.generateMessage).toHaveBeenCalledWith(
      'birthday',
      'friend',
      'pt-BR',
    );
  });

  it('[Cache Key] deve gerar cache key determinística para a mesma entrada', async () => {
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockResolvedValue({
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash-lite',
    });

    // Primeira chamada
    await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    });
    const firstKey = cacheService.get.mock.calls[0][0];

    cacheService.get.mockClear();
    cacheService.set.mockClear();
    llmService.generateMessage.mockClear();
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockResolvedValue({
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash-lite',
    });

    // Segunda chamada idêntica
    await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    });
    const secondKey = cacheService.get.mock.calls[0][0];

    expect(firstKey).toBe(secondKey);
    expect(firstKey).toMatch(/^suggestion:[a-f0-9]{64}$/);
  });

  it('[Cache Key] deve ser case-insensitive (Birthday === birthday)', async () => {
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockResolvedValue({
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash-lite',
    });

    await service.getSuggestions({
      occasion: 'Birthday',
      relationship: 'Friend',
      language: TargetLanguage.PT_BR,
    });
    const keyUpper = cacheService.get.mock.calls[0][0];

    cacheService.get.mockClear();
    cacheService.get.mockResolvedValue(null);

    await service.getSuggestions({
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    });
    const keyLower = cacheService.get.mock.calls[0][0];

    expect(keyUpper).toBe(keyLower);
  });

  it('[RN04] deve propagar ServiceUnavailableException quando LLM falha', async () => {
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockRejectedValue(
      new ServiceUnavailableException(
        'O serviço de sugestões de IA está temporariamente indisponível.',
      ),
    );

    await expect(
      service.getSuggestions({
        occasion: 'birthday',
        relationship: 'friend',
        language: TargetLanguage.PT_BR,
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('[Cache TTL] deve salvar no cache com TTL de 24 horas (86400000ms)', async () => {
    cacheService.get.mockResolvedValue(null);
    llmService.generateMessage.mockResolvedValue({
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash-lite',
    });

    await service.getSuggestions({
      occasion: 'wedding',
      relationship: 'sibling',
      language: TargetLanguage.PT_BR,
    });

    expect(cacheService.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      86400000,
    );
  });
});
