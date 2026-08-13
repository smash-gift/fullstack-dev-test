export interface Env {
  port: number;
  nodeEnv: string;

  openaiApiKey: string;
  openaiModel: string;
  openaiTimeoutMs: number;
  openaiMaxOutputTokens: number;

  messageCacheTtlMs: number;

  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;

  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  corsOrigin: string;
}

function parseIntOr(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function getEnv(): Env {
  return {
    port: parseIntOr(process.env.PORT, 3001),
    nodeEnv: process.env.NODE_ENV || "development",

    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    openaiTimeoutMs: parseIntOr(process.env.OPENAI_TIMEOUT_MS, 20000),
    openaiMaxOutputTokens: parseIntOr(process.env.OPENAI_MAX_OUTPUT_TOKENS, 600),

    messageCacheTtlMs: parseIntOr(process.env.MESSAGE_CACHE_TTL_MS, 21600000),

    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || "",

    rateLimitWindowMs: parseIntOr(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMaxRequests: parseIntOr(process.env.RATE_LIMIT_MAX_REQUESTS, 10),

    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  };
}

export function assertProductionEnv(env: Env): void {
  if (env.nodeEnv === "production" && !env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required when NODE_ENV=production.");
  }
}
