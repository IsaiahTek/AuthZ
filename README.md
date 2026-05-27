# AuthZ — The Multi-Flavor Authorization SDK

<p align="center">
  <a href="https://www.npmjs.com/package/@vynelix/authz-core"><img src="https://img.shields.io/npm/v/@vynelix/authz-core?style=flat-square&label=npm&color=2563eb" alt="npm version" /></a>
  <a href="https://github.com/IsaiahTek/AuthZ/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/IsaiahTek/AuthZ/ci.yml?branch=main&style=flat-square&label=CI" alt="CI status" /></a>
  <a href="https://github.com/IsaiahTek/AuthZ/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/TypeScript-first-3178c6?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/ESM%20%2B%20CJS-supported-brightgreen?style=flat-square" alt="Dual format" />
</p>

<p align="center">
  A production-grade, highly optimized authorization framework for Node.js.<br/>
  Combines the power of <strong>RBAC</strong> (Role-Based Access Control) and <strong>PBAC</strong> (Policy-Based Access Control)<br/>
  into a unified engine with <strong>sub-microsecond evaluation latency</strong>.
</p>

---

## ✨ Core Principles

1. **Performance by Default** — Static role resolution (`O(1)`) and indexed policy evaluation.
2. **Framework Freedom** — Core logic is fully isolated; adapters for Express, Fastify, and NestJS provide native integration without coupling.
3. **Audit First** — Built-in lifecycle hooks (`onPreAuth` / `onPostAuth`) for real-time security logging.
4. **Developer Experience** — Fluent policy builders, deep debug mode, and rich TypeScript inference.

---

## 📦 Packages

