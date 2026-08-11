import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from '../../src/modules/llm/llm.service';
import { ILlmProviderToken } from '../../src/modules/llm/interfaces/llm-provider.interface';

describe('LlmService', () => {
  let service: LlmService;
  let mockProvider: { generateSuggestions: jest.Mock };

  beforeEach(async () => {
    mockProvider = {
      generateSuggestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: ILlmProviderToken, useValue: mockProvider },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should return suggestions when provider resolves within timeout', async () => {
    const mockOutput = ['Message 1', 'Message 2'];
    mockProvider.generateSuggestions.mockResolvedValue(mockOutput);

    const result = await service.generateMessage('birthday', 'friend', 'pt-BR');
    expect(result).toEqual(mockOutput);
  });

  it('should throw ServiceUnavailableException (503) when provider fails', async () => {
    mockProvider.generateSuggestions.mockRejectedValue(
      new Error('API quota exceeded'),
    );

    await expect(
      service.generateMessage('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should throw ServiceUnavailableException (503) when provider times out (> 7000ms)', async () => {
    mockProvider.generateSuggestions.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 8000)),
    );

    await expect(
      service.generateMessage('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow(ServiceUnavailableException);
  }, 10000);
});
