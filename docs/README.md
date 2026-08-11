# Business Specifications — Spec-Driven Development (SDD)

This directory contains formal documentation of functional and architectural specifications for the **AI Gift Card Message Suggester** project, structured according to the **Spec-Driven Development (SDD)** methodology.

---

## 🏗️ Aligned Architectural Decisions (/grill-me)

- **LLM Provider**: Google Gemini API (`gemini-2.5-flash`).
- **GuestUser Identification (RN02/RN03)**: Client-generated UUID v4 in Flutter app, persisted for 7 days in `SharedPreferences` (mobile & web) and sent in the HTTP header `X-Guest-ID`.
- **Frontend State Management**: `flutter_bloc` (Cubit).
- **Backend Caching Engine**: In-memory LRU cache with `@nestjs/cache-manager` (24-hour TTL).
- **LLM Multi-Provider Fallback (RN05)**: Priority chain: Google Gemini -> Anthropic Claude Opus -> OpenAI (3s timeout per provider).
- **LLM Failure Policy (RN04)**: Deterministic error response returning `HTTP 503 Service Unavailable` (`LLM_SERVICE_UNAVAILABLE`) if all providers fail.
- **Backend Architecture**: Detailed specification available at [`architecture/backend-architecture.md`](architecture/backend-architecture.md).

---

## 📚 Specification Index

| Code | Specification Title | Summary Description | File |
| :--- | :--- | :--- | :--- |
| **RN01** | Internationalization (i18n) | Support for languages (EN / PT-BR) and frontend selector | [`specs/RN01-internationalization.md`](specs/RN01-internationalization.md) |
| **RN02** | GuestUser Profile (Anonymous) | Navigation flow and anonymous user identification | [`specs/RN02-guest-user.md`](specs/RN02-guest-user.md) |
| **RN03** | User Cache Lifecycle (1 Week) | Retention policy, expiration, and local session renewal | [`specs/RN03-user-caching.md`](specs/RN03-user-caching.md) |
| **RN04** | LLM Failure & Error Handling | Rules for timeout, quota, and HTTP 503 error contract | [`specs/RN04-llm-failure-handling.md`](specs/RN04-llm-failure-handling.md) |
| **RN05** | Multi-LLM Fallback Chain | Priority chain: Gemini -> Claude Opus -> OpenAI | [`specs/RN05-multi-llm-fallback-chain.md`](specs/RN05-multi-llm-fallback-chain.md) |
| **API** | REST API & LLM Contract | Payload specification, request headers, and response formats | [`specs/API-contract-spec.md`](specs/API-contract-spec.md) |
| **UC01-10** | Application Use Cases Suite | Complete use cases (UC01-UC10) for guest flow, editor & export | [`use-cases/README.md`](use-cases/README.md) |
| **STITCH** | STITCH Prototyping Prompts | Structured prompts library for UI wireframing with STITCH | [`use-cases/stitch-prototyping-prompts.md`](use-cases/stitch-prototyping-prompts.md) |
| **STITCH-DQR** | STITCH Master Prompt (DQR Colors) | Master prompt with official DQR Tech extracted color palette | [`use-cases/stitch-master-prompt-dqr.md`](use-cases/stitch-master-prompt-dqr.md) |


