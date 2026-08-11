# Frontend Application — AI Gift Card Suggester (Flutter)

**Flutter** cross-platform application developed to suggest personalized gift card messages by connecting to the NestJS backend API.

---

## 📌 Overview and Features

The application provides a sleek and intuitive interface allowing users to choose or type an **occasion** and **relationship**, select the **preferred language**, request AI-generated suggestions, and view results with clear feedback for loading, success, or fallback states.

---

## 🚀 Prerequisites

- **Flutter SDK**: `v3.38.x` or higher
- **Dart SDK**: `v3.x`
- **Web Browser** (Chrome/Edge) or **Android / iOS** Emulator

---

## 🏗️ Architecture and Project Layout

The project follows a clean, feature-first layered architecture:

```
application/
├── lib/
│   ├── core/
│   │   ├── config/           # Global configuration and environment base URLs
│   │   ├── i18n/             # Internationalization (pt-BR and en-US)
│   │   ├── network/          # HTTP Client / Interceptors (Guest ID, Headers)
│   │   └── storage/          # Local Storage / SharedPreferences (RN03)
│   ├── features/
│   │   ├── guest_user/       # Anonymous Session Management (RN02/RN03)
│   │   └── suggester/        # Main screen, Cubit controllers, Repository, DTOs
│   ├── main.dart
│   └── app.dart
├── test/                     # Widget tests and Unit tests
├── pubspec.yaml
└── README.md
```

---

## 📋 Implemented Business Rules

### 🌐 RN01 — Internationalization (i18n)
- Native support for **Portuguese (`pt-BR`)** and **English (`en-US`)**.
- Language selector button accessible on the top app bar (AppBar).
- Changing language dynamically updates UI strings and sends `Accept-Language` headers and request payload languages to the backend.

### 👤 RN02 — Guest User Profile (GuestUser)
- Accessible without requiring mandatory sign-up or login.
- Automatic generation of a unique anonymous guest identifier (`guest_id` UUID v4).
- Compatible with mobile devices and **Flutter Web** (`window.localStorage` fallback via `SharedPreferences`).
- Formally documented in the SDD specification at [`docs/specs/RN02-guest-user.md`](../docs/specs/RN02-guest-user.md).

### ⏱️ RN03 — 1-Week User Cache Lifecycle
- `GuestUser` data (ID, language preferences, local history timestamp) is stored in persistent local storage (`SharedPreferences`).
- **Cache Validity**: 7 days (1 week).
- If the user opens the application 7+ days after session creation, local cache is invalidated and a fresh anonymous `GuestUser` profile is automatically initialized.

---

## ⚙️ Running the Application

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Configure Backend API URL
By default, the app connects to `http://localhost:3000`. To override the base URL via `--dart-define`:

```bash
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

For Android Emulator (using `10.0.2.2` to access host machine localhost):
```bash
flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

### 3. Run Automated Tests
```bash
flutter test
```
