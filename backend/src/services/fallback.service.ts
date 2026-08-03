const FALLBACK_MESSAGES: Record<string, string[]> = {
  birthday: [
    'Wishing you a wonderful birthday filled with joy and everything you love!',
    'Hope your special day is as amazing as you are. Happy birthday!',
    'Sending warm birthday wishes and lots of love your way today!',
  ],
  wedding: [
    'Wishing you a lifetime of love, laughter, and happiness together!',
    'Congratulations on your special day — may your love story be a beautiful one!',
    "Here's to the beginning of a wonderful new chapter. Cheers to you both!",
  ],
  'thank you': [
    'Your kindness means more than words can express. Thank you so much!',
    'Grateful for everything you do — this is just a small token of my appreciation.',
    'Thank you from the bottom of my heart. You truly made a difference!',
  ],
  anniversary: [
    'Happy anniversary! Wishing you many more years of love and happiness together.',
    "Celebrating the beautiful journey you've shared — here's to many more years!",
    'Another year of love, laughter, and memories. Happy anniversary!',
  ],
  graduation: [
    'Congratulations on this incredible achievement! So proud of everything you have accomplished.',
    'The future is bright — here is to new adventures and endless possibilities!',
    'All your hard work has paid off. Congratulations, graduate!',
  ],
  christmas: [
    'Wishing you a magical Christmas filled with warmth, joy, and love!',
    'May your holidays be merry and bright. Merry Christmas!',
    "Sending season's greetings and warm wishes for a wonderful holiday!",
  ],
  'new year': [
    'Wishing you a brand new year full of joy, health, and wonderful surprises!',
    "Here's to new beginnings and all the great things the new year will bring!",
    'Happy New Year! May this year bring you everything you hope for.',
  ],
  'get well': [
    'Sending warm thoughts and wishes for a speedy recovery. Feel better soon!',
    "Thinking of you and hoping each day brings you closer to feeling great again.",
    "Wishing you rest, comfort, and a quick recovery. We're rooting for you!",
  ],
  generic: [
    'Thinking of you and sending my very best wishes on this special occasion!',
    'Hope this little gift brings a smile to your face. You truly deserve it!',
    'With warm thoughts and heartfelt wishes — enjoy this special moment!',
  ],
};

export function getFallbackMessages(occasion: string): string[] {
  const key = occasion.toLowerCase().trim();
  return FALLBACK_MESSAGES[key] ?? FALLBACK_MESSAGES['generic']!;
}
