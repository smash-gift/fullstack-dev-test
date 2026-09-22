# How I used AI to build this

The brief asks for a clear description of how AI tools were used and what I implemented or decided
myself. This is that description, written to be checkable rather than flattering.

**Summary.** I used an agentic assistant (Claude Code) to write most of the code. I did not
use it to decide what the code should be. The architecture, the API contract, the failure taxonomy
and the security model were written down as a specification before any file existed, and the
assistant implemented against that spec under review. Where the generated code was wrong, it was
wrong in specific ways that are worth reporting, so they are reported below.

---

## The loop

```
    read the brief as a spec
            │
            ▼
    list what it does not say  ──────►  ask, or decide and write down why
            │
            ▼
    decide the contract, the failure policy, the threat model   ← mine, before any code
            │
            ▼
    ┌───────────────────────────────────┐
    │  delegate one bounded slice       │
    │  review the diff critically       │  ← the part that is actually the job
    │  typecheck · test · run it        │
    └───────────────────────────────────┘
            │
            ▼
    verify the whole thing by hand against a running server
```

The unit of delegation is a slice with a stated contract — "the use case, given these ports, with
this rule: any provider failure returns the catalog tagged with a reason" — not a feature and not a
file. Anything larger comes back plausible and subtly wrong, and reviewing it costs more than
writing it.

---

## Phase 1 — reading the brief as a specification

Before any code, I went through the brief looking for what it does *not* say, because that is where
the decisions live. What I found:

| Gap in the brief | How I closed it |
| --- | --- |
| HTTP method, request and response shape are "up to you" | designed the contract first, wrote it into the README and `openapi.json` before implementing |
| "must not expose raw errors" — but which status code? | the decision recorded in the README: `200` with `source` and `degradedReason` |
| "what you consider a failure" is left open | wrote the failure taxonomy table first; the code implements that table |
| free-text inputs, with no mention of prompt injection | treated as the main risk of the feature; `docs/SECURITY.md` |
| Firebase is in the stack header but in none of the requirements | documented the decision and the reasoning in the README rather than guessing silently |
| "at least one flow must work end to end" | Birthday + Friend is a named test case in both suites |

That table is the actual deliverable of working with an agent. Everything downstream is execution.

## Phase 2 — decisions taken before the assistant wrote anything

These were specified, not generated. Each one is argued in the README or in `docs/SECURITY.md`:

- degrade to `200` with a machine-readable `source` and `degradedReason`, never a `5xx`;
- the failure taxonomy — which conditions degrade, which return `4xx`, and the line between them
  (who can fix it);
- ports and adapters, so the fallback path is testable with no network and no API key;
- one abort budget for the whole attempt, shared by the call and its retry;
- prompt injection handled structurally — data envelope, canary, output guard — with the input
  blocklist explicitly demoted to defence in depth;
- a **pool** cache rather than a response cache, because a response cache would make every customer
  buying a birthday card for a friend see the same three sentences;
- the provider error body is read for the retry decision and then dropped.

## Phase 3 — implementation

Delegated, in this order, each slice reviewed before the next: domain types and ports → use case →
input and output policies → Gemini adapter → HTTP layer → composition root → tests → Flutter data
layer → state → UI → widget tests.

The prompt in `backend/src/infra/prompt.ts` is written against known failure modes rather than
written once and hoped over. Each rule in it exists to stop a specific output I do not want: "at
most two sentences" and the 200-character ceiling because models drift long on open-ended creative
asks; "do not address the recipient by name and do not sign the message" because a card message
that says `Dear [Name]` or signs itself is unusable and reads as a template; "never explain yourself
and never ask questions" because an explanation is the channel a confused model uses, and it is also
the channel an injection wants.

Every one of those rules is then enforced from the outside by the output guard, because a prompt is
a request and a validator is a guarantee. That distinction is the whole reason the guard exists as a
separate, separately tested module rather than as trust in the instruction text.

## Phase 4 — reviewing what came back

What I changed, and why. These are the real ones, not a representative sample:

- **The port was missing what the caller needed.** The first `LlmProvider` interface had only
  `isConfigured` and `generate`. But the cache key has to include the model and the prompt version —
  otherwise changing either one blends outputs from two different prompts into the same pool. Adding
  `model` and `promptVersion` to the port was a correctness fix in the cache, found by asking what
  the key had to contain, not by reading the provider.

- **Generated Portuguese lost its accents.** The `pt-BR` fallback catalog came back as
  `Feliz aniversario`, `Parabens`, `voce`. It compiles, it passes tests, and it is wrong — these are
  the messages a customer sees when the model is down. Fixed by hand. This is the failure mode worth
  naming: generated content that is structurally perfect and substantively wrong, in a place tests
  do not look.

