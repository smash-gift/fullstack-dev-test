import { InvalidRequestError } from '../domain/errors.js';

const MIN_LENGTH = 2;
const MAX_LENGTH = 40;

/**
 * Phrases that only ever show up when someone is talking to the model instead
 * of naming an occasion. Defence in depth, not the control we rely on: the
 * prompt keeps user values inside a data envelope and the output guard checks
 * what came back. See docs/SECURITY.md.
 */
const INJECTION_MARKERS = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above)/i,
  /disregard\s+(all\s+)?(the\s+)?(previous|prior|above)/i,
  /\b(system|assistant|developer)\s*(prompt|message|role)\b/i,
  /\byou\s+are\s+(now|an?)\b/i,
  /\bact\s+as\b/i,
  /\b(reveal|print|repeat)\b.*\b(prompt|instruction)/i,
  /<\s*\/?\s*[a-z]/i,
  /https?:\/\//i,
  /[`{}]|\$\{/,
];

const CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;

export const KNOWN_OCCASIONS = [
  'birthday',
  'wedding',
  'anniversary',
  'graduation',
  'thank you',
  'new job',
  'new baby',
  'housewarming',
  'get well soon',
  'holidays',
  'christmas',
  'mothers day',
  'fathers day',
  'farewell',
  'congratulations',
] as const;

export const KNOWN_RELATIONSHIPS = [
  'friend',
  'best friend',
  'colleague',
  'manager',
  'client',
  'partner',
  'mother',
  'father',
  'sibling',
  'son',
  'daughter',
  'grandparent',
  'teacher',
  'neighbour',
] as const;

const ALIASES: Record<string, string> = {
  aniversario: 'birthday',
  casamento: 'wedding',
  formatura: 'graduation',
  obrigado: 'thank you',
  obrigada: 'thank you',
  agradecimento: 'thank you',
  natal: 'christmas',
  'dia das maes': 'mothers day',
  'dia dos pais': 'fathers day',
  'novo emprego': 'new job',
  despedida: 'farewell',
  parabens: 'congratulations',
  melhoras: 'get well soon',
  amigo: 'friend',
  amiga: 'friend',
  'melhor amigo': 'best friend',
  'melhor amiga': 'best friend',
  colega: 'colleague',
  chefe: 'manager',
  gestor: 'manager',
  cliente: 'client',
  parceiro: 'partner',
  esposa: 'partner',
  marido: 'partner',
  mae: 'mother',
  pai: 'father',
  irmao: 'sibling',
  irma: 'sibling',
  filho: 'son',
  filha: 'daughter',
  professor: 'teacher',
  professora: 'teacher',
  vizinho: 'neighbour',
};

export interface NormalizedField {
  /** What we send to the model and key the cache on. */
  value: string;
  /** True when it matched a curated term, which is what the fallback catalog indexes on. */
  isKnown: boolean;
}

function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function normalizeField(field: 'occasion' | 'relationship', raw: unknown): NormalizedField {
  if (typeof raw !== 'string') {
    throw new InvalidRequestError(`"${field}" must be a string`, [`${field}: expected a string`]);
  }

  const cleaned = raw
    .normalize('NFKC')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < MIN_LENGTH || cleaned.length > MAX_LENGTH) {
    throw new InvalidRequestError(
      `"${field}" must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      [`${field}: length out of range`],
    );
  }

  if (INJECTION_MARKERS.some((marker) => marker.test(cleaned))) {
    throw new InvalidRequestError(`"${field}" looks like an instruction rather than a valid ${field}`, [
      `${field}: rejected by input policy`,
    ]);
  }

  const folded = foldAccents(cleaned.toLowerCase());
  const canonical = ALIASES[folded] ?? folded;
  const catalog: readonly string[] = field === 'occasion' ? KNOWN_OCCASIONS : KNOWN_RELATIONSHIPS;

  return { value: canonical, isKnown: catalog.includes(canonical) };
}
