# Spec RN03: User Cache Lifecycle (1 Week)

- **Rule Code**: RN03
- **Affected Modules**: `application/lib/core/storage`, `application/lib/features/guest_user`
- **Status**: Approved

---

## 🎯 Objective
Ensure user privacy and manage temporary data lifecycles by retaining local anonymous `GuestUser` profiles for a maximum of 1 week (7 consecutive days).

---

## 📋 Functional Requirements

1. **Temporary Persistence**:
   - When creating a `GuestUser`, the app records a creation timestamp in milliseconds (`created_at`).
   - Language preferences and local recent history remain tied to this temporary profile.

2. **Expiration Rule (7 Days)**:
   - On every app startup, the client calculates:  
     `elapsed_time = current_timestamp - created_at`
   - If `elapsed_time > 7 days` (604,800,000 ms):
     - Previous session data is purged from local storage.
     - A new `guest_id` UUID v4 is generated.
     - The session resets as a fresh anonymous user.

3. **Privacy Guarantee**:
   - Prevents indefinite accumulation of data traces on shared or older devices.

---

## 🧪 Acceptance Criteria and Verification

- [ ] If the session is under 7 days old, the existing `guest_id` remains intact.
- [ ] If the session is 7+ days old, the old `guest_id` is removed and a new one is created.
- [ ] Session reset occurs smoothly without UI freezes or state corruption.
