export interface AppConfig {
  allowedOrigins: string[];
}

/**
 * Reads configuration once, at module load.
 *
 * `backend/.env` is picked up automatically by firebase-functions, in the
 * emulator and on deploy alike, so nothing here needs a dotenv dependency.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    allowedOrigins: splitList(env.ALLOWED_ORIGINS, ['*']),
  };
}

function splitList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : fallback;
}
