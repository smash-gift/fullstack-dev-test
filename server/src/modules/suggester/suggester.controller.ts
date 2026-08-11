import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { SuggesterService, SuggestionResponse } from './suggester.service';

@Controller('suggestions')
export class SuggesterController {
  constructor(private readonly suggesterService: SuggesterService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async generateSuggestions(
    @Body() dto: CreateSuggestionDto,
  ): Promise<SuggestionResponse> {
    return this.suggesterService.getSuggestions(dto);
  }
}
