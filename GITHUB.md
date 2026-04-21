# Emerge GitHub Workflow & Standards 🧬

This document outlines the engineering standards and GitHub collaboration workflow for the **Emerge** project. Adhering to these practices ensures codebase stability, clear history, and high-performance delivery.

---

## 1. Branching Strategy

We use a modified **GitHub Flow** with descriptive branch prefixes.

- **`main`**: The source of truth. Must always be deployable and stable.
- **`feat/*`**: New features or significant UI changes.
- **`fix/*`**: Bug fixes and hotfixes.
- **`docs/*`**: Documentation updates (README, API docs).
- **`refactor/*`**: Code restructuring without functional changes.
- **`perf/*`**: Performance optimizations.

### Workflow:
1.  **Pull** latest `main`.
2.  **Create** a branch: `git checkout -b feat/ai-shadow-memory`.
3.  **Work** and commit locally.
4.  **Push** to origin and **Open a Pull Request**.

---

## 2. Commit Message Standards

We use **Conventional Commits** to keep our history scannable and automate changelog generation.

**Format**: `<type>(<scope>): <description>`

- **feat**: A new feature (e.g., `feat(editor): add cursor tracking flag`)
- **fix**: A bug fix (e.g., `fix(auth): resolve JWT expiration loop`)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests

---

## 3. Pull Request Policy

1.  **Atomic PRs**: Keep PRs focused on a single logical change.
2.  **Context**: Provide a clear description, screenshots for UI changes, and links to relevant tasks.
3.  **CI/CD**: All status checks (linting, tests) must pass.
4.  **Review**: At least one peer review is required for `feat/` and `fix/` branches.
5.  **Squash & Merge**: We prefer squash merges to keep the `main` history clean and linear.

---

## 4. Code Quality Toolkit

Before pushing, please run the following audit scripts:

```bash
# Frontend
npm run lint    # Check for style violations
npm run type-check # If applicable, run TSC
npm run test    # Execute unit tests

# Backend
npm run lint
npm test
```

---

## 5. Security & Secrets

- **Never** commit `.env` files.
- Use `git-crypt` or environment variables in CI/CD.
- If a secret is accidentally committed, rotate it immediately and use `bfg-repo-cleaner` to purge history.

---
*For questions regarding this workflow, contact the Lead Architect.*
