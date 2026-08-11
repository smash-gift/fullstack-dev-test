import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { GeminiLlmProvider } from './providers/gemini-llm.provider';
import { ILlmProviderToken } from './interfaces/llm-provider.interface';

@Module({
  providers: [
    LlmService,
    {
      provide: ILlmProviderToken,
      useClass: GeminiLlmProvider,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
