# Backend Service — AI Gift Card Message Suggester

API built with **NestJS** (Node.js / TypeScript) for generating personalized gift card message suggestions via Large Language Models (LLM - Google Gemini / OpenAI).

---

## 📌 Project Overview

The application is a high-performance RESTful API designed with resilience and low latency in mind. It accepts parameters such as **occasion** (e.g., birthday, wedding, thank you) and **relationship** (e.g., friend, colleague, parent), as well as the **desired language** (e.g., `pt-BR` or `en-US`), interacting with an LLM to return 2 to 3 short message suggestions suitable for gift cards.

---

## 🚀 Prerequisites

- **Node.js** `v20.x` or higher
- **npm** `v10.x` or **pnpm** / **yarn**
- **Docker** and **Docker Compose**
- **LLM API Key**: OpenAI API Key (`OPENAI_API_KEY`) **or** Google Gemini API Key (`GEMINI_API_KEY`).

---

## 🛠️ Stack and Architecture

- **Framework**: NestJS (TypeScript)
- **LLM Multi-Provider Fallback Chain (RN05)**:
  1. Priority 1: Google Gemini (`gemini-1.5-flash`)
  2. Priority 2: Anthropic Claude (`claude-3-opus-20240229`)
  3. Priority 3: OpenAI (`gpt-4o-mini`)
- **Data Validation**: `class-validator` and `class-transformer`
- **Resilience and Cache**: In-Memory LRU Cache (`@nestjs/cache-manager`)
- **Rate Limiting**: `@nestjs/throttler`
- **Containerization**: Docker / Docker Compose
- **Architecture Spec**: Detailed documentation available at [`../docs/architecture/backend-architecture.md`](../docs/architecture/backend-architecture.md)

```
server/
├── src/
│   ├── config/
│   │   ├── env.validation.ts       # Environment variable validation schema
│   │   └── configuration.ts        # Typed configuration factory
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Standardized HTTP error response filter
│   │   ├── guards/
│   │   │   └── rate-limit.guard.guard.ts # Custom rate limiter guard (Guest-ID/IP)
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts    # Request/Response logging interceptor
│   │   └── middleware/
│   │       └── guest-id.middleware.ts    # X-Guest-ID header validation middleware
│   ├── modules/
│   │   ├── suggester/        # Controller, Service, and DTOs for message generation
│   │   ├── llm/              # Decoupled provider strategy (Gemini integration)
│   │   └── cache/            # LRU Cache module (24h TTL)
│   ├── app.module.ts
│   └── main.ts
├── test/                     # Unit and e2e integration tests
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📡 API Contract & Swagger Documentation

Interactive OpenAPI / Swagger UI is available at:
👉 **`http://localhost:3000/api/docs`**

### `POST /api/v1/suggestions`

Requests message suggestions based on occasion and relationship.

#### **Request Headers**
- `Content-Type`: `application/json`
- `X-Guest-ID`: `<uuid-v4>` (required, per [`RN02`](../docs/specs/RN02-guest-user.md))
- `Accept-Language`: `pt-BR` | `en-US` (optional, per [`RN01`](../docs/specs/RN01-internationalization.md))

#### **Request Body**
```json
{
  "occasion": "birthday",
  "relationship": "friend",
  "language": "pt-BR"
}
```

- `occasion` (*string*, required): Festive occasion or event (e.g., `birthday`, `wedding`, `thank_you`).
- `relationship` (*string*, required): Relation between sender and recipient (e.g., `friend`, `colleague`, `mother`).
- `language` (*string*, optional, default: `pt-BR`): Target message language (`pt-BR` | `en-US`).

#### **Response (200 OK — LLM Success)**
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

#### **Response (503 Service Unavailable — LLM Failure Policy, per RN04)**
In case of LLM provider API failure (timeout > 4s, 429 rate limit, 5xx errors, or network failure), the endpoint returns a deterministic 503 error response:
```json
{
  "statusCode": 503,
  "error": "Service Unavailable",
  "message": "O serviço de sugestões de IA está temporariamente indisponível. Tente novamente em instantes.",
  "code": "LLM_SERVICE_UNAVAILABLE"
}
```

---

## 🛡️ Error Handling Policy (RN04)

### What is considered an LLM failure?
1. **Timeout**: Requests to the LLM provider exceeding 4000ms.
2. **Provider Rate Limit (HTTP 429)**: Exceeding request quotas per minute on the provider API.
3. **External Server Errors (HTTP 5xx)**: Failures on Google Gemini servers.
4. **Malformed Output**: Model returning invalid or empty responses.

### Error Response Behavior
When a failure occurs:
- The internal error details are logged via NestJS `Logger`.
- The client **never** receives an HTTP 500 status or exposed stack trace.
- An **HTTP 503 Service Unavailable** response is returned so the frontend can display a clear error state with a retry option (see [`../docs/specs/RN04-llm-failure-handling.md`](../docs/specs/RN04-llm-failure-handling.md)).

---

## ⚡ Cost, Caching, and Rate Limiting

### Cost Reduction Strategy
1. **Combination Caching (`occasion` + `relationship` + `language`)**:
   - Requests with identical parameters are cached in memory (24-hour TTL).
   - Prevents redundant LLM calls for popular query combinations such as ("birthday", "friend", "en-US").
2. **Efficient Prompting**:
   - Optimized system instructions limiting response output strictly to the requested size (1–2 sentences per suggestion).
3. **Rate Limiting**:
   - Configured limit of **10 requests per minute** per IP / Guest ID to prevent API abuse.

---

## 🐳 Running with Docker

### 1. Configure Environment Variables
Create a `.env` file in the `server/` folder:
```env
PORT=3000
NODE_ENV=production
LLM_PROVIDER=gemini # or openai
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
```

### 2. Run via Docker Compose
```bash
docker-compose up --build -d
```
The API will be available at `http://localhost:3000`.

### 3. Run Container Tests
```bash
docker exec -it gift_card_backend npm run test
```
