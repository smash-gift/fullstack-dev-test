---
name: flutter-reusable-ui-components
description: Guidelines for creating non-hardcoded, reusable Flutter UI components in lib/core/ui with full ARB string internationalization. Use when creating or refactoring UI components to ensure architectural consistency.
---

# Reusable Flutter UI Components & Localization Guidelines

This skill enforces best practices for building reusable frontend components and avoiding hardcoded content in Flutter applications.

## Key Principles

1. **Shared Widget Directory**:
   - All generic, multi-screen, or atomic UI components MUST be created/reused in `application/lib/core/ui/` (e.g. `shared_widgets.dart` or component files in `lib/core/ui/`).
   - Feature screens in `lib/features/` should compose these shared components rather than re-declaring raw buttons, text fields, cards, or dialogs.

2. **No Hardcoded UI Data**:
   - Component titles, labels, placeholders, options, and icons should be passed via parameters, view models, or theme configurations.
   - Do NOT embed static business constants or magic strings directly inside widget `build` methods.

3. **Mandatory ARB Internationalization**:
   - ALL user-facing strings MUST be extracted into `.arb` translation files in `application/lib/l10n/` (e.g. `app_en.arb`, `app_pt.arb`, `app_es.arb`).
   - Access strings strictly via `AppLocalizations.of(context)!` or context helper extensions.

4. **Component Isolation**:
   - Shared widgets in `lib/core/ui` must not depend directly on feature-specific state/viewmodels.
   - Use callbacks (`VoidCallback`, `ValueChanged<T>`) for event handling.
