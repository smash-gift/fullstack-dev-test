# Frontend Application — AI Gift Card Suggester (Flutter)

**Flutter** cross-platform application developed to suggest personalized gift card messages by connecting to the NestJS backend API.

---

## 📌 Architectural Overview

The application follows the **Official Flutter App Architecture Guidelines** recommended by Google ([docs.flutter.dev/app-architecture/guide](https://docs.flutter.dev/app-architecture/guide)), utilizing:

- **MVVM (Model-View-ViewModel)** for state management and presentation logic separation.
- **Command Pattern (`Command0`, `Command1`)** encapsulating asynchronous operations and reactive UI state updates.
- **Functional Result Pattern (`Result<T>`)** for safe compile-time error handling (`Ok<T>` / `Error<E>`) across Data and Domain layers.
- **Feature-First Layered Directory Structure** organizing feature modules under `lib/features/<feature_name>/` (`view_models/` and `widgets/`), shared UI components in `lib/ui/core/`, and global business logic in `domain/` and `data/`.

Detailed technical documentation and sequence diagrams can be found in [`docs/architecture/frontend-architecture.md`](../docs/architecture/frontend-architecture.md).

---

## 🏗️ Project Layout

```
application/
├── lib/
│   ├── features/                     # Feature modules (e.g., suggester, guest_session)
│   │   └── <feature_name>/
│   │       ├── view_models/          # Feature ViewModels with Command0 / Command1
│   │       │   └── <view_model_class>.dart
│   │       └── widgets/              # Feature screens and feature-specific widgets
│   │           ├── <feature_name>_screen.dart
│   │           └── <other_widgets>.dart
│   ├── ui/
│   │   └── core/                     # Shared UI components & design system themes
│   │       ├── ui/                   # Shared UI widgets across features
│   │       │   └── <shared_widgets>.dart
│   │       └── themes/               # App themes, colors, gradients, typography
│   ├── domain/                       # Pure business entities & contracts
│   │   └── models/
│   │       └── <model_name>.dart
│   ├── data/                         # Data layer implementation
│   │   ├── repositories/             # Repository interfaces & concrete implementations
│   │   │   └── <repository_class>.dart
│   │   ├── services/                 # External services (ApiClient, LocalStorageService)
│   │   │   └── <service_class>.dart
│   │   └── model/                    # Data Transfer Objects (DTOs) with JSON serialization
│   │       └── <api_model_class>.dart
│   ├── config/                       # Application configuration & environment settings
│   ├── utils/                        # Architectural utilities (result.dart, command.dart)
│   ├── routing/                      # App navigation & route declarations
│   ├── main_staging.dart             # Staging environment entrypoint
│   ├── main_development.dart         # Development environment entrypoint
│   └── main.dart                     # Production environment entrypoint
├── test/                             # Unit & Widget tests mirroring lib/ structure
│   ├── data/
│   ├── domain/
│   ├── ui/
│   └── utils/
└── testing/                          # Test utilities & mock objects
    ├── fakes/                        # In-memory fakes for repositories & services
    └── models/                       # Test fixture factories and domain mocks
```

---

## 📋 Implemented Business Rules

### 🌐 RN01 — Internationalization (`i18n`)
- Native support for **Portuguese (`pt-BR`)** and **English (`en-US`)**.
- Changing language dynamically updates UI strings and sends `Accept-Language` headers and request payload languages to the backend API.
- Documented at [`docs/specs/RN01-internationalization.md`](../docs/specs/RN01-internationalization.md).

### 👤 RN02 — Guest User Profile (`GuestUser`)
- Accessible without requiring mandatory sign-up or login.
- Automatic generation of a unique anonymous guest identifier (`guest_id` UUID v4).
- Injected automatically into the `X-Guest-ID` HTTP header for backend API requests.
- Documented at [`docs/specs/RN02-guest-user.md`](../docs/specs/RN02-guest-user.md).

### ⏱️ RN03 — 1-Week User Cache Lifecycle
- Session data (`guest_id`, preferences, history) is cached in persistent local storage (`SharedPreferences`).
- **Cache Validity**: 7 days (168 hours). Expired cache triggers automatic re-initialization of an anonymous session.
- Documented at [`docs/specs/RN03-cache-expiration.md`](../docs/specs/RN03-cache-expiration.md).

### 🛡️ RN04 — Resiliency & User Feedback States
- Explicit feedback states for **Loading** (`command.running`), **Success** (`command.result is Ok`), and **Error/Fallback** (`command.result is Error`).
- Graceful UI feedback when backend LLM fails or returns fallback responses.
- Documented at [`docs/specs/RN04-llm-failure-handling.md`](../docs/specs/RN04-llm-failure-handling.md).

---

## ⚙️ Running the Application

### 1. Install Dependencies
```bash
cd application
flutter pub get
```

### 2. Run Application by Environment

#### Development
```bash
flutter run -t lib/main_development.dart --dart-define=API_BASE_URL=http://localhost:3000
```

#### Staging
```bash
flutter run -t lib/main_staging.dart --dart-define=API_BASE_URL=https://staging-api.dqrtech.com
```

#### Production
```bash
flutter run -t lib/main.dart --dart-define=API_BASE_URL=https://api.dqrtech.com
```

### 3. Run Automated Verification Tests
```bash
flutter test
flutter analyze
```
