import type { LlmProvider, SuggestionRequest } from '../types.js';

/**
 * Deterministic, offline provider used whenever the real LLM fails or is not
 * configured. It never throws: the user always gets something usable.
 *
 * Messages are curated per occasion, with a relationship-aware generic set for
 * unmapped combinations. All English, 1–2 sentences, no names/emojis.
 */

type OccasionKey =
  | 'birthday'
  | 'wedding'
  | 'thank you'
  | 'anniversary'
  | 'graduation'
  | 'new baby'
  | 'get well'
  | 'holiday';

const CURATED: Record<OccasionKey, string[]> = {
  birthday: [
    'Wishing you a birthday as wonderful as you are — enjoy every moment today.',
    'Happy birthday! May this year bring you joy, laughter, and everything you hope for.',
    'Another year, another reason to celebrate you. Have a fantastic birthday!',
  ],
  wedding: [
    'Wishing you a lifetime of love and happiness together. Congratulations!',
    'May your marriage be filled with joy, laughter, and endless love.',
    'Congratulations on your wedding — here is to a beautiful journey ahead.',
  ],
  'thank you': [
    'Thank you so much for your kindness — it truly meant a lot to me.',
    'I am deeply grateful for everything you have done. Thank you!',
    'Your generosity did not go unnoticed. Thank you from the bottom of my heart.',
  ],
  anniversary: [
    'Happy anniversary! Here is to many more years of love and happiness.',
    'Celebrating you today and the beautiful love you share. Congratulations!',
    'Wishing you continued joy on your anniversary and always.',
  ],
  graduation: [
    'Congratulations on your graduation — your hard work truly paid off!',
    'So proud of everything you have accomplished. The best is yet to come.',
    'Here is to your bright future. Congratulations, graduate!',
  ],
  'new baby': [
    'Congratulations on your new arrival — wishing your growing family so much joy.',
    'Welcome to the world, little one! Sending love to your beautiful family.',
    'Wishing you sleepless nights full of cuddles and endless love. Congratulations!',
  ],
  'get well': [
    'Wishing you a speedy recovery and brighter days ahead. Take care of yourself.',
    'Sending you strength and warm wishes for a quick recovery.',
    'Hope you feel better soon — thinking of you every step of the way.',
  ],
  holiday: [
    'Wishing you a warm and joyful holiday season filled with good memories.',
    'May your holidays be merry, bright, and full of love.',
    'Happy holidays! Wishing you peace, joy, and happiness this season.',
  ],
};

const GENERIC = [
  'Thinking of you and sending my very best wishes on this special occasion.',
  'Wishing you all the happiness in the world — you truly deserve it.',
  'Sending you warm thoughts and heartfelt wishes today.',
];

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

export class FallbackProvider implements LlmProvider {
  readonly name = 'fallback';

  generateSuggestions(input: SuggestionRequest): Promise<string[]> {
    const occasion = normalise(input.occasion);
    const curated = (CURATED as Record<string, string[]>)[occasion];
    return Promise.resolve(curated ?? GENERIC);
  }
}
