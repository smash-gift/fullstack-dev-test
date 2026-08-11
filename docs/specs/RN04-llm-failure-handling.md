# Rule Specification: RN04 — LLM Failure & Error Handling

- **Rule Code**: RN04
- **Affected Modules**: `server/src/modules/llm`, `server/src/modules/suggester`, `application/lib/features/suggester`
- **Status**: Approved
- **Parent Spec**: [`API-contract-spec.md`](API-contract-spec.md)

---

## 🎯 Business Rule Objective

The gift card message suggester service depends directly on Large Language Model (LLM) generation. If the LLM provider (Google Gemini) fails or becomes unavailable, the request must fail deterministically, allowing the client application (Flutter) to present a clear, actionable error state to the user with retry capability.

---

## 📌 Failure Conditions

The backend considers an LLM call failed when any of the following conditions occur:

1. **Execution Timeout**: Any API call to the LLM provider exceeding **4000 ms** (4 seconds).
2. **Quota / Rate Limit Exceeded**: Receiving an HTTP 429 status from the LLM provider.
3. **Upstream Server Error**: Receiving HTTP 5xx responses from the LLM provider servers.
4. **Invalid Output / Malformed Response**: Empty response or payload that does not conform to the expected format.
5. **Network Connectivity Failure**: DNS resolution failure or connection reset to the LLM provider API.

---

## ⚙️ Error Response Specification

When an LLM failure occurs, the backend **must not** return HTTP 500 or expose internal stack traces. Instead, it must return a standardized **HTTP 503 Service Unavailable** response:

### **HTTP Status Code**: `503 Service Unavailable`

### **Response Body (JSON)**:
```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.",
  "code": "LLM_SERVICE_UNAVAILABLE"
}
```

---

## 🛡️ Frontend Guarantees & Interaction (Flutter)

1. **State Isolation**: When receiving `HTTP 503` with `code: "LLM_SERVICE_UNAVAILABLE"`, the Flutter frontend transitions to the `SuggesterError` state.
2. **User Feedback**: Displays a user-friendly error message informing that AI message generation is temporarily unavailable.
3. **Retry Mechanism**: Provides a clear "Tentar Novamente" (Retry) action button to retry the request.

---

## 🔍 Observability & Logging

- Every LLM failure must be logged on the backend via NestJS `Logger` with level `WARN` or `ERROR`, including:
  - Error type (Timeout, QuotaExceeded, UpstreamError).
  - Target occasion, relationship, and language.
  - Latency in milliseconds before failure.
