# Working rules for agents in this repository

This file is read by the coding assistant at the start of every session. It is short on purpose:
the README and `docs/` hold the reasoning, this holds the constraints.

## What this is

Gift card message suggester. `backend/` is a Node 20 + TypeScript + Fastify API that asks Gemini for
2–3 short messages and degrades to a curated catalog on any model failure. `flutter_app/` is the
Flutter 3.38 client. The brief is `docs/CHALLENGE.md`.

## Invariants — do not trade these away for a feature

1. A valid request always returns usable messages with `200`, `source` and, when degraded,
   `degradedReason`. Model failures are never `5xx`.
2. Nothing from the provider reaches the client or the logs: no error bodies, no prompt, no raw
   input, no key.
3. `occasion` and `relationship` are untrusted data. They enter the prompt only through
   `buildUserContent`, never by string concatenation into instructions.
4. Every rule in the prompt has a matching check in `output-guard.ts`. A prompt is a request; the
   guard is the guarantee.
5. The use case depends on ports (`domain/ports.ts`), never on Gemini, `fetch` or the cache class.

## Before claiming anything is done

```bash
cd backend && npm run typecheck && npm test
cd flutter_app && flutter analyze && flutter test
```

Then run the README instructions literally: start the server, hit `/health`, post the
birthday-and-friend flow. If a README sentence cannot be executed, change the sentence or the code.

## Conventions

- Test descriptions in English, `should ...`. No comments inside tests; the name is the doc.
- No comments that restate the code or narrate a scenario. Comments explain a non-obvious *why*.
- No new dependencies without a reason written in the README's decisions table.
- Model ids are configuration with an expiry date. Changing `GEMINI_MODEL` means updating the
  README and `.env.example` in the same change.
- Commits are small, one concern each. The assistant's role is recorded in `docs/AI_WORKFLOW.md`.
