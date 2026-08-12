import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { SuggesterController } from '../../src/modules/suggester/suggester.controller';
import { SuggesterService } from '../../src/modules/suggester/suggester.service';
import {
  SuggestionResponse,
  SuggestionResponseData,
} from '../../src/modules/suggester/suggester.service';
import { TargetLanguage } from '../../src/modules/suggester/dto/create-suggestion.dto';

describe('SuggesterController', () => {
  let controller: SuggesterController;
  let suggesterService: jest.Mocked<SuggesterService>;

  beforeEach(async () => {
    const mockSuggesterService = {
      getSuggestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuggesterController],
      providers: [
        { provide: SuggesterService, useValue: mockSuggesterService },
      ],
    }).compile();

    controller = module.get<SuggesterController>(SuggesterController);
    suggesterService = module.get(SuggesterService);
  });

  it('deve chamar getSuggestions() com o DTO recebido', async () => {
    const dto = {
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    };
    const mockResponseData: SuggestionResponseData = {
      suggestions: ['Parabéns!', 'Feliz aniversário!'],
      cached: false,
      provider: 'gemini-1.5-flash-lite',
    };
    const mockResponse: SuggestionResponse = {
      status: 'success',
      data: mockResponseData,
    };

    suggesterService.getSuggestions.mockResolvedValue(mockResponse);

    await controller.generateSuggestions(dto);

    expect(suggesterService.getSuggestions).toHaveBeenCalledWith(dto);
    expect(suggesterService.getSuggestions).toHaveBeenCalledTimes(1);
  });

  it('[API-contract] deve retornar resposta de sucesso com estrutura correta', async () => {
    const dto = {
      occasion: 'christmas',
      relationship: 'colleague',
      language: TargetLanguage.EN_US,
    };
    const mockResponseData: SuggestionResponseData = {
      suggestions: ['Merry Christmas!', 'Happy Holidays!'],
      cached: true,
      provider: 'gemini-1.5-flash-lite',
    };
    const mockResponse: SuggestionResponse = {
      status: 'success',
      data: mockResponseData,
    };

    suggesterService.getSuggestions.mockResolvedValue(mockResponse);

    const result = await controller.generateSuggestions(dto);

    expect(result.status).toBe('success');
    expect(result.data.suggestions).toHaveLength(2);
    expect(result.data).toHaveProperty('cached');
    expect(result.data).toHaveProperty('provider');
  });

  it('[RN04] deve propagar ServiceUnavailableException sem interceptar', async () => {
    const dto = {
      occasion: 'birthday',
      relationship: 'friend',
      language: TargetLanguage.PT_BR,
    };

    suggesterService.getSuggestions.mockRejectedValue(
      new ServiceUnavailableException(
        'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
      ),
    );

    await expect(controller.generateSuggestions(dto)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
