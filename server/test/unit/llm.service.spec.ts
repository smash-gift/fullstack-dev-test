import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from '../../src/modules/llm/llm.service';
import {
  ILlmProviderToken,
  ILlmProvider,
} from '../../src/modules/llm/interfaces/llm-provider.interface';

describe('LlmService Fallback Chain', () => {
  let service: LlmService;
  let mockGemini: jest.Mocked<ILlmProvider>;
  let mockClaude: jest.Mocked<ILlmProvider>;
  let mockOpenAI: jest.Mocked<ILlmProvider>;

  beforeEach(async () => {
    mockGemini = {
      name: 'gemini-1.5-flash',
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

  it('should return Gemini response if Gemini succeeds (Priority 1)', async () => {
    const expected = {
      suggestions: ['Msg 1', 'Msg 2'],
      providerName: 'gemini-1.5-flash',
    };
    mockGemini.generateSuggestions.mockResolvedValue(expected);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');

    expect(result).toEqual(expected);
    expect(mockClaude.generateSuggestions).not.toHaveBeenCalled();
    expect(mockOpenAI.generateSuggestions).not.toHaveBeenCalled();
  });

  it('should fallback to Claude Opus (Priority 2) if Gemini fails', async () => {
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

  it('should fallback to OpenAI (Priority 3) if Gemini and Claude fail', async () => {
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

  it('should throw ServiceUnavailableException (503) if ALL providers fail', async () => {
    mockGemini.generateSuggestions.mockRejectedValue(new Error('Gemini Fail'));
    mockClaude.generateSuggestions.mockRejectedValue(new Error('Claude Fail'));
    mockOpenAI.generateSuggestions.mockRejectedValue(new Error('OpenAI Fail'));

    await expect(
      service.generateMessage('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