| Package | Purpose | Version |
| :--- | :--- | :--- |
| [`@vynelix/authz-core`](./packages/authz-core) | Core Engine — RBAC + PBAC logic | [![npm](https://img.shields.io/npm/v/@vynelix/authz-core?style=flat-square)](https://www.npmjs.com/package/@vynelix/authz-core) |
| [`@vynelix/authz-express`](./packages/authz-express) | Middleware for Express.js | [![npm](https://img.shields.io/npm/v/@vynelix/authz-express?style=flat-square)](https://www.npmjs.com/package/@vynelix/authz-express) |
| [`@vynelix/authz-fastify`](./packages/authz-fastify) | Plugin + Decorator for Fastify | [![npm](https://img.shields.io/npm/v/@vynelix/authz-fastify?style=flat-square)](https://www.npmjs.com/package/@vynelix/authz-fastify) |
| [`@vynelix/authz-nestjs`](./packages/authz-nestjs) | Module + Guard for NestJS | [![npm](https://img.shields.io/npm/v/@vynelix/authz-nestjs?style=flat-square)](https://www.npmjs.com/package/@vynelix/authz-nestjs) |
| [`@vynelix/authz-node`](./packages/authz-node) | Vanilla Node.js wrapper | [![npm](https://img.shields.io/npm/v/@vynelix/authz-node?style=flat-square)](https://www.npmjs.com/package/@vynelix/authz-node) |

---

## 🚀 Quick Start

### 1. Install

```bash
# Core (required)
npm install @vynelix/authz-core

# Pick your framework adapter
npm install @vynelix/authz-express   # Express
npm install @vynelix/authz-fastify   # Fastify
npm install @vynelix/authz-nestjs    # NestJS
npm install @vynelix/authz-node      # Vanilla Node.js / Lambda
```

### 2. Create your engine

```typescript
import { createAuthz, policy } from '@vynelix/authz-core';

const authz = createAuthz({
  // RBAC — hierarchical roles resolved at build time (O(1) lookups)
  roles: {
    guest:  { can: ['post.read'] },
    user:   { inherits: ['guest'], can: ['post.create'] },
    editor: { inherits: ['user'],  can: ['post.update'] },
    admin:  { can: ['*'] },
  },

  // PBAC — fine-grained policies with function or JSON conditions
  policies: [
    policy('post.update')
      .on('post')
      .when((ctx) => ctx.user.id === ctx.resource?.ownerId) // only own posts
      .build(),

    policy('post.delete')
      .deny()
      .when((ctx) => ctx.resource?.locked === true) // hard lock even for admin
      .build(),
  ],
});
```

### 3. Authorize a request

```typescript
const allowed = await authz.can({
  user:     { id: 'usr_1', roles: ['editor'] },
  action:   'post.update',
  resource: { type: 'post', id: 'p42', ownerId: 'usr_1' },
});
// => true (editor role + user owns the post)
```

### 4. Use with your framework

#### Express

```typescript
import { authorize } from '@vynelix/authz-express';

app.put('/posts/:id',
  authorize(authz, {
    action:   'post.update',
    resource: (req) => ({ type: 'post', id: req.params.id, ownerId: req.post.ownerId }),
  }),
  (req, res) => res.json({ ok: true })
);
```

#### Fastify

```typescript
import { fastifyAuthz } from '@vynelix/authz-fastify';

fastify.register(fastifyAuthz, { engine: authz });

fastify.put('/posts/:id', {
  preHandler: fastify.authorize({ action: 'post.update' })
}, handler);
```

#### NestJS

```typescript
@Module({ imports: [AuthzModule.forRoot({ engine: authz })] })
export class AppModule {}

@Controller('posts')
@UseGuards(AuthzGuard)
export class PostController {
  @Put(':id')
  @Authorize({ action: 'post.update', resource: 'post' })
  update() { ... }
}
```

---

## 🔍 Debug Mode

Every adapter supports `debug: true` which returns a full `Decision` object:

```typescript
const decision = await authz.can(ctx, { debug: true });
// {
//   allowed: false,
//   reason: "PBAC Denied (Condition mismatch): ...",
//   matchedPolicies: ["post.update"],
//   failedConditions: ["Condition failed for policy: post.update"]
// }
```

---

## 📊 Feature Parity Matrix

| Feature | Core | Express | Fastify | NestJS | Node |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **RBAC / PBAC Engine** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Per-Request Caching** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Audit Hooks (Pre/Post)** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Debug Mode** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Decorator Support** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Global Middleware** | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## ⚡ Benchmarks

> Evaluated on a standard Linux environment using `tinybench`.

| Scenario | Ops/sec | Avg Latency |
| :--- | :--- | :--- |
| RBAC Only (100-level hierarchy) | ~438,000 | 2.27µs |
| PBAC Only (100 indexed policies) | ~312,000 | 3.19µs |
| Combined (No Cache) | ~237,000 | 4.20µs |
| **Combined + Cache Hit** | **~716,000** | **1.39µs** |

See [performance_report.md](./performance_report.md) for full methodology.

---

## 🆚 Why AuthZ?

| Feature | AuthZ | CASL | Oso |
| :--- | :---: | :---: | :---: |
| **RBAC Hierarchy** | ✅ | ⚠️ | ✅ |
| **PBAC / Attributes** | ✅ | ✅ | ✅ |
| **Deny Overrides Allow** | ✅ | ❌ | ✅ |
| **Serializable JSON Policies** | ✅ | ✅ | ❌ |
| **O(1) Role Lookup** | ✅ | ❌ | ❌ |
| **Per-Request Cache** | ✅ | ❌ | ❌ |
| **Framework Adapters** | ✅ | ⚠️ | ⚠️ |

---

## 📚 Documentation

| Guide | Description |
| :--- | :--- |
| [Getting Started](./docs/getting-started.md) | Installation, first engine, first check |
| [RBAC Guide](./docs/guide/rbac.md) | Roles, inheritance, wildcards |
| [PBAC Guide](./docs/guide/pbac.md) | Policies, conditions, deny rules |
| [Custom Engine](./docs/guide/custom-engine.md) | Implementing `AuthorizationEngine` |

---

## 🧪 Examples

Working runnable apps in [`authz-examples/`](./authz-examples/):

- **[Express](./authz-examples/express-app/)** — RBAC + PBAC + audit hooks
- **[Fastify](./authz-examples/fastify-app/)** — Plugin + preHandler decorator
- **[NestJS](./authz-examples/nestjs-app/)** — Module + Guard + @Authorize decorator

---

## 🗺️ Roadmap

- [ ] **Redis Cache Provider** — Shared cache for multi-instance deployments
- [ ] **AuthZ Dashboard** — Visual policy editor and real-time audit viewer
- [ ] **Rust/WASM Core** — WASM-based engine for maximum performance

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to set up the monorepo, run tests, and submit pull requests.

---

## License

[MIT](./LICENSE) © 2026 [Engr., Isaiah Pius](https://github.com/IsaiahTek)
