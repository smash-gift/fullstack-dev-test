# Spec RN02: GuestUser Profile (Anonymous)

- **Rule Code**: RN02
- **Affected Modules**: `application/lib/features/guest_user`, `server/src/common/middleware`
- **Status**: Approved

---

## 🎯 Objective
Enable navigation and full usage of the gift card message suggester without requiring mandatory sign-up, password authentication, or OAuth login.

---

## 📋 Functional Requirements

1. **Anonymous Identifier Generation**:
   - On initial application startup, a `guest_id` in UUID v4 format is generated and stored on the device (`SharedPreferences`).
   - **Flutter Web Note**: On `Flutter Web`, `SharedPreferences` automatically maps to `window.localStorage` in the browser, providing cross-platform persistence across mobile and web.
   - No personal information (email, name, phone) is requested or collected.

2. **Guest Session Tracking**:
   - All HTTP requests sent to the backend include the header `X-Guest-ID: <uuid-v4>`.
   - The backend uses `X-Guest-ID` for rate limiting and recent query caching.

3. **Profile Transition**:
   - The `GuestUser` profile is designed to support seamless future migration if users decide to save cards to a registered account.

---

## 🧪 Acceptance Criteria and Verification

- [ ] On first app launch, a valid `guest_id` must be generated locally.
- [ ] HTTP requests to backend API must include the `X-Guest-ID` header.
- [ ] Users can use 100% of suggestion features without hitting login screens.
