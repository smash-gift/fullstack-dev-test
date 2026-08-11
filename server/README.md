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
- **LLM Provider**: `@google/genai` or `openai`
- **Data Validation**: `class-validator` and `class-transformer`
- **Resilience and Cache**: In-Memory LRU Cache (`@nestjs/cache-manager`)
- **Rate Limiting**: `@nestjs/throttler`
- **Containerization**: Docker / Docker Compose

```
server/
├── src/
│   ├── modules/
│   │   ├── suggester/        # Controller, Service, and DTOs for message generation
│   │   ├── llm/              # Adaptable provider (Gemini / OpenAI)
│   │   └── cache/            # Cache module for LLM cost savings
│   ├── common/
│   │   ├── filters/          # Exception Filters for graceful degradation
│   │   └── middleware/       # Middlewares (rate limiting, logging, guest tracking)
│   ├── app.module.ts
│   └── main.ts
├── test/                     # Unit and e2e tests (fallback path, dto validation)
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📡 API Contract

### `POST /api/v1/suggestions`

Requests message suggestions based on occasion and relationship.

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

#### **Response (200 OK — Fallback Mode / Graceful Degradation)**
In case of LLM provider API unavailability (timeout, 429 rate limit, 5xx errors), the API does not expose raw errors and returns pre-validated fallback suggestions:
```json
{
  "status": "fallback",
  "data": {
    "suggestions": [
      "Wishing you a wonderful day filled with joy!",
      "May this special day be celebrated with love and happiness!"
    ],
    "cached": false,
    "provider": "fallback-engine"
  }
}
```

---

## 🛡️ Error Handling and Fallbacks

### What is considered an LLM failure?
1. **Timeout**: Requests to the LLM provider exceeding 4000ms.
2. **Provider Rate Limit (HTTP 429)**: Exceeding request quotas per minute on the provider API.
3. **External Server Errors (HTTP 5xx)**: Failures on OpenAI/Google servers.
4. **Malformed Output**: Model returning invalid or empty responses.

### Fallback Behavior
When a failure occurs:
- The internal error is logged for monitoring using NestJS `Logger`.
- The client **never** receives an HTTP 500 status or exposed stack trace.
- A repository of static, high-quality fallback messages filtered by occasion is returned immediately to the user.

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
