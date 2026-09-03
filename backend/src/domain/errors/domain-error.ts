/**
 * Base for every error the domain raises.
 *
 * `code` is the stable identifier the presentation layer maps to an HTTP
 * status and exposes to clients. Messages may be reworded; codes may not.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
