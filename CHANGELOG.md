# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-05-27

### Added
- **`@vynelix/authz-core`** — Production-grade RBAC + PBAC authorization engine
  - `RBACEngine` with hierarchical role inheritance, circular-dependency detection, and O(1) permission lookups via build-time flattening
  - `PBACEngine` with action-indexed policy evaluation, Deny-overrides-Allow semantics, and support for function-based and JSON serializable conditions
  - `CombinedEngine` composing RBAC + PBAC with configurable AND-logic
  - `PolicyBuilder` fluent DSL: `policy('action').on('resource').when(...).build()`
  - `whenAny()` and `whenAll()` combinators on `PolicyBuilder` (now correctly handles JSON conditions)
  - `RequestCache` — Map-backed per-request memoization provider
  - `defineResources()` helper for type-safe permission string inference
  - Full TypeScript type exports: `AuthzUser`, `AuthzResource`, `AuthzContext`, `Decision`, `CacheProvider`, `AuthorizationEngine`, etc.
  - `createAuthz()` factory function

- **`@vynelix/authz-express`** — Express.js middleware adapter
  - `authorize(engine, options)` middleware with user extractor, resource resolver, cache, debug mode, and lifecycle hooks

- **`@vynelix/authz-fastify`** — Fastify plugin adapter
  - `fastifyAuthz` plugin with `fastify.authorize()` decorator and `preHandler` hook support

- **`@vynelix/authz-nestjs`** — NestJS module and guard
  - `AuthzModule.forRoot()` global module with engine and extractor configuration
  - `AuthzGuard` implementing `CanActivate`
  - `@Authorize({ action, resource })` decorator

- **`@vynelix/authz-node`** — Vanilla Node.js wrapper
  - `NodeAuthzEngine` wrapping any `AuthorizationEngine` with a `createRequestCache()` helper

- **Examples** — Runnable example apps for Express, Fastify, and NestJS in `authz-examples/`

- **CI/CD** — GitHub Actions workflow running tests on Node 18, 20, and 22

### Fixed
- `PolicyBuilder.whenAny()` silently skipped `JsonCondition` entries — now correctly evaluates all condition types via the shared `evaluateJsonCondition` helper

### Performance
- ~716k ops/sec (Combined + Cache) — 3.5x speedup over uncached evaluation
- ~438k ops/sec (RBAC only, 100-level deep hierarchy)
- ~312k ops/sec (PBAC only, 100 indexed policies)

---

[0.1.0]: https://github.com/IsaiahTek/AuthZ/releases/tag/v0.1.0
