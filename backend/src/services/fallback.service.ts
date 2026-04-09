import { SuggestionResponse } from "../types/suggestion";

const genericMessages = [
  "Wishing you a wonderful and memorable day.",
  "Hope this special occasion brings you happiness and joy.",
  "Sending warm wishes for a truly lovely celebration.",
];

const byOccasion: Record<string, string[]> = {
  birthday: [
    "Happy birthday! Wishing you a day full of joy and laughter.",
    "Hope your birthday is filled with special moments and happy memories.",
    "Wishing you all the best on your special day.",
  ],
  wedding: [
    "Wishing you both a lifetime of love and happiness.",
    "Congratulations on this beautiful new chapter together.",
    "May your journey together be filled with joy and love.",
  ],
  "thank you": [
    "Thank you so much for your kindness and support.",
    "Your thoughtfulness means so much and is deeply appreciated.",
    "Sending heartfelt thanks for everything you have done.",
  ],
};

export function execute(occasion: string): SuggestionResponse {
  const normalized = occasion.toLowerCase().trim();
  const suggestions = byOccasion[normalized] ?? genericMessages;

  return {
    suggestions: suggestions.slice(0, 3),
    source: "fallback",
  };
}