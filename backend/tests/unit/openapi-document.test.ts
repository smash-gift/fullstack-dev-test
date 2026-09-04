import SwaggerParser from '@apidevtools/swagger-parser';
import { describe, expect, it } from 'vitest';

import {
  MAX_SUGGESTION_COUNT,
  MIN_SUGGESTION_COUNT,
  SUGGESTION_LANGUAGES,
  SUGGESTION_TONES,
} from '../../src/domain/dtos/suggest-messages-input.dto.js';
import { buildOpenApiDocument } from '../../src/presentation/docs/openapi.js';

const document = buildOpenApiDocument({ version: '1.0.0' });

/** Walks to the request body schema the document publishes. */
function requestProperties(): Record<string, Record<string, unknown>> {
  const doc = document as never as {
    paths: Record<
      string,
      Record<
        string,
        {
          requestBody: {
            content: Record<
              string,
              { schema: { properties: Record<string, Record<string, unknown>> } }
            >;
          };
        }
      >
    >;
  };

  const body = doc.paths['/api/v1/suggestions']?.post?.requestBody;
  return body?.content['application/json']?.schema.properties ?? {};
}

describe('the published OpenAPI document', () => {
  /**
   * Validated against the official OpenAPI 3.0 schema, not eyeballed. A
   * malformed document would still render something in Swagger UI while
   * silently misleading anyone generating a client from it.
   */
  it('is a valid OpenAPI 3.0 document', async () => {
    await expect(SwaggerParser.validate(structuredClone(document) as never)).resolves.toBeDefined();
  });

  it('describes both endpoints this API serves', () => {
    const paths = Object.keys((document as { paths: object }).paths);

    expect(paths).toContain('/api/v1/suggestions');
    expect(paths).toContain('/health');
  });

  /**
   * Relative, so "Try it out" calls whichever host is serving the page. A
   * hostname baked in here would send the evaluator's request somewhere else.
   */
  it('points at the server that serves it', () => {
    expect((document as { servers: { url: string }[] }).servers).toEqual([
      { url: '/', description: 'This server' },
    ]);
  });
});

/**
 * The point of generating the document from the Zod schemas is that a
 * disagreement between what the API accepts and what it documents becomes
 * impossible. These assertions are how that claim stays true: they read the
 * published document and compare it against the domain's own constants, so
 * changing a rule in one place and not the other fails here.
 */
describe('the document is derived from the validation schemas', () => {
  it('publishes the tones the schema actually accepts', () => {
    expect(requestProperties().tone?.enum).toEqual([...SUGGESTION_TONES]);
  });

  it('publishes the languages the schema actually accepts', () => {
    expect(requestProperties().language?.enum).toEqual([...SUGGESTION_LANGUAGES]);
  });

  it('publishes the count bounds the schema enforces', () => {
    expect(requestProperties().count?.minimum).toBe(MIN_SUGGESTION_COUNT);
    expect(requestProperties().count?.maximum).toBe(MAX_SUGGESTION_COUNT);
  });

  it('publishes the free-text length limits', () => {
    for (const field of ['occasion', 'relationship']) {
      expect(requestProperties()[field]?.minLength).toBe(2);
      expect(requestProperties()[field]?.maxLength).toBe(60);
    }
  });

  it('marks only the two fields that have no default as required', () => {
    const doc = document as never as {
      paths: Record<
        string,
        Record<
          string,
          { requestBody: { content: Record<string, { schema: { required: string[] } }> } }
        >
      >;
    };
    const required =
      doc.paths['/api/v1/suggestions']?.post?.requestBody.content['application/json']?.schema
        .required;

    expect(required?.sort()).toEqual(['occasion', 'relationship']);
  });
});

describe('the document tells the truth about failure', () => {
  function responses(): Record<string, { description: string }> {
    const doc = document as never as {
      paths: Record<string, Record<string, { responses: Record<string, { description: string }> }>>;
    };
    return doc.paths['/api/v1/suggestions']?.post?.responses ?? {};
  }

  it('lists every status the error handler can produce for this route', () => {
    expect(Object.keys(responses()).sort()).toEqual([
      '200',
      '400',
      '405',
      '413',
      '415',
      '429',
      '500',
    ]);
  });

  /** The brief asks for the rate limit behaviour to be documented. */
  it('documents Retry-After on the 429', () => {
    const doc = document as never as {
      paths: Record<
        string,
        Record<string, { responses: Record<string, { headers?: Record<string, unknown> }> }>
      >;
    };
    const headers = doc.paths['/api/v1/suggestions']?.post?.responses['429']?.headers;

    expect(headers).toHaveProperty('Retry-After');
    expect(headers).toHaveProperty('RateLimit-Remaining');
  });

  /**
   * Degradation is the behaviour the brief cares most about, and it hides
   * inside a 200. A reader who only skims status codes has to still find it.
   */
  it('explains that a 200 can be a fallback', () => {
    expect(responses()['200']?.description).toMatch(/degraded/i);
  });
});
