import type { SuggestionLanguage } from '../../domain/dtos/suggest-messages-input.dto.js';

/**
 * Curated gift card messages, written by hand.
 *
 * Lookup degrades in three steps: occasion x relationship, then occasion
 * alone, then a generic set. `DEFAULT_KEY` marks the entries used when the
 * more specific ones do not exist.
 *
 * Every language carries its own text. Serving English to someone who asked
 * for Portuguese would be a visible failure on top of an invisible one, so
 * the fallback honours `language` even though it cannot honour `tone`.
 */
export const DEFAULT_KEY = '_default';

type RelationshipMessages = Record<string, readonly string[]>;
type OccasionMessages = Record<string, RelationshipMessages>;

export const FALLBACK_MESSAGES: Record<SuggestionLanguage, OccasionMessages> = {
  en: {
    birthday: {
      friend: [
        'Happy birthday! Wishing you a day as bright as your smile.',
        "Here's to you, and to another year of good memories together.",
        'Happy birthday, my friend. May this year treat you kindly.',
      ],
      colleague: [
        'Happy birthday! Wishing you a great day and an even better year.',
        'Many happy returns. It is a pleasure working alongside you.',
        'Happy birthday! Hope the day brings you something to celebrate.',
      ],
      parent: [
        'Happy birthday. Thank you for everything you have given me.',
        'Wishing you a wonderful day. You deserve every bit of it.',
        'Happy birthday, with all my love and gratitude.',
      ],
      [DEFAULT_KEY]: [
        'Happy birthday! Wishing you a wonderful day.',
        'Many happy returns. May this year bring you good things.',
        'Happy birthday, and here is to a great year ahead.',
      ],
    },
    wedding: {
      friend: [
        'Congratulations! Wishing you both a lifetime of happiness.',
        'So happy for you two. Here is to the adventure ahead.',
        'Congratulations on your wedding. May your days be full of joy.',
      ],
      colleague: [
        'Congratulations on your wedding. Wishing you both every happiness.',
        'Warmest wishes on your special day.',
        'Congratulations to you both. May your life together be a joyful one.',
      ],
      parent: [
        'Congratulations. Wishing you both all the happiness in the world.',
        'So much love to you both on this special day.',
        'Congratulations, with all my love. Here is to your life together.',
      ],
      [DEFAULT_KEY]: [
        'Congratulations! Wishing you both a lifetime of happiness.',
        'Warmest wishes on your wedding day.',
        'Congratulations. May your life together be full of joy.',
      ],
    },
    'thank you': {
      friend: [
        'Thank you for everything. I am lucky to have you.',
        'Just a small thank you for being there when it mattered.',
        'Thank you. It meant more than you know.',
      ],
      colleague: [
        'Thank you for your help. It made a real difference.',
        'Grateful for your support on this. Thank you.',
        'Thank you. It has been a pleasure working with you.',
      ],
      parent: [
        'Thank you for everything you have done for me.',
        'I am grateful for you, today and always. Thank you.',
        'Thank you for your patience, your care and your love.',
      ],
      [DEFAULT_KEY]: [
        'Thank you. Your kindness has not gone unnoticed.',
        'Just a note to say thank you. It meant a lot.',
        'Thank you for everything. I truly appreciate it.',
      ],
    },
    [DEFAULT_KEY]: {
      [DEFAULT_KEY]: [
        'Thinking of you today, and wishing you all the best.',
        'Sending you warm wishes and a little something to celebrate.',
        'Hope this brings a smile to your day.',
      ],
    },
  },

  pt: {
    birthday: {
      friend: [
        'Feliz aniversário! Que o seu dia seja tão bom quanto você merece.',
        'Muitas felicidades. Que venha mais um ano de boas histórias juntos.',
        'Parabéns, amigo! Que este ano seja generoso com você.',
      ],
      colleague: [
        'Feliz aniversário! Um ótimo dia e um ano ainda melhor.',
        'Parabéns! É muito bom trabalhar ao seu lado.',
        'Feliz aniversário. Que o dia traga algo para comemorar.',
      ],
      parent: [
        'Feliz aniversário. Obrigado por tudo o que você me deu.',
        'Que o seu dia seja lindo. Você merece cada momento.',
        'Parabéns, com todo o meu carinho e a minha gratidão.',
      ],
      [DEFAULT_KEY]: [
        'Feliz aniversário! Que o seu dia seja maravilhoso.',
        'Muitas felicidades. Que este ano traga coisas boas.',
        'Parabéns, e que venha um ótimo ano pela frente.',
      ],
    },
    wedding: {
      friend: [
        'Parabéns! Que a vida de vocês seja cheia de felicidade.',
        'Muito feliz por vocês dois. Que venha essa nova aventura.',
        'Parabéns pelo casamento. Que os dias sejam cheios de alegria.',
      ],
      colleague: [
        'Parabéns pelo casamento. Muitas felicidades para vocês dois.',
        'Votos de muita felicidade neste dia tão especial.',
        'Parabéns aos dois. Que a vida juntos seja leve e feliz.',
      ],
      parent: [
        'Parabéns. Desejo a vocês toda a felicidade do mundo.',
        'Muito amor para vocês dois neste dia tão especial.',
        'Parabéns, com todo o meu carinho. Que a vida juntos seja linda.',
      ],
      [DEFAULT_KEY]: [
        'Parabéns! Que a vida de vocês seja cheia de felicidade.',
        'Votos de muita felicidade no dia do casamento.',
        'Parabéns. Que a vida juntos seja cheia de alegria.',
      ],
    },
    'thank you': {
      friend: [
        'Obrigado por tudo. Tenho sorte de ter você por perto.',
        'Um obrigado pequeno por você ter estado lá quando importava.',
        'Obrigado. Significou mais do que você imagina.',
      ],
      colleague: [
        'Obrigado pela ajuda. Fez uma diferença de verdade.',
        'Grato pelo seu apoio nisso. Muito obrigado.',
        'Obrigado. Tem sido um prazer trabalhar com você.',
      ],
      parent: [
        'Obrigado por tudo o que você fez por mim.',
        'Sou grato por você, hoje e sempre. Obrigado.',
        'Obrigado pela paciência, pelo cuidado e pelo amor.',
      ],
      [DEFAULT_KEY]: [
        'Obrigado. A sua gentileza não passou despercebida.',
        'Só um bilhete para dizer obrigado. Significou muito.',
        'Obrigado por tudo. Eu realmente agradeço.',
      ],
    },
    [DEFAULT_KEY]: {
      [DEFAULT_KEY]: [
        'Pensando em você hoje, e desejando tudo de bom.',
        'Enviando votos carinhosos e algo para comemorar.',
        'Que isto traga um sorriso ao seu dia.',
      ],
    },
  },

  es: {
    birthday: {
      friend: [
        '¡Feliz cumpleaños! Que tu día sea tan bueno como te mereces.',
        'Muchas felicidades. Que venga otro año de buenos recuerdos juntos.',
        '¡Felicidades, amigo! Que este año sea generoso contigo.',
      ],
      colleague: [
        '¡Feliz cumpleaños! Que tengas un gran día y un año aún mejor.',
        '¡Felicidades! Es un gusto trabajar a tu lado.',
        'Feliz cumpleaños. Que el día te traiga algo para celebrar.',
      ],
      parent: [
        'Feliz cumpleaños. Gracias por todo lo que me has dado.',
        'Que tengas un día precioso. Te lo mereces todo.',
        'Felicidades, con todo mi cariño y mi gratitud.',
      ],
      [DEFAULT_KEY]: [
        '¡Feliz cumpleaños! Que tengas un día maravilloso.',
        'Muchas felicidades. Que este año te traiga cosas buenas.',
        'Felicidades, y que venga un gran año por delante.',
      ],
    },
    wedding: {
      friend: [
        '¡Felicidades! Que vuestra vida esté llena de felicidad.',
        'Muy feliz por vosotros dos. Que empiece esta aventura.',
        'Felicidades por vuestra boda. Que los días estén llenos de alegría.',
      ],
      colleague: [
        'Felicidades por vuestra boda. Mucha felicidad para los dos.',
        'Mis mejores deseos en este día tan especial.',
        'Felicidades a los dos. Que la vida juntos sea alegre.',
      ],
      parent: [
        'Felicidades. Os deseo toda la felicidad del mundo.',
        'Mucho amor para los dos en este día tan especial.',
        'Felicidades, con todo mi cariño. Que vuestra vida juntos sea preciosa.',
      ],
      [DEFAULT_KEY]: [
        '¡Felicidades! Que vuestra vida esté llena de felicidad.',
        'Mis mejores deseos en el día de vuestra boda.',
        'Felicidades. Que la vida juntos esté llena de alegría.',
      ],
    },
    'thank you': {
      friend: [
        'Gracias por todo. Tengo suerte de tenerte cerca.',
        'Un pequeño gracias por estar ahí cuando importaba.',
        'Gracias. Significó más de lo que imaginas.',
      ],
      colleague: [
        'Gracias por tu ayuda. Marcó una diferencia real.',
        'Agradecido por tu apoyo en esto. Muchas gracias.',
        'Gracias. Ha sido un placer trabajar contigo.',
      ],
      parent: [
        'Gracias por todo lo que has hecho por mí.',
        'Estoy agradecido por ti, hoy y siempre. Gracias.',
        'Gracias por tu paciencia, tu cuidado y tu cariño.',
      ],
      [DEFAULT_KEY]: [
        'Gracias. Tu amabilidad no ha pasado desapercibida.',
        'Solo una nota para decir gracias. Significó mucho.',
        'Gracias por todo. De verdad lo aprecio.',
      ],
    },
    [DEFAULT_KEY]: {
      [DEFAULT_KEY]: [
        'Pensando en ti hoy, y deseándote lo mejor.',
        'Enviándote buenos deseos y algo para celebrar.',
        'Espero que esto te saque una sonrisa.',
      ],
    },
  },
};
