# AuthZ - The Multi-Flavor Authorization SDK

A production-grade, highly optimized authorization framework for Node.js. 

AuthZ combines the power of **RBAC** (Role-Based Access Control) and **PBAC** (Policy-Based Access Control) into a unified engine with sub-microsecond evaluation latency.

## Core Philosophical Principles

1. **Performance by Default**: Static role resolution (O(1)) and indexed policy evaluation.
2. **Framework Freedom**: Core logic is isolated; adapters for Express, Fastify, and NestJS provide native integration.
3. **Audit First**: Built-in lifecycle hooks for real-time security logging.
4. **Developer Experience**: Fluent policy builders and deep debugging tools.

## Packages

| Package | Purpose | Version |
| :--- | :--- | :--- |
| [`@vynelix/authz-core`](./packages/authz-core) | Core Engine, PBAC/RBAC logic. | `0.0.1` |
| [`@vynelix/authz-express`](./packages/authz-express) | Middleware for Express.js. | `0.0.1` |
| [`@vynelix/authz-fastify`](./packages/authz-fastify) | Plugin/Decorator for Fastify. | `0.0.1` |
| [`@vynelix/authz-nestjs`](./packages/authz-nestjs) | Module/Guard for NestJS. | `0.0.1` |
| [`@vynelix/authz-node`](./packages/authz-node) | Vanilla Node.js wrapper. | `0.0.1` |

## Feature Parity Matrix

| Feature | Core | Express | Fastify | NestJS | 
| :--- | :---: | :---: | :---: | :---: |
| **RBAC / PBAC Engine** | ✅ | ✅ | ✅ | ✅ |
| **Per-Request Caching**| ✅ | ✅ | ✅ | ✅ |
| **Audit Hooks (Pre/Post)**| ✅ | ✅ | ✅ | ✅ |
| **Debug Mode** | ✅ | ✅ | ✅ | ✅ |
| **Decorator Support** | ❌ | ❌ | ✅ | ✅ |
| **Global Middleware** | ❌ | ✅ | ✅ | ✅ |

## Benchmarks

Evaluating a cached authorization decision takes approximately **1.4 microseconds**.
Running 1000 rules takes **~0.1ms** due to internal policy indexing.

See the [Performance Report](./performance_report.md) for deeper details.

## Roadmap

- [ ] **Redis Provider**: Shared cache for multi-instance deployments.
- [ ] **AuthZ Dashboard**: Visual policy editor and real-time audit viewer.
- [ ] **Rust Core**: WASM-based engine for even higher performance.

## License
MIT
