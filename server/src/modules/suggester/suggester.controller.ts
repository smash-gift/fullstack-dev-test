import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { SuggesterService, SuggestionResponse } from './suggester.service';

@ApiTags('Suggestions')
@Controller('suggestions')
export class SuggesterController {
  constructor(private readonly suggesterService: SuggesterService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate personalized gift card message suggestions',
    description:
      'Generates 2 short, warm gift card message suggestions based on occasion, relationship, and target language using Google Gemini 1.5 Flash.',
  })
  @ApiHeader({
    name: 'X-Guest-ID',
    required: true,
    description: 'Anonymous Guest User UUID v4 session identifier (RN02)',
    example: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Preferred language identifier (RN01)',
    example: 'pt-BR',
  })
  @ApiOkResponse({
    description:
      'Suggestions generated successfully or retrieved from LRU Cache.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'Wishing you a day filled with laughter and unforgettable moments! Happy Birthday!',
                'Congratulations on another wonderful year! May this new cycle bring you peace and success.',
              ],
            },
            cached: { type: 'boolean', example: false },
            provider: { type: 'string', example: 'gemini-2.5-flash' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input parameters or missing/invalid X-Guest-ID header.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        error: { type: 'string', example: 'Bad Request' },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'occasion must be a string',
            'Header X-Guest-ID is required (RN02).',
          ],
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded (Maximum 10 requests per minute).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        error: { type: 'string', example: 'Too Many Requests' },
        message: {
          type: 'string',
          example: 'Rate limit exceeded. Please wait 1 minute.',
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description:
      'Google Gemini API failure or timeout (> 7000ms). Failure policy per RN04.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 503 },
        error: { type: 'string', example: 'Service Unavailable' },
        message: {
          type: 'string',
          example:
            'O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.',
        },
        code: { type: 'string', example: 'LLM_SERVICE_UNAVAILABLE' },
      },
    },
  })
  async generateSuggestions(
    @Body() dto: CreateSuggestionDto,
  ): Promise<SuggestionResponse> {
    return this.suggesterService.getSuggestions(dto);
  }
}
