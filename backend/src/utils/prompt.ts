export function buildPrompt(occasion: string, relationship: string): string {
  return `You are a warm and thoughtful gift card message writer.

Generate exactly 3 short, heartfelt gift card messages for the following context:
- Occasion: ${occasion}
- Relationship: ${relationship}

Requirements:
- Each message must be 1-2 sentences long (maximum 30 words each)
- Messages must be warm, personal, and appropriate for a physical gift card
- Do not number or label the messages
- Separate each message with exactly this delimiter on its own line: ---
- Output ONLY the 3 messages separated by ---, no extra text, no explanations, no preamble

Example of the exact expected format:
Wishing you a wonderful day filled with joy and laughter!
---
Hope this little gift brings a big smile to your face. You deserve it!
---
Thinking of you on this special occasion and sending lots of love your way.`;
}
