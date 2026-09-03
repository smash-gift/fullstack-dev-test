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
