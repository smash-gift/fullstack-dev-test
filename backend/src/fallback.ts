import type { SuggestionInput } from './types.js';

export function fallbackSuggestions({ occasion, relationship }: SuggestionInput): string[] {
  return [
    `Para um(a) ${relationship} especial: que este ${occasion} seja cheio de alegria e momentos inesquecíveis.`,
    `Espero que este presente torne seu ${occasion} ainda mais memorável. Você merece tudo de bom!`,
    `Um carinho especial para celebrar este ${occasion}. Que venham muitos motivos para sorrir!`,
  ];
}
