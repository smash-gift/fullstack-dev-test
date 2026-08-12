---
name: git-conventional-commit
description: Guide agents to format and execute git commits following the Conventional Commits specification for all repository features and changes.
---

# Git Conventional Commit Skill

Use this skill whenever creating a git commit for code or documentation changes in the repository to ensure a clear, standardized, and semantic commit history.

---

## 📌 Format Pattern

Every commit message must follow this structure:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

---

## 🏷️ Allowed Commit Types (`<type>`)

- `feat`: A new feature or business rule implementation (e.g., `feat(suggester): add Gemini LLM provider integration`).
- `fix`: A bug fix or error handling patch (e.g., `fix(fallback): handle LLM timeout without crashing NestJS`).
- `docs`: Documentation updates (`README.md`, `/docs`, `AGENTS.md`).
- `style`: Formatting, semicolons, or whitespace changes with no code logic impact.
- `refactor`: Code refactoring that does not alter external behavior.
- `test`: Adding or updating unit, e2e, or widget tests.
- `chore`: Updates to build tasks, packages, Dockerfiles, or configuration.

---

## 🎯 Common Scopes (`<scope>`)

- `server` or `backend`: Changes to the NestJS API.
- `application` or `frontend`: Changes to the Flutter application.
- `docs`: SDD specifications in `/docs`.
- `deps`: Dependency updates (`package.json`, `pubspec.yaml`).

---

## 📝 Example Commit Workflow

1. **Check status**:
   ```bash
   git status
   ```
2. **Stage changed files**:
   ```bash
   git add .
   ```
3. **Perform formatted commit**:
   ```bash
   git commit -m "feat(server): implement NestJS LLM message suggester endpoint with fallback"
   ```
