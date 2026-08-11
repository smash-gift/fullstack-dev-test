import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILlmProvider, LlmResult } from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAiLlmProvider implements ILlmProvider {
  readonly name = 'gpt-4o-mini';
  private readonly logger = new Logger(OpenAiLlmProvider.name);
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    return Boolean(apiKey && apiKey !== 'your_openai_api_key_here');
  }

  async generateSuggestions(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<LlmResult> {
    if (!this.isConfigured()) {
      throw new Error('OPENAI_API_KEY is missing or invalid.');
    }

    if (!this.openai) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.openai = new OpenAI({ apiKey });
    }

    const promptLanguage =
      language === 'en-US' ? 'English' : 'Portuguese (pt-BR)';

    const prompt = `Generate exactly 2 short, warm, personalized gift card message suggestions for a ${occasion} card addressed to a ${relationship}.
Output MUST be valid JSON formatted as a plain JSON array of 2 strings: ["message 1", "message 2"].
Do NOT include markdown backticks or extra text.
Language: ${promptLanguage}.`;

    const response = await this.openai.chat.completions.create({
      model: this.name,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    const suggestions = this.parseResponse(text);

    return {
      suggestions,
      providerName: this.name,
    };
  }

  private parseResponse(text: string): string[] {
    const cleanText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map((item) => String(item).trim());
      }
    } catch {
      this.logger.warn(`Failed to parse JSON output from OpenAI: "${text}"`);
    }

    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[-*1-9.\s]+/, '').trim())
      .filter((l) => l.length > 5);

    if (lines.length >= 2) {
      return lines.slice(0, 2);
    }

    throw new Error('Malformed or empty output received from OpenAI API.');
  }
}
