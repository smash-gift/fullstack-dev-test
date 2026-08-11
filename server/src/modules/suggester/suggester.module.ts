import { Module } from '@nestjs/common';
import { SuggesterController } from './suggester.controller';
import { SuggesterService } from './suggester.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [SuggesterController],
  providers: [SuggesterService],
})
export class SuggesterModule {}
