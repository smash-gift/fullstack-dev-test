import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ILlmProvider, LlmResult } from '../interfaces/llm-provider.interface';

@Injectable()
export class ClaudeLlmProvider implements ILlmProvider {
  readonly name = 'claude-3-opus-20240229';
  private readonly logger = new Logger(ClaudeLlmProvider.name);
  private anthropic: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    if (apiKey && apiKey !== 'your_claude_api_key_here') {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  isConfigured(): boolean {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    return Boolean(apiKey && apiKey !== 'your_claude_api_key_here');
  }

  async generateSuggestions(
    occasion: string,
    relationship: string,
    language: string,
  ): Promise<LlmResult> {
    if (!this.isConfigured()) {
      throw new Error('CLAUDE_API_KEY is missing or invalid.');
    }

    if (!this.anthropic) {
      const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
      this.anthropic = new Anthropic({ apiKey });
    }

    const promptLanguage =
      language === 'en-US' ? 'English' : 'Portuguese (pt-BR)';

    const prompt = `# Description
You are an expert copywriter specializing in creating emotional, warm, concise, and personalized gift card messages.

# Instructions
- Target Occasion: ${occasion}
- Relationship to Recipient: ${relationship}
- Target Language: ${promptLanguage}
- Generate exactly 2 distinct, high-quality message suggestions suitable for a gift card.

# Rules
1. Output Format: Return strictly a raw JSON array containing exactly 2 string elements: ["Message 1...", "Message 2..."].
2. No Formatting Wrappers: Do NOT include markdown code fences (like \`\`\`json or \`\`\`), markdown tags, explanations, or extra text.
3. Message Length: Each message MUST be concise (between 1 and 2 sentences, maximum 25 words).
4. Tone: Warm, heartfelt, and tailored to the ${relationship} for a ${occasion} card.
5. Language Strictness: Write exclusively in ${promptLanguage}.`;

    const response = await this.anthropic.messages.create({
      model: this.name,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = response.content[0];
    const text = firstBlock?.type === 'text' ? firstBlock.text.trim() : '';
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
      this.logger.warn(`Failed to parse JSON output from Claude: "${text}"`);
    }

    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[-*1-9.\s]+/, '').trim())
      .filter((l) => l.length > 5);

    if (lines.length >= 2) {
      return lines.slice(0, 2);
    }

    throw new Error('Malformed or empty output received from Claude API.');
  }
}
