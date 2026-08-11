# Rule Specification: RN05 — Multi-LLM Provider Fallback Chain

- **Rule Code**: RN05
- **Affected Modules**: `server/src/modules/llm`, `server/src/modules/suggester`, `application/lib/features/suggester`
- **Status**: Approved
- **Parent Specs**: [`API-contract-spec.md`](API-contract-spec.md), [`RN04-llm-failure-handling.md`](RN04-llm-failure-handling.md)

---

## 🎯 Business Rule Objective

To maximize service availability and minimize downtime, the backend implements a dynamic **Multi-LLM Fallback Chain**. The service sequentially tries multiple AI models until a successful response is produced. Only if all configured models in the chain fail or time out will the system return an HTTP 503 error (per [`RN04`](RN04-llm-failure-handling.md)).

---

## ⛓️ Provider Priority Chain

Requests to generate gift card message suggestions follow a strict priority sequence:

```
[Request] 
   │
   ▼
1. Primary Provider: Google Gemini (gemini-1.5-flash-lite)
   │ (Timeout > 3000ms / Quota 429 / Error)
   ▼
2. First Fallback: Anthropic Claude (claude-3-opus-20240229 / claude-3-5-sonnet)
   │ (Timeout > 3000ms / Quota 429 / Error)
   ▼
3. Second Fallback: OpenAI (gpt-4o-mini)
   │ (Timeout > 3000ms / Quota 429 / Error)
   ▼
4. Ultimate Failure: Return HTTP 503 Service Unavailable (RN04)
```

---

## ⚙️ Timeout & Configuration Rules

1. **Per-Provider Timeout**: Each provider call is bounded by a **3000 ms** (3 seconds) execution window.
2. **Optional API Keys**:
   - `GEMINI_API_KEY` (Google Gemini)
   - `CLAUDE_API_KEY` (Anthropic Claude)
   - `OPENAI_API_KEY` (OpenAI)
   - If an API key is missing or unconfigured in `.env`, the backend silently skips that provider in the chain.
3. **Dynamic Response Identification**:
   - The 200 OK HTTP response payload includes a `provider` string identifying the specific LLM model that generated the suggestions (e.g., `"gemini-1.5-flash-lite"`, `"claude-3-opus"`, `"gpt-4o-mini"`).

---

## 📊 Error Propagation Rules

- An individual provider failure (timeout, network error, malformed output, or HTTP 429/5xx) is logged as a warning (`WARN`) and automatically triggers the next provider in the priority chain.
- If **all** configured providers fail or if no valid API keys are available, `LlmService` throws `ServiceUnavailableException` resulting in HTTP 503 (`LLM_SERVICE_UNAVAILABLE`).
