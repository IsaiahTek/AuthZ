You are building a production-grade, framework-agnostic authorization SDK with RBAC and PBAC support.

## 🎯 Goal

Create a modular authorization system that works across:

* Node.js (vanilla)
* Express
* Fastify
* NestJS

The system must follow a strict layered architecture:

1. Core engine (framework-agnostic)
2. Framework adapters
3. Optional integrations

---

# 🧱 Monorepo Structure

Use a monorepo (pnpm or turborepo preferred):

/packages
/authz-core
/authz-express
/authz-fastify
/authz-nestjs
/authz-node (optional minimal wrapper)
/authz-examples

---

# 🧠 Core Package: @vynelix/authz-core

## Responsibilities

* RBAC (roles, permissions)
* PBAC (policy-based access control)
* Pluggable authorization engine
* No dependency on HTTP frameworks

## Key Interfaces

```ts
interface AuthzUser {
  id: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

interface AuthzResource {
  type: string;
  id?: string;
  ownerId?: string;
  [key: string]: any;
}

interface AuthzContext {
  user: AuthzUser;
  resource?: AuthzResource;
  action: string;
  meta?: Record<string, any>;
}

interface AuthorizationEngine {
  can(context: AuthzContext): boolean | Promise<boolean>;
}
```

---

## Features to Implement

### 1. RBAC Engine

* Role → permissions mapping
* Permission checks
* Hierarchical roles (optional)

### 2. PBAC Engine

* Policy rules like:

```ts
{
  action: "update",
  resource: "post",
  condition: (ctx) => ctx.user.id === ctx.resource.ownerId
}
```

* Support:

  * function-based policies
  * JSON-based policies (optional)

---

### 3. Engine Factory

```ts
createAuthz({
  engine: "rbac" | "pbac" | customEngine,
  options: {}
})
```

---

### 4. Composable Engines

Allow combining RBAC + PBAC:

```ts
new CombinedEngine([rbacEngine, pbacEngine])
```

---

# 🔌 Express Adapter: @vynelix/authz-express

## Features

* Middleware:

```ts
authorize({ action, resource })
```

* Attaches result to request or throws 403

* Extract user from:

  * req.user (default)
  * configurable extractor

---

# ⚡ Fastify Adapter: @vynelix/authz-fastify

## Features

* Fastify plugin
* Decorator:

```ts
fastify.authorize({ action, resource })
```

* Hook support (preHandler)

---

# 🧩 NestJS Adapter: @vynelix/authz-nestjs

## Features

### Decorators

```ts
@Authorize({ action: 'read', resource: 'post' })
```

### Guards

* AuthzGuard

### Module

```ts
AuthzModule.forRoot({...})
```

### Integration

* Works with request.user (from auth)

---

# 🟢 Node Adapter (Optional)

Simple function:

```ts
authz.can({ user, action, resource })
```

---

# 🔄 Extensibility

Support custom engines:

```ts
class MyCustomEngine implements AuthorizationEngine {
  can(ctx) { ... }
}
```

---

# 🧪 Examples Package

Include working examples for:

* Express app
* Fastify app
* NestJS app

Each example must demonstrate:

* RBAC usage
* PBAC usage
* Combined usage

---

# 🧱 Engineering Requirements

* TypeScript-first
* Full type safety
* Tree-shakable
* No framework leakage into core
* 90%+ test coverage (vitest or jest)

---

# 📦 Packaging

* Each package independently installable
* Proper peerDependencies for frameworks
* ESM + CJS support

---

# 📘 Documentation

Include:

* Getting started
* RBAC guide
* PBAC guide
* Custom engine guide
* Framework-specific usage

---

# 🚫 Constraints

* DO NOT couple core to any framework
* DO NOT assume Express-style request everywhere
* DO NOT hardcode RBAC logic inside adapters

---

# ✅ Output

Generate:

* Full monorepo structure
* Core implementation
* Adapters
* Example apps
* README for each package

Focus on clean architecture, extensibility, and developer experience.
