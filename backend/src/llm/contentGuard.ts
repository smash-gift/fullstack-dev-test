/**
 * Words that must never reach a gift card.
 *
 * Deliberately short and blunt. This is not a content classifier and does not
 * pretend to be one — it is a deterministic backstop for the one outcome a
 * prompt alone cannot guarantee: a model that was talked into being rude.
 * Matching is by whole word, so "assist" and "class" are unaffected.
 */
const BLOCKED_WORDS = new Set([
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dumb',
  'dumbass',
  'fool',
  'freak',
  'fuck',
  'fucked',
  'fucker',
  'fucking',
  'hell',
  'idiot',
  'idiotic',
  'jerk',
  'loser',
  'moron',
  'moronic',
  'pathetic',
  'piss',
  'prick',
  'retard',
  'retarded',
  'screw',
  'shit',
  'shitty',
  'slut',
  'stupid',
  'suck',
  'sucks',
  'twat',
  'ugly',
  'useless',
  'whore',
  'worthless',
]);

/**
 * Returns the first blocked word found, or undefined when the batch is clean.
 *
 * The whole batch is judged together: if one message came out insulting, the
 * model was steered, and the other two are not to be trusted either.
 */
export function findBlockedWord(messages: readonly string[]): string | undefined {
  for (const message of messages) {
    for (const word of tokenize(message)) {
      if (BLOCKED_WORDS.has(word)) {
        return word;
      }
    }
  }

  return undefined;
}

/**
 * Splits into lowercase words, treating anything that is not a letter as a
 * separator so punctuation and typographic apostrophes cannot hide a word.
 */
function tokenize(message: string): string[] {
  return message
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 0);
}
