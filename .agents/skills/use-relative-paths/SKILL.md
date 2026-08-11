---
name: use-relative-paths
description: Enforce using relative file paths instead of absolute local file:/// URLs in markdown documentation, links, and agent instructions.
---

# Use Relative Paths Skill

This skill instructs all AI agents to use **exclusively relative paths** in Markdown documentation, `/docs` specifications, instruction files, and READMEs across the repository.

---

## 🛑 Absolute Local Path Prohibition

NEVER insert local absolute URI schemes or platform-specific root paths such as:
- **Windows absolute paths**:
  - `file:///c:/Users/username/OneDrive/Documentos/...`
  - `c:\Users\username\...`
  - `C:\Projects\...`
- **Unix-like absolute paths (Linux / macOS)**:
  - `/home/user/projects/...`
  - `/Users/username/projects/...`
  - `file:///home/user/workspace/...`
  - `file:///Users/username/workspace/...`
  - `/tmp/...` or `/var/tmp/...`

---

## ✅ Relative Path Standard

Always use relative paths relative to the project root or the directory of the Markdown file itself:

### Examples:

- **For files in the same directory or subdirectories**:
  - `[RN01](specs/RN01-internationalization.md)` (from `docs/README.md`)
  - `[API Spec](./API-contract-spec.md)` (from `docs/specs/`)

- **For navigation referencing the project root**:
  - `[Backend NestJS](server/)`
  - `[Frontend Flutter](application/)`
  - `[SDD Specs](docs/README.md)`
  - `[Project Guidelines](AGENTS.md)`

---

## 🔍 Validation Before Committing

Before finalizing edits to Markdown files, run a search to verify compliance:

```bash
git grep "file:///c:"
```

If any results are returned, replace the absolute link with the appropriate relative path equivalent.