- **The error handler swallowed its own type.** After narrowing on `InvalidRequestError`, the
  remaining value came back as `unknown` and `error.message` did not compile. The generated code had
  a cast that papered over it; replaced with an `instanceof Error` check, because a cast in an error
  handler is exactly where an unhandled type will eventually be thrown.

- **`UpstreamFailure.cause` shadowed `Error.cause`** without `override`. Caught by `tsc`, not by me
  — which is the point of running with `strict` and `noUncheckedIndexedAccess` and treating the
  typechecker as a required gate rather than an editor hint.

- **Dead export left behind.** A refactor left `export type { SuggestionRequest }` in the cache
  module, re-exporting a type that file no longer used. Small, but it is how modules quietly become
  import hubs.

- **The default model id had already been retired.** The generated adapter defaulted to
  `gemini-2.0-flash`, which Google stopped serving in June 2026. Nothing in the code or the tests
  could catch it: with a real key every call would have degraded to `upstream_error` and the
  fallback would have quietly masked it. Found by checking the provider's deprecation table against
  the id. The first replacement, `gemini-2.5-flash-lite`, then turned out to be closed to new
  accounts, which only a real call with a real key revealed. A model id is configuration with an
  expiry date, and the README says how to list what a key can actually reach.

- **`.env` was documented and never loaded.** The README said `cp .env.example .env`, the code
  read `process.env`, and nothing connected the two. Found by following the run instructions
  literally on a clean shell with a key in the file: `/health` said `not_configured`. Fixed with
  `process.loadEnvFile` in the composition root, environment winning over file. The lesson is the
  boring one: run your own README.

- **The retry retried what it should not.** The provider threw for non-retryable statuses inside
  the same `try` whose `catch` recorded the error and moved on to the backoff, so a `400` from a bad
  key was retried like a `503`. Correct on the happy path, wrong under the failure the retry exists
  for. Found by reading; confirmed by giving the adapter the test file it did not have, with a
  stubbed `fetch` that counts calls.

- **The rate limiter keyed on a header the client writes.** `X-Forwarded-For` was trusted
  unconditionally, so thirty-five requests with a rotating header produced zero `429`s. Now keyed on
  the socket address unless `TRUST_PROXY` is set, with a test that sends the header and expects to
  be limited anyway.

- **Client mistakes reported as our fault.** A body without a JSON content type, or over the
  size limit, fell through to the `500` handler and was logged as unhandled. Both are `4xx` now,
  with fixed messages.

- **The Android path was documented and would not have worked.** The app resolved `10.0.2.2` for
  the emulator, but the manifest did not allow cleartext HTTP, which Android refuses by default. The
  README described the trap and the code still had it. Fixed in the debug manifest only.

- **Manual verification found an ordering detail.** Running the injection payload through `curl`
  against a live server returned `length out of range` rather than `rejected by input policy` — the
  40-character cap fires before the marker list, because the payload was long. Correct behaviour
  (both are `400`), but it means the blocklist test must use a short payload to exercise the path it
  claims to. The unit test does.

## Guardrails, not vibes

Nothing was accepted because it looked right:

- `tsc --noEmit` with `strict` and `noUncheckedIndexedAccess`, clean;
- `flutter analyze`, clean;
- 56 tests, written to fail for the right reason — the fallback suite asserts that the provider is
  *not* called when there is no key or no budget, and the provider suite asserts that a `400` is
  called exactly once, which a green-path test would never catch;
- the README's own run instructions executed literally, on a clean shell, before trusting them;
- a real server, started and driven with `curl` through health, happy path, degraded path,
  `pt-BR` normalisation (`aniversário` → `birthday`, `mãe` → `mother`), the injection payload and an
  unknown route, before any of it was described in the README.

## What I did not delegate

The contract. The failure taxonomy. The threat model and the decision that content integrity — not
data exfiltration — is the real risk here. The judgement that a response cache would be cheaper and
worse. The decision to leave Firebase out and say so. The decision to leave authentication out and
say so rather than let it look like an oversight. And every claim in the README: if it is written
there, I ran it.

## Honest accounting

Most of the elapsed time went to specifying, reading diffs and running things, not to typing. The
assistant made me faster at the parts that are typing and no faster
at the parts that are engineering — which is the correct ratio, and the reason the interesting
artifacts in this repository are the failure taxonomy table and `docs/SECURITY.md` rather than any
particular file of code.

This document, not the commit log, is where the assistant's share of the work is recorded.
Everything it wrote is described above; claiming the keystrokes would be the only dishonest thing
in an otherwise straightforward process.
