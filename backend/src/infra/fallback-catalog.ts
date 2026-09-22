import type { FallbackCatalog } from '../domain/ports.js';
import type { Locale, Suggestion, SuggestionRequest } from '../domain/suggestion.js';

type Catalog = Record<Locale, Record<string, string[]>>;

/**
 * Human-written, reviewed messages. They are the product's floor: whenever the
 * model is unavailable these go out instead, so they have to read well on their
 * own rather than look like an error page.
 */
const BY_OCCASION: Catalog = {
  en: {
    birthday: [
      'Happy birthday! Wishing you a year as wonderful as you are.',
      'Hope your day is full of laughter and everything you love.',
      'Another trip around the sun, and you keep getting better. Enjoy!',
    ],
    wedding: [
      'Congratulations on your wedding! Here is to a lifetime of happiness together.',
      'Wishing you both love, laughter and many happy years ahead.',
      'So happy for you two. May your story keep getting better.',
    ],
    graduation: [
      'Congratulations, graduate! All that hard work has paid off.',
      'So proud of everything you have achieved. Enjoy what comes next.',
      'You made it. Here is to the next chapter!',
    ],
    'thank you': [
      'Thank you for everything. It really did not go unnoticed.',
      'A small token of appreciation for all that you do.',
      'Grateful to have you around. Thank you!',
    ],
    christmas: [
      'Merry Christmas! Wishing you a warm and joyful season.',
      'Happy holidays, with all the best for the year ahead.',
      'Hope your holidays are cosy, bright and full of good company.',
    ],
    default: [
      'Thinking of you and wishing you all the best.',
      'Hope this brings a smile to your day.',
      'A little something to celebrate you.',
    ],
  },
  'pt-BR': {
    birthday: [
      'Feliz aniversário! Que este ano seja tão especial quanto você.',
      'Que o seu dia seja cheio de alegria e de tudo que você ama.',
      'Mais um ano de vida e você só melhora. Aproveite!',
    ],
    wedding: [
      'Parabéns pelo casamento! Que venham muitos anos de felicidade.',
      'Desejo a vocês amor, risadas e uma vida inteira juntos.',
      'Muito feliz por vocês dois. Que a história só melhore.',
    ],
    graduation: [
      'Parabéns pela formatura! Todo o esforço valeu a pena.',
      'Que orgulho de tudo que você conquistou. Aproveite o que vem por aí.',
      'Você conseguiu. Que venha o próximo capítulo!',
    ],
    'thank you': [
      'Obrigado por tudo. Nada disso passou despercebido.',
      'Uma pequena lembrança para agradecer tudo o que você faz.',
      'Sou grato por ter você por perto. Obrigado!',
    ],
    christmas: [
      'Feliz Natal! Que esta época seja leve e cheia de alegria.',
      'Boas festas, com tudo de melhor para o ano que vem.',
      'Que o seu Natal seja acolhedor e com boa companhia.',
    ],
    default: [
      'Pensando em você e desejando tudo de bom.',
      'Que isso traga um sorriso para o seu dia.',
      'Uma lembrança para celebrar você.',
    ],
  },
};

export class StaticFallbackCatalog implements FallbackCatalog {
  messagesFor(request: SuggestionRequest): Suggestion[] {
    const locale = BY_OCCASION[request.locale] ? request.locale : 'en';
    const byOccasion = BY_OCCASION[locale];
    const messages = byOccasion[request.occasion] ?? byOccasion.default!;

    return messages.slice(0, request.count).map((text, index) => ({ id: `f${index + 1}`, text }));
  }
}
