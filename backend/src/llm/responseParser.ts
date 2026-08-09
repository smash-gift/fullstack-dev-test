import { findBlockedWord } from './contentGuard';
import { LlmInvalidResponseError, LlmUnsafeContentError } from './errors';
import { MAX_MESSAGE_CHARACTERS, SUGGESTIONS_PER_CALL } from './promptBuilder';

/**
 * Turns an OpenAI chat completion into the list of messages.
 *
 * Everything the model sends is treated as untrusted: structured outputs make
 * malformed JSON unlikely, not impossible, and the schema cannot express the
 * array length. Anything that does not match the contract raises, and the
 * service turns that into the fallback.
 */
export function parseCompletion(payload: unknown): string[] {
  const choice = firstChoice(payload);

  if (typeof choice.refusal === 'string' && choice.refusal.length > 0) {
    throw new LlmInvalidResponseError('Model refused to answer');
  }

  if (typeof choice.content !== 'string' || choice.content.trim().length === 0) {
    throw new LlmInvalidResponseError('Completion had no content');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(choice.content);
  } catch {
    throw new LlmInvalidResponseError('Completion content was not valid JSON');
  }

  const suggestions = (parsed as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(suggestions)) {
    throw new LlmInvalidResponseError('Completion did not contain a suggestions array');
  }

  const cleaned = suggestions
    .filter((message): message is string => typeof message === 'string')
    .map((message) => message.trim())
    .filter((message) => message.length > 0 && message.length <= MAX_MESSAGE_CHARACTERS);

  if (cleaned.length !== SUGGESTIONS_PER_CALL) {
    throw new LlmInvalidResponseError(
      `Expected ${SUGGESTIONS_PER_CALL} usable suggestions, got ${cleaned.length}`,
    );
  }

  // Last line of defence. The prompt tells the model to refuse instructions
  // hidden in the input fields, but a prompt is a request, not a guarantee —
  // this check does not depend on the model having cooperated.
  const blocked = findBlockedWord(cleaned);
  if (blocked) {
    throw new LlmUnsafeContentError(`Generated message contained a blocked word: ${blocked}`);
  }

  return cleaned;
}

interface Choice {
  content?: unknown;
  refusal?: unknown;
}

function firstChoice(payload: unknown): Choice {
  const choices = (payload as { choices?: unknown }).choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmInvalidResponseError('Completion had no choices');
  }

  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== 'object' || message === null) {
    throw new LlmInvalidResponseError('Completion choice had no message');
  }

  return message as Choice;
}
