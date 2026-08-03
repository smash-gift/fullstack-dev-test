/**
 * Async cache abstraction for suggestion sets. Async so the same interface
 * covers both the in-memory cache (used for the standalone server) and the
 * Firestore-backed cache (used when the API runs as a Cloud Function). The
 * service depends only on this interface — it never knows which backend is in
 * use.
 */
export interface SuggestionCache {
  get(key: string): Promise<string[] | undefined>;
  set(key: string, value: string[]): Promise<void>;
}
