/**
 * A single gift card message suggestion.
 *
 * `id` is stable within a response so clients can use it as a list key.
 * It is not persisted and carries no meaning across requests.
 */
export interface Suggestion {
  readonly id: string;
  readonly text: string;
}
