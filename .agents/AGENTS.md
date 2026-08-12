# Directives and Guidelines for AI Agents

This document establishes the technical standards, architectural rules, and development guidelines that **all AI agents** must strictly follow when implementing tasks for the **Backend (NestJS)** and **Frontend (Flutter)** in this repository.

---

## 📌 Methodology: Spec-Driven Development (SDD) & Documentation Guidelines

1. **Consult Specifications First**:
   - Before starting any code modification or creation, consult the [`/docs`](docs/README.md) directory and read the corresponding SDD specification (`RN01`, `RN02`, `RN03`, `API-contract`).
   - No business rules should be altered or invented without prior updates to the corresponding specification in `/docs`.

2. **Mandatory Relative Paths in Documentation**:
   - **Strict Rule**: NEVER use absolute local paths containing `file:///c:/Users/...` or similar local URIs in Markdown documentation links.
   - Always use relative paths relative to the project root or current file (e.g., `docs/README.md`, `server/`, `application/`, `specs/RN01-internationalization.md`).

3. **Conventional Commits**:
   - All relevant changes must follow the **Conventional Commits** standard (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `test:`).
   - Use the project's custom skill to format commit messages properly.

---

## 💻 Guidelines for Backend (NestJS / TypeScript)

- **Location**: [`/server`](server/) directory.
- **Module Structure**: Standard NestJS modular structure (`SuggesterModule`, `LlmModule`, `CacheModule`).
- **Strict Validation**: Always use `class-validator` and `class-transformer` for all input DTOs.
- **Resilience and Mandatory Fallback**:
  - Every external call to LLM services (Gemini / OpenAI) **must** be wrapped in exception handling with a maximum timeout (4000ms).
  - Never allow raw exceptions or HTTP status 500 to reach the frontend client due to LLM failures. Use the `fallback-engine`.
- **Testing**: Write unit tests for the service layer covering the fallback execution path when the LLM throws an error.

---

## 📱 Guidelines for Frontend (Flutter / Dart)

- **Location**: [`/application`](application/) directory.
- **SDK & Requirements**: Flutter `3.38+` and Dart `3.x`.
- **Separation of Concerns**:
  - UI (Screens & Widgets) must be isolated from business logic and HTTP calls.
  - HTTP Interceptors must automatically inject the `X-Guest-ID` header (RN02) and selected language `Accept-Language` header (RN01).
- **Session Management (RN03)**:
  - Check the validity of the 7-day local session cache at every application startup before making network calls.
- **User Feedback**:
  - Ensure all screens have explicit states for: `Loading` (progress indicator), `Success` (suggestion list), and `Error/Fallback` (user-friendly message with retry option).
- **Reusable UI & Internationalization**:
  - Reusable components must be created in `lib/core/ui/` (`shared_widgets.dart` or submodules). Components must NOT hardcode business data or strings.
  - All user-facing text strings must be externalized in `.arb` files in `lib/l10n/` using `AppLocalizations`.

---

## 🔍 Verification Commands

Before finalizing any task, execute and validate:

- **Backend**:
  ```bash
  cd server && npm run test && npm run lint
  ```
- **Frontend**:
  ```bash
  cd application && flutter test && flutter analyze
  ```
