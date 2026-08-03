# AI-Powered Gift Card Message Suggester

Senior Full Stack Developer technical test — an LLM-powered service that suggests personalized gift card messages based on occasion and relationship.


## Architecture

```
fullstack-dev-test/
├── backend/          # Node.js + TypeScript API (Express)
├── flutter_app/      # Flutter app (Dart)
├── assets/
└── README.md
```

### Backend Architecture

```
backend/src/
├── index.ts                        # Entry point — starts the Express server
├── app.ts                          # Express app setup (middlewares, routes, error handlers)
├── routes/
│   └── suggestions.routes.ts       # POST / — delegates to controller
├── controllers/
│   └── suggestions.controller.ts   # Validates input → checks cache → calls LLM → returns fallback on error
├── services/
│   ├── llm.service.ts              # Provider router (Gemini/OpenAI) + prompt dispatch + response parsing
│   └── fallback.service.ts         # Static fallback messages by occasion (8 categories + generic)
├── middleware/
│   └── rateLimiter.ts              # express-rate-limit — 10 req/min per IP
├── schemas/
│   └── suggestion.schema.ts        # Zod validation for occasion + relationship
├── utils/
│   ├── prompt.ts                   # Builds the LLM prompt with occasion + relationship
│   └── cache.ts                    # In-memory cache with TTL (1h)
└── types/
    └── index.ts                    # Shared TypeScript types
```

### Flutter App Architecture

The Flutter app follows a **layered separation** of UI, API client, and state management:

```
flutter_app/lib/
├── main.dart                           # Entry point — MaterialApp + ChangeNotifierProvider
├── config/
│   └── app_config.dart                 # BASE_URL via --dart-define (default: localhost:3000)
├── models/
│   └── suggestion_result.dart          # SuggestionResult model + SuggestionSource enum
├── services/
│   └── suggestion_service.dart         # HTTP client — POST /api/suggestions, error mapping
├── providers/
│   └── suggestion_provider.dart        # ChangeNotifier — manages UI state (idle/loading/success/error)
└── screens/
    └── home_screen.dart                # Main screen — form inputs, result display, all UI states
```

**Layer responsibilities:**

| Layer | File | Responsibility |
|---|---|---|
| **Config** | `app_config.dart` | Reads `BASE_URL` from `--dart-define`; provides `suggestionsEndpoint` |
| **Model** | `suggestion_result.dart` | `SuggestionResult` data class with `fromJson`; `SuggestionSource` enum (`llm`, `cache`, `fallback`) |
| **Service** | `suggestion_service.dart` | HTTP client with injectable `http.Client`; maps HTTP errors to `ApiException` (400, 429, 5xx, network) |
| **Provider** | `suggestion_provider.dart` | `ChangeNotifier` with `SuggestionState` enum (idle, loading, success, error); exposes `submit()` and `reset()` |
| **Screen** | `home_screen.dart` | Consumes provider via `context.watch`/`context.read`; renders form, loading indicator, error banner, and suggestion cards |

**State management:** `Provider` package with `ChangeNotifier` — lightweight, built into the Flutter ecosystem, no extra boilerplate. The screen reacts to state changes via `context.watch<SuggestionProvider>()`.

**Configurable base URL:** The backend URL is set via `--dart-define=BASE_URL=...` at compile time, read in `app_config.dart` with `String.fromEnvironment`. This avoids runtime configuration files and keeps the URL out of source code.


### Request Flow

```
Flutter App
    │
    ▼
POST /api/suggestions { occasion, relationship }
    │
    ▼
[Rate Limiter] ─── 429 if exceeded ──→ { error: "Rate limit exceeded" }
    │
    ▼
[Controller] ── validates with Zod ──→ 400 if invalid
    │
    ▼
[Cache lookup] ─── HIT ──→ { suggestions, source: "cache" }
    │ MISS
    ▼
[LLM Service] ── AI_PROVIDER env ──→ Gemini API or OpenAI API
    │
    ├─ SUCCESS → parse 3 messages → save to cache → { suggestions, source: "llm" }
    │
    └─ FAILURE (timeout, 429, 5xx, invalid response)
            │
            ▼
        [Fallback Service] → static messages by occasion → { suggestions, source: "fallback" }
```

### LLM Integration

The backend supports **two LLM providers** selectable via the `AI_PROVIDER` environment variable:

| Provider | Model | API | Cost |
|---|---|---|---|
| `gemini` | `gemini-2.5-flash` | Google Generative Language API | Free tier with limits |
| `openai` | `gpt-4o-mini` | OpenAI Chat Completions API | Paid |

---

## How to Run

### Prerequisites

- Node.js v20+
- An LLM API key (Gemini or OpenAI — you choose)

### Backend

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your provider and API key:

   ```env
   AI_PROVIDER=gemini              # "gemini" or "openai"
   GEMINI_API_KEY=your_key_here    # if using Gemini — get at https://aistudio.google.com/app/apikey
   OPENAI_API_KEY=your_key_here    # if using OpenAI — get at https://platform.openai.com/api-keys
   PORT=3000
   ```

3. **Run in development mode:**

   ```bash
   npm run dev
   ```

   Server starts at `http://localhost:3000`.

4. **Run tests:**

   ```bash
   npm test
   ```

### Flutter App

**Prerequisites:** Flutter 3.38+ with Dart 3.x (`flutter --version` to check).

1. **Install dependencies:**

   ```bash
   cd flutter_app
   flutter pub get
   ```

2. **Run the app:**

   ```bash
   # Web, desktop, or iOS simulator (default — uses localhost:3000)
   flutter run

   # Android emulator (10.0.2.2 maps to host's localhost)
   flutter run --dart-define=BASE_URL=http://10.0.2.2:3000
   ```

