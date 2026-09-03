/**
 * Maps what users actually type onto the catalogue's canonical keys.
 *
 * The catalogue is keyed in English, but `occasion` and `relationship` are
 * free text and a Portuguese user types "aniversário", not "birthday".
 * Without this, they would drop straight to the generic level and receive a
 * message that reads as an afterthought — which is precisely what makes a
 * fallback feel cheap.
 *
 * Keys here are already diacritic-stripped and lower-cased, so "ANIVERSÁRIO",
 * "aniversario" and "  Aniversário " all resolve to the same entry.
 *
 * This covers the occasions and relationships the catalogue actually holds.
 * Anything outside it still degrades gracefully to the next level.
 */
export const OCCASION_ALIASES: Record<string, string> = {
  // birthday
  aniversario: 'birthday',
  niver: 'birthday',
  cumpleanos: 'birthday',
  cumple: 'birthday',
  bday: 'birthday',
  'happy birthday': 'birthday',

  // wedding
  casamento: 'wedding',
  boda: 'wedding',
  matrimonio: 'wedding',
  nupcias: 'wedding',
  marriage: 'wedding',

  // thank you
  obrigado: 'thank you',
  obrigada: 'thank you',
  agradecimento: 'thank you',
  gracias: 'thank you',
  thanks: 'thank you',
  'thank-you': 'thank you',
  thankyou: 'thank you',
};

export const RELATIONSHIP_ALIASES: Record<string, string> = {
  // friend
  amigo: 'friend',
  amiga: 'friend',
  amigos: 'friend',
  amigx: 'friend',

  // colleague
  colega: 'colleague',
  'colega de trabalho': 'colleague',
  companero: 'colleague',
  compañero: 'colleague',
  coworker: 'colleague',
  'co-worker': 'colleague',
  boss: 'colleague',
  chefe: 'colleague',

  // parent
  mae: 'parent',
  pai: 'parent',
  pais: 'parent',
  madre: 'parent',
  padre: 'parent',
  padres: 'parent',
  mother: 'parent',
  father: 'parent',
  mom: 'parent',
  dad: 'parent',
  mum: 'parent',
  parents: 'parent',
};

/**
 * Lower-cases, trims and strips diacritics, so accented and unaccented
 * spellings resolve to the same catalogue entry.
 */
export function normalizeForCatalog(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function resolveOccasion(value: string): string {
  const normalized = normalizeForCatalog(value);
  return OCCASION_ALIASES[normalized] ?? normalized;
}

export function resolveRelationship(value: string): string {
  const normalized = normalizeForCatalog(value);
  return RELATIONSHIP_ALIASES[normalized] ?? normalized;
}
