import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from '../../src/modules/llm/llm.service';
import {
  ILlmProviderToken,
  ILlmProvider,
} from '../../src/modules/llm/interfaces/llm-provider.interface';

describe('LlmService — Fallback Chain (RN05)', () => {
  let service: LlmService;
  let mockGemini: jest.Mocked<ILlmProvider>;
  let mockClaude: jest.Mocked<ILlmProvider>;
  let mockOpenAI: jest.Mocked<ILlmProvider>;

  beforeEach(async () => {
    mockGemini = {
      name: 'gemini-1.5-flash-lite',
      isConfigured: jest.fn().mockReturnValue(true),
      generateSuggestions: jest.fn(),
    };
    mockClaude = {
      name: 'claude-3-opus-20240229',
      isConfigured: jest.fn().mockReturnValue(true),
      generateSuggestions: jest.fn(),
    };
    mockOpenAI = {
      name: 'gpt-4o-mini',
      isConfigured: jest.fn().mockReturnValue(true),
      generateSuggestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ILlmProviderToken,
          useValue: [mockGemini, mockClaude, mockOpenAI],
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  // ─── Cenários existentes ───────────────────────────────────────────────────

  it('[Priority 1] deve retornar resultado do Gemini quando ele tem sucesso', async () => {
    const expected = {
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash-lite',
    };
    mockGemini.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');

    expect(result).toEqual(expected);
    expect(mockClaude.generateSuggestions).not.toHaveBeenCalled();
    expect(mockOpenAI.generateSuggestions).not.toHaveBeenCalled();
  });

  it('[Priority 2] deve fazer fallback para Claude quando Gemini falha', async () => {
    mockGemini.generateSuggestions.mockRejectedValue(new Error('Quota limit'));
    const expected = {
      suggestions: ['Claude Msg 1', 'Claude Msg 2'],
      providerName: 'claude-3-opus-20240229',
    };
    mockClaude.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');

    expect(result).toEqual(expected);
    expect(mockOpenAI.generateSuggestions).not.toHaveBeenCalled();
  });

  it('[Priority 3] deve fazer fallback para OpenAI quando Gemini e Claude falham', async () => {
    mockGemini.generateSuggestions.mockRejectedValue(new Error('Quota limit'));
    mockClaude.generateSuggestions.mockRejectedValue(
      new Error('Claude timeout'),
    );
    const expected = {
      suggestions: ['OpenAI Msg 1', 'OpenAI Msg 2'],
      providerName: 'gpt-4o-mini',
    };
    mockOpenAI.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');

    expect(result).toEqual(expected);
  });

  it('[RN04] deve lançar ServiceUnavailableException (503) quando TODOS os providers falham', async () => {
    mockGemini.generateSuggestions.mockRejectedValue(new Error('Gemini Fail'));
    mockClaude.generateSuggestions.mockRejectedValue(new Error('Claude Fail'));
    mockOpenAI.generateSuggestions.mockRejectedValue(new Error('OpenAI Fail'));

    await expect(
      service.generateMessage('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  // ─── Novos cenários (RN05) ─────────────────────────────────────────────────

  it('[RN05] deve lançar ServiceUnavailableException quando nenhum provider está configurado', async () => {
    mockGemini.isConfigured.mockReturnValue(false);
    mockClaude.isConfigured.mockReturnValue(false);
    mockOpenAI.isConfigured.mockReturnValue(false);

    await expect(
      service.generateMessage('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(mockGemini.generateSuggestions).not.toHaveBeenCalled();
    expect(mockClaude.generateSuggestions).not.toHaveBeenCalled();
    expect(mockOpenAI.generateSuggestions).not.toHaveBeenCalled();
  });

  it('[RN05] deve ignorar silenciosamente provider sem API key e usar o próximo', async () => {
    // Gemini sem key → deve pular direto para Claude
    mockGemini.isConfigured.mockReturnValue(false);
    mockClaude.isConfigured.mockReturnValue(true);
    const expected = {
      suggestions: ['Claude Fallback 1', 'Claude Fallback 2'],
      providerName: 'claude-3-opus-20240229',
    };
    mockClaude.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');

    expect(result).toEqual(expected);
    expect(mockGemini.generateSuggestions).not.toHaveBeenCalled();
  });

  it('[RN05] deve respeitar timeout de 3000ms por provider e fazer fallback', async () => {
    jest.useFakeTimers();

    // Gemini nunca resolve → simula timeout interno do executeWithTimeout
    mockGemini.generateSuggestions.mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000),
        ),
    );
    const expected = {
      suggestions: ['Claude Fallback msg 1', 'Claude msg 2'],
      providerName: 'claude-3-opus-20240229',
    };
    mockClaude.generateSuggestions.mockResolvedValue(expected);

    const resultPromise = service.generateMessage(
      'birthday',
      'friend',
      'pt-BR',
    );

    // Avança o tempo além do timeout de 3000ms do LlmService
    jest.advanceTimersByTime(3500);

    const result = await resultPromise;
    expect(result).toEqual(expected);

    jest.useRealTimers();
  });

  it('[RN05] deve registrar mensagem no providerName do resultado', async () => {
    const expected = {
      suggestions: ['Msg A', 'Msg B'],
      providerName: 'gemini-1.5-flash-lite',
    };
    mockGemini.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage(
      'christmas',
      'colleague',
      'en-US',
    );

    expect(result.providerName).toBe('gemini-1.5-flash-lite');
  });
});
