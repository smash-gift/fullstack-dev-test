# AI Gift Card Message Suggester

Senior Full Stack technical test — an API and a Flutter app that use an LLM to suggest
short, personalized gift card messages, and that **degrade gracefully** when the LLM
fails.

> ### 🚧 Work in progress
>
> The architecture and all design decisions are settled and documented. Implementation is
> underway. This README becomes the final deliverable in **phase 12**, once every command
> below has been executed and verified on a clean clone (**phase 13**).
>
> Commands are not published here until they have been run — a README that documents
> intent rather than reality is the most common way run instructions end up broken.
>
> Live status: [`docs/00-overview/checklist.md`](docs/00-overview/checklist.md)

---

## The core idea

```mermaid
flowchart LR
    U([User]) -->|occasion + relationship| APP[Flutter App]
    APP -->|POST /api/v1/suggestions| API[Node.js API]
    API -->|prompt| LLM[(LLM Provider)]
    LLM -->|JSON| API
    API -->|200 · suggestions| APP

    LLM -.->|timeout · 429 · 5xx · invalid JSON| FB[Fallback<br/>curated templates]
    FB -.->|200 · degraded: true| APP
```

Calling an LLM API is the easy part. The dashed line is what this test actually measures:
**the user never gets an error screen.** When the model fails, the backend returns usable
suggestions plus an honest signal that quality is reduced.

---

## Repository layout

```
.
├── README.md          # this file — English, for the reviewer
├── docs/              # Portuguese — architecture, ADRs, phases, API contract
├── backend/           # Node.js 20 + TypeScript (Clean Architecture)   [phase 02]
└── flutter_app/       # Flutter (Clean Dart)                           [phase 07]
```

---

## Decisions already made

Every decision below is documented with its **trade-offs and the alternatives that were
rejected** — not just the upside.

| Decision | Choice | Rationale |
|---|---|---|
| **LLM failure response** | `HTTP 200` + `degraded: true` + curated fallback | [ADR-0003](docs/01-architecture/decisions/adr-0003-fallback-strategy.md) |
| **LLM integration** | `LlmProvider` port + 3 adapters (OpenAI default, OpenRouter, Gemini) | [ADR-0002](docs/01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md) |
| **Error handling** | Single error envelope, stable codes, never a stack trace | [ADR-0004](docs/01-architecture/decisions/adr-0004-error-taxonomy.md) |
| **Rate limiting** | 30 requests / 5 min per IP → `429` | [ADR-0005](docs/01-architecture/decisions/adr-0005-rate-limiting.md) |
| **Caching & cost** | In-memory LRU behind a port, 10 min TTL | [ADR-0006](docs/01-architecture/decisions/adr-0006-caching-and-cost.md) |
| **Backend architecture** | Clean Architecture — ports & adapters | [ADR-0001](docs/01-architecture/decisions/adr-0001-clean-architecture-backend.md) |
| **Flutter architecture** | Clean Dart + `ChangeNotifier`, no codegen | [ADR-0007](docs/01-architecture/decisions/adr-0007-flutter-clean-dart.md) |
| **Firebase** | Deliberately out of the runtime | [ADR-0008](docs/01-architecture/decisions/adr-0008-firebase-out-of-runtime.md) |
| **LLM security** | Four-layer defense, weighted on output validation | [ADR-0009](docs/01-architecture/decisions/adr-0009-llm-security.md) |
| **App security** | Lean baseline, each control tied to a named threat | [ADR-0010](docs/01-architecture/decisions/adr-0010-application-security.md) |

### A note on Firebase

The test header lists `Firebase (Firestore, Cloud Functions, Auth)` in the stack line.
That is its **only** occurrence in the whole document — it does not appear in
*Prerequisites* (which does list the LLM API key as required), nor in any detailed
requirement, nor in *What we evaluate*. The specified feature is also stateless: there is
no entity to persist, no user to authenticate, no session to keep.

We read that line as describing **the company's stack**, not this test's scope. Firebase
is therefore left out of the runtime, so that `git clone` → run stays two commands — and
[ADR-0008](docs/01-architecture/decisions/adr-0008-firebase-out-of-runtime.md) documents
precisely where Firestore, Cloud Functions and Auth would plug into the architecture, and
what each would buy.

---

## Security

The test does not ask for it. It is here anyway, because this endpoint accepts free text
from a user and feeds it into a prompt — that is an attack surface whether or not the brief
names it.

### The property that shapes the whole defense

> **This system's LLM has no tools.** No function calling, no database, no file access, no
> outbound requests.

That rules out **LLM06 Excessive Agency** by construction. A successful prompt injection
here cannot execute code or exfiltrate data. It can do exactly one thing: **make the model
emit text that we then display as our own product.**

Which leads to the decision the design turns on:

> Blocking 100% of injections at the input is something nobody can guarantee.
> **Validating what comes out before displaying it — that one is a guarantee.**

