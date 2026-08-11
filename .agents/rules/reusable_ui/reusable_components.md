# Rule: Reusable UI Components & Design System

All frontend implementations in `application/` MUST strictly comply with the following component and design system rules:

1. **Shared Components Location**:
   - Generic and reusable UI elements (buttons, card containers, inputs, feedback views, steppers, badges) MUST be placed in `application/lib/core/ui/` (e.g. `shared_widgets.dart` or module files inside `lib/core/ui/`).
   - Do NOT duplicate widget implementations across feature screens.

2. **Non-Hardcoded Components**:
   - Frontend UI components must remain decoupled from hardcoded business data, labels, options, or static assets.
   - Dynamic parameters, configuration objects, or ViewModels must supply component data.

3. **Design System Consistency**:
   - All component styling must reference central app themes defined in `lib/core/themes/` and design system tokens.
