import { ConfigService } from '@nestjs/config';
import { GeminiLlmProvider } from '../../src/modules/llm/providers/gemini-llm.provider';
import { OpenAiLlmProvider } from '../../src/modules/llm/providers/openai-llm.provider';
import { ClaudeLlmProvider } from '../../src/modules/llm/providers/claude-llm.provider';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MARKDOWN_WRAPPED_JSON = '```json\n["Msg JSON 1", "Msg JSON 2"]\n```';
const PLAIN_JSON = '["Msg JSON 1", "Msg JSON 2"]';
const LINE_FALLBACK_TEXT =
  '- Primeira sugestão aqui\n- Segunda sugestão aqui válida';
const EMPTY_TEXT = '';

// Mock do ConfigService que retorna chave válida por padrão
const buildConfigService = (
  key: string | undefined,
  placeholder = false,
): ConfigService =>
  ({
    get: jest
      .fn()
      .mockReturnValue(placeholder ? 'your_gemini_api_key_here' : key),
  }) as unknown as ConfigService;

// ─────────────────────────────────────────────────────────────────────────────
// GeminiLlmProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('GeminiLlmProvider', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = buildConfigService('real-gemini-key');
  });

  it('isConfigured() deve retornar true quando API key é válida', () => {
    const provider = new GeminiLlmProvider(configService);
    expect(provider.isConfigured()).toBe(true);
  });

  it('isConfigured() deve retornar false quando API key é undefined', () => {
    const cfg = buildConfigService(undefined);
    const provider = new GeminiLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured() deve retornar false quando API key é o placeholder padrão', () => {
    const cfg = buildConfigService('your_gemini_api_key_here');
    const provider = new GeminiLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('generateSuggestions() deve lançar Error quando não configurado', async () => {
    const cfg = buildConfigService(undefined);
    const provider = new GeminiLlmProvider(cfg);
    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('GEMINI_API_KEY is missing or invalid.');
  });

  it('parseResponse: deve parsear JSON array válido corretamente', async () => {
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: jest.fn().mockReturnValue(PLAIN_JSON) },
        }),
      }),
    };
    const provider = new GeminiLlmProvider(configService);
    (provider as any).genAI = mockGenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toEqual(['Msg JSON 1', 'Msg JSON 2']);
    expect(result.providerName).toBe('gemini-1.5-flash-lite');
  });

  it('parseResponse: deve lidar com JSON envolto em markdown fences', async () => {
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: jest.fn().mockReturnValue(MARKDOWN_WRAPPED_JSON) },
        }),
      }),
    };
    const provider = new GeminiLlmProvider(configService);
    (provider as any).genAI = mockGenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toEqual(['Msg JSON 1', 'Msg JSON 2']);
  });

  it('parseResponse: deve usar fallback por linhas quando JSON é inválido', async () => {
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue(LINE_FALLBACK_TEXT),
          },
        }),
      }),
    };
    const provider = new GeminiLlmProvider(configService);
    (provider as any).genAI = mockGenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toHaveLength(2);
  });

  it('parseResponse: deve lançar Error quando output é vazio', async () => {
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: jest.fn().mockReturnValue(EMPTY_TEXT) },
        }),
      }),
    };
    const provider = new GeminiLlmProvider(configService);
    (provider as any).genAI = mockGenAI;

    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('Malformed or empty output received from Gemini API.');
  });

  it('parseResponse: deve limitar output a 3 sugestões (slice(0,3))', async () => {
    const manyItems = '["msg1","msg2","msg3","msg4","msg5"]';
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: jest.fn().mockReturnValue(manyItems) },
        }),
      }),
    };
    const provider = new GeminiLlmProvider(configService);
    (provider as any).genAI = mockGenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAiLlmProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAiLlmProvider', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('real-openai-key'),
    } as unknown as ConfigService;
  });

  it('isConfigured() deve retornar true quando API key é válida', () => {
    const provider = new OpenAiLlmProvider(configService);
    expect(provider.isConfigured()).toBe(true);
  });

  it('isConfigured() deve retornar false quando API key é undefined', () => {
    const cfg = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const provider = new OpenAiLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured() deve retornar false quando API key é o placeholder padrão', () => {
    const cfg = {
      get: jest.fn().mockReturnValue('your_openai_api_key_here'),
    } as unknown as ConfigService;
    const provider = new OpenAiLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('generateSuggestions() deve lançar Error quando não configurado', async () => {
    const cfg = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const provider = new OpenAiLlmProvider(cfg);
    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('OPENAI_API_KEY is missing or invalid.');
  });

  it('parseResponse: deve parsear JSON array válido corretamente', async () => {
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: PLAIN_JSON } }],
          }),
        },
      },
    };
    const provider = new OpenAiLlmProvider(configService);
    (provider as any).openai = mockOpenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toEqual(['Msg JSON 1', 'Msg JSON 2']);
    expect(result.providerName).toBe('gpt-4o-mini');
  });

  it('parseResponse: deve usar fallback por linhas quando JSON é inválido', async () => {
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: LINE_FALLBACK_TEXT } }],
          }),
        },
      },
    };
    const provider = new OpenAiLlmProvider(configService);
    (provider as any).openai = mockOpenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toHaveLength(2);
  });

  it('parseResponse: deve lançar Error quando output é vazio', async () => {
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: EMPTY_TEXT } }],
          }),
        },
      },
    };
    const provider = new OpenAiLlmProvider(configService);
    (provider as any).openai = mockOpenAI;

    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('Malformed or empty output received from OpenAI API.');
  });

  it('parseResponse: deve limitar output a 3 sugestões (slice(0,3))', async () => {
    const manyItems = '["m1","m2","m3","m4","m5"]';
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: manyItems } }],
          }),
        },
      },
    };
    const provider = new OpenAiLlmProvider(configService);
    (provider as any).openai = mockOpenAI;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ClaudeLlmProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('ClaudeLlmProvider', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('real-claude-key'),
    } as unknown as ConfigService;
  });

  it('isConfigured() deve retornar true quando API key é válida', () => {
    const provider = new ClaudeLlmProvider(configService);
    expect(provider.isConfigured()).toBe(true);
  });

  it('isConfigured() deve retornar false quando API key é undefined', () => {
    const cfg = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const provider = new ClaudeLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('isConfigured() deve retornar false quando API key é o placeholder padrão', () => {
    const cfg = {
      get: jest.fn().mockReturnValue('your_claude_api_key_here'),
    } as unknown as ConfigService;
    const provider = new ClaudeLlmProvider(cfg);
    expect(provider.isConfigured()).toBe(false);
  });

  it('generateSuggestions() deve lançar Error quando não configurado', async () => {
    const cfg = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const provider = new ClaudeLlmProvider(cfg);
    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('CLAUDE_API_KEY is missing or invalid.');
  });

  it('parseResponse: deve parsear JSON array válido corretamente', async () => {
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: PLAIN_JSON }],
        }),
      },
    };
    const provider = new ClaudeLlmProvider(configService);
    (provider as any).anthropic = mockAnthropic;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toEqual(['Msg JSON 1', 'Msg JSON 2']);
    expect(result.providerName).toBe('claude-3-opus-20240229');
  });

  it('parseResponse: deve usar fallback por linhas quando JSON é inválido', async () => {
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: LINE_FALLBACK_TEXT }],
        }),
      },
    };
    const provider = new ClaudeLlmProvider(configService);
    (provider as any).anthropic = mockAnthropic;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions).toHaveLength(2);
  });

  it('parseResponse: deve lançar Error quando output é vazio (tipo text mas vazio)', async () => {
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: EMPTY_TEXT }],
        }),
      },
    };
    const provider = new ClaudeLlmProvider(configService);
    (provider as any).anthropic = mockAnthropic;

    await expect(
      provider.generateSuggestions('birthday', 'friend', 'pt-BR'),
    ).rejects.toThrow('Malformed or empty output received from Claude API.');
  });

  it('parseResponse: deve limitar output a 3 sugestões (slice(0,3))', async () => {
    const manyItems = '["m1","m2","m3","m4","m5"]';
    const mockAnthropic = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: manyItems }],
        }),
      },
    };
    const provider = new ClaudeLlmProvider(configService);
    (provider as any).anthropic = mockAnthropic;

    const result = await provider.generateSuggestions(
      'birthday',
      'friend',
      'pt-BR',
    );
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });
});