3. **Run tests:**

   ```bash
   flutter test
   ```

---

## API Documentation

### `POST /api/suggestions`

Generates 2–3 personalized gift card message suggestions.

**Request:**

```json
{
  "occasion": "birthday",
  "relationship": "friend"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `occasion` | string | yes | 1–50 characters |
| `relationship` | string | yes | 1–50 characters |

**Response 200:**

```json
{
  "suggestions": [
    "Wishing you a wonderful birthday filled with joy and everything you love!",
    "Hope your special day is as amazing as you are. Happy birthday!",
    "Sending warm birthday wishes and lots of love your way today!"
  ],
  "source": "llm"
}
```

The `source` field indicates where the suggestions came from:

| Source | Meaning |
|---|---|
| `"llm"` | Generated by the LLM provider |
| `"cache"` | Returned from in-memory cache (same occasion + relationship within TTL) |
| `"fallback"` | Static fallback messages (LLM was unavailable or failed) |

**Response 400 — Invalid input:**

```json
{
  "error": "Invalid input",
  "details": [
    { "field": "occasion", "message": "occasion is required" }
  ]
}
```

**Response 429 — Rate limit exceeded:**

```json
{
  "error": "Rate limit exceeded. Try again later."
}
```

### `GET /health`

Health check endpoint.

```json
{ "status": "ok", "provider": "gemini" }
```

---

## Decisions and Trade-offs

### Error Handling and Fallback

**What counts as a failure:**
- LLM API timeout (10s via `AbortController`)
- HTTP 429 (rate limit from provider)
- HTTP 5xx (provider server error)
- Missing or invalid API key
- Empty or unparseable LLM response

**How the client is notified:**
- The client **never** receives raw error details from the LLM provider
- On any LLM failure, the backend returns HTTP 200 with `source: "fallback"` and static messages
- The error is logged server-side with `console.error` for debugging
- The `source` field lets the frontend optionally inform the user that fallback messages were used


### Rate Limiting

- **Limit:** 10 requests per minute per IP address
- **Implementation:** `express-rate-limit` with in-memory store
- **Behavior when exceeded:** HTTP 429 with JSON error message; the LLM is never called
- **Test environment:** Rate limiter is automatically skipped when `NODE_ENV=test`
- **Production note:** In production, use a Redis store instead of in-memory to share state across instances

### Cost and Caching

- **Caching implemented:** Yes — an in-memory `Map` with a 1-hour TTL, keyed by `occasion:relationship` (case-insensitive). When a request matches a cached entry, the LLM is not called and the response is returned immediately with `source: "cache"`. The same occasion + relationship combination produces similar suggestions. Caching avoids redundant LLM calls, reducing both cost and latency. For a gift card suggester, message variety within a 1-hour window is acceptable.
- **Model selection** — both `gemini-2.5-flash` and `gpt-4o-mini` are chosen for their low cost and fast response
- **Token limit** — `maxOutputTokens` is set to 512, enough for 3 short messages while keeping per-call cost minimal
- **Redis:** Redis was not used because the project runs as a single instance and an in-memory `Map` provides the same caching behavior with zero infrastructure overhead. Redis would be necessary only in a multi-instance deployment where cache state needs to be shared across servers.

### Firebase

Firebase was **not used** in this project. The requirements don't demand user authentication or data persistence — the API is stateless and public. Adding Firebase would introduce unnecessary complexity for the current scope.

### Multi-Provider LLM

The backend supports both Gemini and OpenAI via a single `AI_PROVIDER` env variable. This allows switching providers without code changes — useful when one provider has downtime or rate limits. The practical advantage is that if one AI starts returning errors or inconsistent responses, simply changing the environment variable and redeploying the backend fixes the issue, with no code changes required.



---

## AI Assistant Usage

An AI assistant (Cascade/Windsurf) was used during development:

- **Code generation:** The assistant wrote the initial backend scaffold, services, controllers, tests, Flutter app structure, and configuration files
- **Design decisions:** Provider selection (dual Gemini + OpenAI), fallback strategy (static messages by occasion), cache strategy (in-memory with TTL), rate limiting parameters, and the decision to skip Firebase were decided independently

---

## Tests

### Backend Tests (19 tests, all passing)

**`tests/suggestions.controller.test.ts`** — 10 tests:
- Happy path: LLM returns suggestions → `source: "llm"`
- Fallback path: LLM throws error → `source: "fallback"` with HTTP 200
- Security: LLM error details are not exposed in the response
- Fallback for unknown occasion when LLM fails
- Cache hit: second identical request returns cached result without calling LLM
- Cache case-insensitivity
- Input validation: missing occasion, missing relationship, empty strings, empty body

**`tests/llm.service.test.ts`** — 9 tests:
- Provider routing: unsupported provider throws
- Missing API keys for both Gemini and OpenAI
- HTTP 429 and 5xx error handling for both providers
- Timeout/abort behavior for both providers (10s via `AbortController`)

### Flutter Tests (11 tests, all passing)

**`test/widget_test.dart`** — 5 widget tests:
- Renders input fields (occasion, relationship) and submit button
- Shows validation errors when submitting empty fields
- Shows idle hint on initial state
- Shows loading indicator when state is loading
- Shows error message when state is error

**`test/suggestion_service_test.dart`** — 6 unit tests:
- Returns `SuggestionResult` on 200 response with correct `source` mapping
- Maps `source: "cache"` and `source: "fallback"` correctly
- Throws `ApiException` with 429 message on rate limit
- Throws `ApiException` on 400 with validation detail
- Throws `ApiException` on 500 server error