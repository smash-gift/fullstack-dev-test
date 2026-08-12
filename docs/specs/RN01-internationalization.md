# Spec RN01: Internationalization (i18n)

- **Rule Code**: RN01
- **Affected Modules**: `application/lib/core/i18n`, `server/src/modules/suggester`
- **Status**: Approved

---

## 🎯 Objective
Allow users to interact with the application interface and receive message suggestions in **Portuguese (`pt-BR`)** or **English (`en-US`)**, providing a clean, intuitive language selector on the Flutter frontend.

---

## 📋 Functional Requirements

1. **Language Selector in Frontend**:
   - The Flutter UI must display a language selection button/dropdown visible in the top bar (AppBar).
   - Supported languages: `pt-BR` (Portuguese - Brazil) and `en-US` (English - US).
   - Language switching immediately updates UI texts (labels, buttons, placeholders, state messages).

2. **Backend Propagation**:
   - When requesting suggestions, the selected language is sent in the request body (`"language": "pt-BR"`) or via HTTP header `Accept-Language: pt-BR`.

3. **LLM Generation in Target Language**:
   - Prompts sent to the LLM explicitly instruct the model to answer strictly in the configured target language.

---

## 🧪 Acceptance Criteria and Verification

- [ ] Given the user selects `English`, the UI must update all visible text to English.
- [ ] Given the user requests messages in `English`, returned LLM suggestions must be in English.
- [ ] Given the API enters fallback mode, static fallback suggestions must be served in the selected language.
