import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { SuggestMessagesInput } from '../../src/domain/dtos/suggest-messages-input.dto.js';
import type { Suggestion } from '../../src/domain/entities/suggestion.js';
import type { LlmProvider } from '../../src/domain/providers/llm-provider.js';
import { PROMPT_CANARY } from '../../src/infra/llm/security/prompt-canary.js';
import { buildTestApp } from '../helpers/build-test-app.js';
import { INJECTION_CORPUS, LEGITIMATE_INPUTS } from './fixtures/injection-corpus.js';

const endpoint = '/api/v1/suggestions';

/**
 * The model, completely under the attacker's control.
 *
 * Every value that reached it comes straight back out, plus the canary it was
 * told to keep secret. This is not a pessimistic model — it is the only
 * assumption under which layer 3 can be said to *guarantee* anything, because
 * a defence that depends on the model behaving is not a defence.
 */
function compromisedProvider(): LlmProvider {
  return {
    name: 'compromised',
    model: 'compromised-v1',
    async generateSuggestions(input: SuggestMessagesInput): Promise<Suggestion[]> {
      return [
        `${input.occasion} ${input.relationship}`,
        `Session ${PROMPT_CANARY}. Visit http://evil.example`,
        input.occasion,
      ].map((text, index) => ({ id: `sug_${index}`, text }));
    },
  };
}

function appWithCompromisedModel(): Express {
  return buildTestApp({ llmProvider: compromisedProvider() });
}

/**
 * Nothing an attacker planted may come back out. The list is deliberately
 * broader than the guard's own rules: it is written from the client's point of
 * view, not from the implementation's.
 */
