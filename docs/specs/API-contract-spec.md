# Spec API: Suggester API Protocol & Contract

- **Rule Code**: SPEC-API-01
- **Affected Modules**: `server/src/modules/suggester`, `application/lib/features/suggester/data`
- **Status**: Approved

---

## 🎯 Objective
Rigorously define the technical specification for the gift card message suggester REST endpoint and error fallback guarantees.

---

## 📡 Endpoint: `POST /api/v1/suggestions`

### Request Headers
- `Content-Type`: `application/json`
- `X-Guest-ID`: `<uuid-v4>` (required, per RN02)
- `Accept-Language`: `pt-BR` | `en-US` (optional, per RN01)

### Request Body (DTO)
```json
{
  "occasion": "birthday",
  "relationship": "friend",
  "language": "pt-BR"
}
```

### DTO Validations (NestJS `class-validator`)
- `occasion`: non-empty string, min 2 chars, max 50 chars.
- `relationship`: non-empty string, min 2 chars, max 50 chars.
- `language`: enum (`pt-BR`, `en-US`).

### Responses

#### **200 OK — LLM Success Response**
```json
{
  "status": "success",
  "data": {
    "suggestions": [
      "Wishing you a day filled with laughter and unforgettable moments! Happy Birthday!",
      "Congratulations on another wonderful year! May this new cycle bring you peace and success."
    ],
    "cached": false,
    "provider": "gemini-2.5-flash"
  }
}
```

#### **503 Service Unavailable — LLM Provider Failure (RN04)**
When the LLM API fails (timeout > 4s, 429 rate limit, 5xx external errors, or network error):
```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.",
  "code": "LLM_SERVICE_UNAVAILABLE"
}
```

#### **400 Bad Request — Validation Failure**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["occasion must be a string", "relationship should not be empty"]
}
```

#### **429 Too Many Requests — Rate Limit Exceeded**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please wait 1 minute before requesting more suggestions."
}
```

