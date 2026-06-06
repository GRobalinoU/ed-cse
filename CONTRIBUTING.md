# Contributing to ED-CSE

**[Leer en Español →](./CONTRIBUTING.es.md)**

Thank you for your interest in contributing. This document explains how to get started and what we expect from contributors.

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## Ways to Contribute

- **Bug reports** — open an issue with a minimal reproduction
- **Feature requests** — open an issue describing the use case, not just the feature
- **Code contributions** — bug fixes, new features, performance improvements
- **Documentation** — improvements to README, inline docs, or the future docs site
- **Tests** — increasing coverage, edge cases

---

## Development Setup

### Prerequisites

- Node.js `>=20.0.0`
- pnpm `>=9.0.0`

```bash
# Clone the repo
git clone https://github.com/GRobalinoU/ed-cse.git
cd ed-cse

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test:run
```

---

## Project Structure

```
packages/core/      # Core engine — this is where the important logic lives
packages/sdk-node/  # Node.js SDK (depends on core)
packages/cli/       # CLI tool
apps/docs/          # Documentation site
apps/playground/    # Interactive sandbox
```

When in doubt, start with `packages/core`.

---

## Workflow

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** — keep commits small and focused
4. **Add or update tests** — all new behavior must be tested
5. **Run checks** before pushing:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:run
   ```
6. **Open a Pull Request** against `main` with a clear description

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add policy engine for transition guards
fix: correct event timestamp precision
docs: update quick start example
chore: bump vitest to 3.x
test: add edge cases for FSM replay
refactor: extract event log to separate module
```

PRs with non-conventional commit messages will be asked to rebase before merging.

---

## Pull Request Checklist

- [ ] Branch is up to date with `main`
- [ ] All tests pass (`pnpm test:run`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] New behavior is covered by tests
- [ ] Public API changes are reflected in the README
- [ ] Commit messages follow Conventional Commits

---

## Reporting Bugs

Open an issue and include:

1. A **minimal reproduction** — the smaller the better
2. **Expected behavior** vs **actual behavior**
3. Your Node.js and pnpm versions
4. Any relevant error messages or stack traces

---

## Feature Requests

Before opening a feature request, check if an issue already exists.

When opening one, describe:
- The **use case** you're trying to solve
- Why existing solutions don't work for you
- Any API ideas you have (optional)

We prioritize features that solve real production problems, especially in fintech and logistics.

---

## Questions

Open a [Discussion](https://github.com/GRobalinoU/ed-cse/discussions) rather than an issue for general questions.
