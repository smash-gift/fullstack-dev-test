import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ILlmProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiLlmProvider implements ILlmProvider {
  private readonly logger = new Logger(GeminiLlmProvider.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateSuggestions(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<string[]> {
    if (!this.genAI) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('GEMINI_API_KEY is missing or invalid.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const promptLanguage =
      language === 'en-US' ? 'English' : 'Portuguese (pt-BR)';

    const prompt = `Generate exactly 2 short, warm, personalized gift card message suggestions for a ${occasion} card addressed to a ${relationship}.
Output MUST be valid JSON formatted as a plain JSON array of 2 strings: ["message 1", "message 2"].
Do NOT include markdown backticks or extra text.
Language: ${promptLanguage}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim() || '';
    return this.parseResponse(text);
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
      this.logger.warn(`Failed to parse JSON output from Gemini: "${text}"`);
    }

    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[-*1-9.\s]+/, '').trim())
      .filter((l) => l.length > 5);

    if (lines.length >= 2) {
      return lines.slice(0, 2);
    }

    throw new Error('Malformed or empty output received from Gemini API.');
  }
}
