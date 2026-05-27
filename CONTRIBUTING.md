# Contributing to AuthZ

Thank you for your interest in contributing! AuthZ is a community-driven open-source project and welcomes contributions of all kinds — bug fixes, new features, documentation improvements, and test coverage.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 — `npm install -g pnpm`

### Clone & Install

```bash
git clone https://github.com/IsaiahTek/AuthZ.git
cd AuthZ
pnpm install
```

### Run Tests

```bash
pnpm test                    # Run all tests once
pnpm test --watch            # Watch mode
pnpm test --coverage         # With coverage report
```

### Build All Packages

```bash
pnpm --filter "./packages/**" run build
```

---

## Project Structure

```
AuthZ/
├── packages/
│   ├── authz-core/      # Framework-agnostic RBAC+PBAC engine
│   ├── authz-express/   # Express.js middleware
│   ├── authz-fastify/   # Fastify plugin
│   ├── authz-nestjs/    # NestJS module + guard
│   └── authz-node/      # Vanilla Node.js wrapper
├── authz-examples/
│   ├── express-app/     # Runnable Express demo
│   ├── fastify-app/     # Runnable Fastify demo
│   └── nestjs-app/      # Runnable NestJS demo
└── docs/                # Documentation guides
```

---

## Making Changes

### Bug Fixes

1. Open an issue first describing the bug and expected behaviour.
2. Create a branch: `git checkout -b fix/describe-the-bug`
3. Add a failing test that reproduces the bug.
4. Fix the bug and ensure the test passes.
5. Run `pnpm test` — all tests must pass.
6. Submit a PR against `main`.

### New Features

1. Open a GitHub Discussion or Issue to propose the feature before coding.
2. Create a branch: `git checkout -b feat/describe-the-feature`
3. Write tests first (TDD preferred).
4. Implement the feature.
5. Update the relevant `README.md` and/or `docs/` files.
6. Submit a PR against `main`.

### Adding a New Framework Adapter

AuthZ is designed to be extensible. To add a new adapter (e.g., `authz-hono`):

1. Copy the structure from `packages/authz-express/` as a starting point.
2. Your adapter **must not** import framework internals from `authz-core`.
3. Export a function or class that wraps an `AuthorizationEngine`.
4. Add a `peerDependency` for the target framework.
5. Include at least 4 unit tests covering: 401, 403, 200, and debug mode.
6. Add a runnable example in `authz-examples/<framework>-app/`.

---

## Code Style

- **TypeScript-first** — all source files must be `.ts`.
- No linter is enforced yet, but follow existing patterns (no semicolons are fine; consistency matters).
- Prefer `async/await` over raw Promises.
- Keep the core package **framework-free** — never import from express, fastify, or @nestjs in `authz-core`.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add whenAny JSON condition support
fix(pbac): correct evaluateCondition for JsonCondition in builder
docs(express): add troubleshooting section
test(node): add coverage for createRequestCache
```

---

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.
