# Rule: ARB Internationalization

All frontend implementations in `application/` MUST strictly comply with the following internationalization rules:

1. **Mandatory ARB Internationalization**:
   - NEVER hardcode user-visible text strings inside Flutter widgets.
   - All text content must be declared in `.arb` files under `application/lib/l10n/` (e.g., `app_en.arb`, `app_pt.arb`, `app_es.arb`).
   - Use `AppLocalizations.of(context)` for all text rendering.

2. **Decoupled User-Facing Strings**:
   - Dynamic UI labels, titles, error messages, and button captions MUST pass localized keys or strings resolved via `AppLocalizations`.