So the heaviest layer is output validation, not input filtering.

### Four layers

| # | Layer | Does |
|---|---|---|
| 1 | **Input sanitization** | NFKC normalization; rejects bidi overrides (Trojan Source), zero-width and control characters, newlines; character allowlist; injection heuristics |
| 2 | **Structural prompt hardening** | System prompt is a constant — user text is **never** interpolated into it. Input travels as a **JSON value** in the user message, plus spotlighting and a per-process canary |
| 3 | **Output validation** ⭐ | Rejects URLs, emails, HTML, markdown links, code fences, the canary, and meta-responses. Any rejection → fallback |
| 4 | **Safe rendering** | Suggestions render as plain `Text` only. No HTML/Markdown widget, no linkify |

### Two properties worth calling out

**Security violations reuse the fallback path.** A blocked injection produces
`LlmInvalidResponseError` → fallback → `200` with `degraded: true` — the exact same funnel
built for provider timeouts. No second degradation mechanism was needed, and the response
to a blocked injection is **indistinguishable** from a provider timeout, so an attacker
gets no signal about which rule fired.

**The tests assume the model is fully compromised.** The main security suite runs the
injection corpus through a stub provider that **echoes the input back** — rather than
hoping the real model resists, it verifies that layer 3 holds on its own. Everything runs
offline, with no API key.

| Topic | Where |
|---|---|
| Threat model — agents, threats ranked by risk, what is out of scope | [`docs/05-security/threat-model.md`](docs/05-security/threat-model.md) |
| Prompt injection, the four layers, OWASP LLM Top 10 coverage | [`docs/05-security/llm-security.md`](docs/05-security/llm-security.md) |
| HTTP baseline, secrets, dependencies, cleartext HTTP | [`docs/05-security/application-security.md`](docs/05-security/application-security.md) |
| Test plan, attack corpus, gated live red-team suite | [`docs/05-security/security-testing.md`](docs/05-security/security-testing.md) |

**Known residual risk, stated rather than hidden:** an injection that produces text which
is *formally* clean — no URL, no HTML, no meta-language — but undesirable in content still
gets through the output guard. Closing that would require a content-moderation API call per
request, rejected on cost and latency grounds
([ADR-0009](docs/01-architecture/decisions/adr-0009-llm-security.md)).

---

## API contract (planned)

```http
POST /api/v1/suggestions
Content-Type: application/json

{ "occasion": "birthday", "relationship": "friend" }
```

**Success**

```jsonc
{
  "data": {
    "suggestions": [ { "id": "sug_...", "text": "..." } ],
    "source": "llm",
    "model": "gpt-4o-mini",
    "degraded": false
  },
  "meta": { "requestId": "req_...", "generatedAt": "...", "cached": false }
}
```

**LLM failed — still `200`**

```jsonc
{
  "data": { "suggestions": [ /* ... */ ], "source": "fallback", "model": null, "degraded": true },
  "meta": { "requestId": "req_...", "reason": "llm_timeout" }
}
```

Full contract, including every error code:
[`docs/03-api/contract.md`](docs/03-api/contract.md)

---

## How AI was used in this test

The test asks for this explicitly, so the answer is specific rather than generic:
[`docs/06-ai-usage/ai-usage.md`](docs/06-ai-usage/ai-usage.md), backed by a
decision-by-decision authorship log in
[`docs/00-overview/decisions-log.md`](docs/00-overview/decisions-log.md).

Short version: an AI assistant was used as a design interlocutor and to draft
documentation and code. Every branching decision — LLM provider, HTTP semantics of the
fallback, Firebase, Flutter state management — was made by me, and each one is recorded
with the alternative that was rejected and why.

---

## Documentation

| Topic | Where |
|---|---|
| Architecture overview + diagrams | [`docs/01-architecture/overview.md`](docs/01-architecture/overview.md) |
| Backend design | [`docs/01-architecture/backend.md`](docs/01-architecture/backend.md) |
| Flutter design | [`docs/01-architecture/frontend.md`](docs/01-architecture/frontend.md) |
| Decision records (ADRs) | [`docs/01-architecture/decisions/`](docs/01-architecture/decisions/) |
| API contract | [`docs/03-api/contract.md`](docs/03-api/contract.md) |
| Environment variables | [`docs/04-operations/environment.md`](docs/04-operations/environment.md) |
| Running locally | [`docs/04-operations/running-locally.md`](docs/04-operations/running-locally.md) |
| Security | [`docs/05-security/`](docs/05-security/) |
| Requirement traceability | [`docs/00-overview/test-requirements.md`](docs/00-overview/test-requirements.md) |
| Original test statement | [`docs/00-overview/original-test.md`](docs/00-overview/original-test.md) |

`docs/` is written in Portuguese; this README, all code, filenames and code comments are
in English.
