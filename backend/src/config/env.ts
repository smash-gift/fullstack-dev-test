export const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_VERSION = process.env.GEMINI_API_VERSION || 'v1';

export const geminiConfig = {
  apiKey: GEMINI_API_KEY,
  model: GEMINI_MODEL,
  apiVersion: API_VERSION,
};