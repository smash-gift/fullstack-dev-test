import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { GeminiLlmProvider } from './providers/gemini-llm.provider';
import { ClaudeLlmProvider } from './providers/claude-llm.provider';
import { OpenAiLlmProvider } from './providers/openai-llm.provider';
import { ILlmProviderToken } from './interfaces/llm-provider.interface';

@Module({
  providers: [
    LlmService,
    GeminiLlmProvider,
    ClaudeLlmProvider,
    OpenAiLlmProvider,
    {
      provide: ILlmProviderToken,
      useFactory: (
        gemini: GeminiLlmProvider,
        claude: ClaudeLlmProvider,
        openai: OpenAiLlmProvider,
      ) => [gemini, claude, openai],
      inject: [GeminiLlmProvider, ClaudeLlmProvider, OpenAiLlmProvider],
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
