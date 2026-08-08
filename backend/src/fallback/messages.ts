/**
 * Generic gift card messages used when the language model cannot be reached.
 *
 * Every entry has to work for any occasion and any relationship, because the
 * fallback path runs precisely when we could not tailor anything. They avoid
 * proper nouns, emoji, and assumptions about gender, culture, or the reason for
 * the gift, so none of them can land badly. This list lives in code on purpose:
 * the contingency path must not depend on the network or the database, or it
 * gains a failure mode of its own.
 */
export const FALLBACK_MESSAGES: readonly string[] = [
  'Hope this brings a smile to your day.',
  'Wishing you all the best, today and always.',
  'Thinking of you and sending warm wishes.',
  'Hope you enjoy every moment of it.',
  'A little something to brighten your day.',
  'Wishing you happiness and good things ahead.',
  'Hope this makes your day a little brighter.',
  'Sending you warm wishes and good thoughts.',
  'Enjoy this — you deserve something nice.',
  'Hope you love it as much as I loved choosing it.',
  'Here is to a wonderful day and an even better year.',
  'Wishing you joy, health, and plenty of good moments.',
  'Just a small way of saying that you matter.',
  'Hope this finds you well and makes you smile.',
  'Treat yourself to something you will really enjoy.',
  'Sending good thoughts your way.',
  'May your day be every bit as lovely as you are.',
  'Hope this brings you a little extra happiness.',
  'Wishing you a day filled with good things.',
  'Something small, sent with a lot of thought.',
  'Hope you find something that makes you happy.',
  'Here is to good times and even better memories.',
  'Sending a little cheer your way.',
  'Wishing you every good thing that is coming your way.',
  'Hope this puts a smile on your face.',
  'You deserve every bit of the good that comes your way.',
  'A small gift with a big thank you behind it.',
  'Hope your day turns out to be everything you wanted.',
  'Wishing you comfort, joy, and a great year ahead.',
  'Enjoy this, and enjoy the day even more.',
  'Sending warm thoughts and the very best wishes.',
  'Hope this adds a little something to your day.',
  'Take a moment for yourself. You have earned it.',
  'Wishing you all the good things you deserve.',
  'Hope this makes a good day even better.',
  'A little treat, chosen with you in mind.',
  'Here is to you and to everything ahead.',
  'Hope you enjoy picking out something special.',
  'A small package with a lot of good wishes inside.',
  'Wishing you a wonderful day from start to finish.',
];
