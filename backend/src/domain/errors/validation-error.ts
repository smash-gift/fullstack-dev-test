import { DomainError } from './domain-error.js';

export interface ValidationIssue {
  readonly field: string;
  readonly issue: string;
}

/**
 * The caller sent something we cannot process.
 *
 * Never triggers a fallback: serving suggestions to a malformed request would
 * hide the caller's bug instead of surfacing it.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly issues: readonly ValidationIssue[];

  constructor(message: string, issues: readonly ValidationIssue[] = []) {
    super(message);
    this.issues = issues;
  }
}

/**
 * The path exists; the verb does not.
 *
 * Distinguished from NOT_FOUND because the two send the caller to different
 * places: 404 says "check the URL", 405 says "the URL is right, change the
 * method". Answering 404 for a wrong verb hides that the endpoint is there.
 */
export class MethodNotAllowedError extends DomainError {
  readonly code = 'METHOD_NOT_ALLOWED';
  readonly allowed: readonly string[];

  constructor(allowed: readonly string[]) {
    super(`Method not allowed. Allowed: ${allowed.join(', ')}`);
    this.allowed = allowed;
  }
}
