# Gift Card Message Suggester

This project suggests short gift card messages using an LLM.

The Flutter app is cross-platform, but this submission was tested primarily on Chrome for simplicity during local evaluation.

## Tech stack
- Node.js
- TypeScript
- Flutter
- OpenAI

## Architecture

Flutter App
   -> Node.js API
      -> LLM Provider (OpenAI)
      -> Fallback messages when LLM fails

## API Contract

#### Endpoint

 - ```POST /api/v1/suggestions```

Request body:

```json
{
  "occasion": "birthday",
  "relationship": "friend"
}
```

Success response:

```json
{
  "suggestions": [
    "Happy birthday! Wishing you a wonderful day.",
    "Hope your birthday is full of joy and special moments.",
    "Wishing you happiness and lots of great memories today."
  ],
  "source": "llm"
}
```
Fallback response:

```json
{
  "suggestions": [
    "Happy birthday! Wishing you a wonderful day.",
    "Hope your birthday is full of joy and special moments.",
    "Wishing you happiness and lots of great memories today."
  ],
  "source": "fallback"
}
```

Validation error:

```json
{
    "message": "Invalid request data",
    "errors": {
        "formErrors": [],
        "fieldErrors": {
            "occasion": [
                "Too small: expected string to have >=2 characters"
            ],
            "relationship": [
                "Too small: expected string to have >=2 characters"
            ]
        }
    }
}
```

-------------------------------------------------------

## LLM Choice

I used OpenAI with a lightweight model to keep the solution simple, fast, and cost-conscious.

Example model:

- gpt-4o-mini

I chose a single provider and a single model to reduce complexity and keep latency/cost reasonable for this test.

-------------------------------------------------------

## Prompt Design

The backend sends a prompt asking the model to generate:

- exactly 3 gift card messages
- short messages
- 1–2 sentences each
- warm and friendly tone
- no emojis
- JSON array output only

This helps keep the output consistent and easier to parse.

-------------------------------------------------------

## Error Handling and Fallback

The backend does not expose raw LLM errors to the client.

What is considered an LLM failure

Examples:

- timeout
- rate limit / 429
- 5xx provider errors
- empty response
- invalid JSON from the model
- unexpected output format

-------------------------------------------------------

## Backend behavior on failure

Instead of returning the raw provider error, the backend returns predefined safe suggestions.

Example:

```json
{
  "suggestions": [
    "Wishing you a wonderful day.",
    "Hope this special moment brings you happiness.",
    "Sending warm wishes to you."
  ],
  "source": "fallback"
}
```

-------------------------------------------------------
# How to execute the project
-------------------------------------------------------

## Backend Setup

**Requirements:**

- Node.js 20+

**Environment variables**

- Create a .env file inside backend/:

```enviroment
  OPENAI_API_KEY=your_openai_api_key
  PORT=3000
```

- or copy from file ```.env.example```

**Install dependencies**

```bash
  cd backend
  npm install
```

 Run the backend

```bash
  npm run dev
```

The server should start on:
```enviroment
http://localhost:3000
```

-------------------------------------------------------

## Flutter Setup

Requirements

- Flutter 3.38+
- Dart 3.x

Install dependencies

```bash
cd flutter_app
flutter pub get
```

Run the app

```bash
flutter run
```

Backend URL in Flutter

The Flutter app calls the backend directly, so the base URL must match the platform being used.

- **_Android emulator:_**

Use:
```bash
http://10.0.2.2:3000
```

- **_Web:_**

Use:
```bash
http://localhost:3000
```

In this project, the URL is configured directly in the Flutter app source for simplicity.

-------------------------------------------------------

## Main User Flow

A working example:

- Occasion: birthday
- Relationship: friend

#### Flow:

1. User types the values in the Flutter screen
2. User taps Get suggestions
3. App shows loading state
4. Suggestions are displayed in a list
5. If backend/LLM fails, fallback messages are shown instead

#### UI Behavior

The Flutter app handles:

- loading state: shows a progress indicator while waiting
- success state: shows returned suggestions
- error state: shows a friendly message when the request cannot be completed

This ensures the user always gets feedback.

-------------------------------------------------------

## Trade-offs and Decisions

**What I prioritized:**

- simple architecture
- working end-to-end flow
- safe fallback behavior
- readable code
- clear setup instructions

-------------------------------------------------------

## Testing

Only one test was included in the application's backend.

To run the test, follow the instructions:

```bash
cd backend
npm run test
```
-------------------------------------------------------

# How I Used AI Assistance

I used AI assistance for:

- brainstorming the project structure
- reviewing wording and documentation
- refining and translation of the README

The implementation decisions, code organization, fallback approach, and overall project structure were chosen and adjusted by me.

-------------------------------------------------------

## Possible Improvements

If I had more time, I would add:

- configurable environment handling in Flutter
- rate limiting
- caching

-------------------------------------------------------

## Final Notes

This project was designed to meet the requested requirements with a simple and maintainable approach:

Flutter app for user input and display
Node.js/TypeScript backend
LLM integration
safe fallback path when the LLM fails
clear local setup instructions

The focus of this submission is reliability, readability, and a working end-to-end experience.