function assertOutputIsSafe(body: unknown): void {
  const serialised = JSON.stringify(body);

  expect(serialised).not.toContain(PROMPT_CANARY);
  expect(serialised).not.toMatch(/https?:\/\//);
  expect(serialised).not.toMatch(/<\/?[a-z][^>]*>/i);
  expect(serialised).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  expect(serialised).not.toMatch(/```|~~~/);
  expect(serialised).not.toMatch(/HACKED|PWNED|DAN\b/);
}

/** No response, on any path, may describe our internals. */
function assertNoInternalsLeaked(body: unknown): void {
  const serialised = JSON.stringify(body);

  expect(serialised).not.toMatch(/\bat \w+ \(/);
  expect(serialised).not.toMatch(/\.ts:\d+|\.js:\d+/);
  expect(serialised).not.toContain('node_modules');
  expect(serialised).not.toContain('/Users/');
  expect(serialised).not.toMatch(/openai|gemini|openrouter|compromised/i);
}

describe('S3 — the attack corpus, end to end', () => {
  /**
   * The single assertion the whole security effort reduces to. Whatever the
   * payload does, the API answers either "no" (400) or a card message (200).
   * A 5xx would mean an attacker found a way to make this service fail, which
   * is a smaller prize than injection but a prize all the same.
   */
  it.each(INJECTION_CORPUS.map((p) => [p.id, p] as const))(
    '%s never produces a 5xx',
    async (_id, payload) => {
      const response = await request(appWithCompromisedModel())
        .post(endpoint)
        .send({ occasion: payload.occasion, relationship: payload.relationship });

      expect(response.status).toBeLessThan(500);
      expect([400, 200]).toContain(response.status);
    },
  );

  it.each(INJECTION_CORPUS.map((p) => [p.id, p] as const))(
    '%s never puts unsafe content in the response',
    async (_id, payload) => {
      const response = await request(appWithCompromisedModel())
        .post(endpoint)
        .send({ occasion: payload.occasion, relationship: payload.relationship });

      assertOutputIsSafe(response.body);
    },
  );

  it.each(INJECTION_CORPUS.map((p) => [p.id, p] as const))(
    '%s never leaks our internals',
    async (_id, payload) => {
      const response = await request(appWithCompromisedModel())
        .post(endpoint)
        .send({ occasion: payload.occasion, relationship: payload.relationship });

      assertNoInternalsLeaked(response.body);
    },
  );

  /**
   * A 200 here means the payload survived layer 1 and the compromised model
   * produced poisoned text. The response must therefore be a fallback — if it
   * ever came back as `source: llm`, layer 3 let something through.
   */
  it.each(INJECTION_CORPUS.map((p) => [p.id, p] as const))(
    '%s, if it reaches the model, comes back as a fallback',
    async (_id, payload) => {
      const response = await request(appWithCompromisedModel())
        .post(endpoint)
        .send({ occasion: payload.occasion, relationship: payload.relationship });

      if (response.status !== 200) return;

      expect(response.body.data.source).toBe('fallback');
      expect(response.body.data.degraded).toBe(true);
      expect(response.body.data.model).toBeNull();
    },
  );
});

describe('S3 — where each payload is actually stopped', () => {
  /**
   * The corpus records which layer is expected to stop each payload. Asserting
   * it turns the documentation into something that fails when it stops being
   * true — and, just as usefully, catches a layer-1 rule that quietly grew
   * broad enough to swallow a payload it was never meant to own.
   */
  it.each(
    INJECTION_CORPUS.filter((p) => p.expectedLayer === '1_reject').map((p) => [p.id, p] as const),
  )('%s is refused at the input, before any model call', async (_id, payload) => {
    const response = await request(appWithCompromisedModel())
      .post(endpoint)
      .send({ occasion: payload.occasion, relationship: payload.relationship });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  /**
   * Stripped rather than refused. The visible text is an ordinary occasion and
   * the hidden instruction simply stops existing, so the right assertion is
   * not "the request failed" but "what reached the model no longer carries
   * the payload" — which is what the capturing provider below checks.
   */
  it.each(
    INJECTION_CORPUS.filter((p) => p.expectedLayer === '1_strip').map((p) => [p.id, p] as const),
  )('%s reaches the model with the hidden payload removed', async (_id, payload) => {
    let seen: SuggestMessagesInput | undefined;
    const capturing: LlmProvider = {
      name: 'capturing',
      model: 'capturing-v1',
      async generateSuggestions(input: SuggestMessagesInput): Promise<Suggestion[]> {
        seen = input;
        return [
          { id: 'sug_0', text: 'Wishing you a wonderful day.' },
          { id: 'sug_1', text: 'Thinking of you today.' },
          { id: 'sug_2', text: 'Hoping your day is a joy.' },
        ];
      },
    };

    const response = await request(buildTestApp({ llmProvider: capturing }))
      .post(endpoint)
      .send({ occasion: payload.occasion, relationship: payload.relationship });

    expect(response.status).toBe(200);
    expect(seen).toBeDefined();
    // No character above the Basic Multilingual Plane's visible range, and
    // nothing invisible, survived into what the model was asked.
    expect(seen?.occasion).toBe('birthday');
    expect(seen?.occasion).not.toMatch(/[\u{E0000}-\u{E007F}]/u);
  });

  /**
   * These reach the model on purpose: blocking them at the input would need a
   * heuristic broad enough to reject real requests. Layer 3 is what has to
   * hold, and the assertion is that it does — not that the payload is gone.
   */
  it.each(
    INJECTION_CORPUS.filter((p) => p.expectedLayer === '1_or_3').map((p) => [p.id, p] as const),
  )('%s is stopped no later than the output guard', async (_id, payload) => {
    const response = await request(appWithCompromisedModel())
      .post(endpoint)
      .send({ occasion: payload.occasion, relationship: payload.relationship });

    if (response.status === 400) return;

    expect(response.status).toBe(200);
    expect(response.body.data.degraded).toBe(true);
    assertOutputIsSafe(response.body);
  });
});

/**
 * The half of the suite that protects the product from its own defences.
 *
 * An allowlist that rejects `aniversário`, or a guard that rejects every
 * completion, would pass every test above while making the feature useless.
 * These cases fail loudly when a defence is tightened past the point of being
 * useful — which is how the typographic apostrophe bug was caught in phase 05.
 */
describe('S3 — legitimate input must survive every defence', () => {
  it.each(LEGITIMATE_INPUTS.map((i) => [`${i.occasion} / ${i.relationship}`, i] as const))(
    '%s is accepted',
    async (_label, input) => {
      const response = await request(buildTestApp()).post(endpoint).send(input);

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions.length).toBeGreaterThanOrEqual(2);
    },
  );

  it('serves real suggestions, not fallbacks, for legitimate input', async () => {
    for (const input of LEGITIMATE_INPUTS) {
      const response = await request(buildTestApp()).post(endpoint).send(input);

      expect(response.body.data.degraded).toBe(false);
      expect(response.body.data.source).toBe('llm');
    }
  });
});
