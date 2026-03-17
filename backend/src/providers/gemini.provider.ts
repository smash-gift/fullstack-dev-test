import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const USE_MOCK = process.env.USE_MOCK === "true";

async function mockSuggestions(
  occasion: string,
  relationship: string
): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const messages: Record<string, string[]> = {
    "aniversário-amigo": [
      "Feliz aniversário! Que este presente traga muita alegria ao seu dia especial.",
      "Parabéns, amigo! Você merece tudo de melhor nessa data tão especial.",
      "Um presente com todo carinho para celebrar mais um ano da sua vida incrível!",
    ],
    "casamento-colega": [
      "Parabéns pelo casamento! Que essa nova fase seja repleta de amor e felicidade.",
      "Desejando a vocês uma vida a dois cheia de cumplicidade e alegria!",
      "Que este presente simbolize toda a felicidade que vocês merecem juntos.",
    ],
  };

  const key = `${occasion}-${relationship}`;
  return (
    messages[key] || [
      `Que este presente traga alegria neste(a) ${occasion} especial!`,
      `Com muito carinho para você, desejando tudo de bom neste momento.`,
      `Uma lembrança especial para celebrar esta data importante juntos.`,
    ]
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function generateWithGemini(
  occasion: string,
  relationship: string
): Promise<string[]> {
  if (USE_MOCK) {
    console.log("🔧 Usando mock do Gemini");
    return mockSuggestions(occasion, relationship);
  }

  const prompt = `
    Você é um assistente que cria mensagens carinhosas para cartões de vale-presente.
    Gere exatamente 3 mensagens curtas (1 a 2 frases cada) para:
    - Ocasião: ${occasion}
    - Relacionamento: ${relationship}

    Responda APENAS com as 3 mensagens, uma por linha, sem numeração, sem explicações.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}