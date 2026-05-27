# Getting Started with AuthZ

> AuthZ is a production-grade, framework-agnostic RBAC + PBAC authorization SDK for Node.js.

---

## Installation

Install the core engine plus your framework adapter:

```bash
# Always required
npm install @vynelix/authz-core

# Choose your adapter
npm install @vynelix/authz-express   # for Express.js
npm install @vynelix/authz-fastify   # for Fastify
npm install @vynelix/authz-nestjs    # for NestJS
npm install @vynelix/authz-node      # for vanilla Node / Lambda
```

---

## Your First Engine

```typescript
import { createAuthz } from '@vynelix/authz-core';

const authz = createAuthz({
  roles: {
    guest: { can: ['article.read'] },
    author: { inherits: ['guest'], can: ['article.create', 'article.update'] },
    admin:  { can: ['*'] }, // superuser wildcard
  },
});
```

## Your First Check

```typescript
const allowed = await authz.can({
  user:   { id: 'usr_1', roles: ['author'] },
  action: 'article.create',
});

console.log(allowed); // true
```

---

## Two Engines, One Decision

AuthZ combines two independent engines:

### RBAC Engine
Roles are resolved **at build time** into a flat `Set` per role. Permission lookups are `O(1)` regardless of hierarchy depth.

### PBAC Engine
Policies are **action-indexed** at startup. Only policies matching the current action are evaluated.

### Combined (AND) Logic
Both engines must agree to allow access:
1. **Explicit DENY policy** → immediate denial (deny overrides everything)
2. **RBAC grants** the role permission AND
3. **PBAC allows** (or abstains, meaning no matching policy)

→ **Access granted**

---

## Debug Mode

Return a `Decision` object instead of a `boolean` for logging and troubleshooting:

```typescript
const decision = await authz.can(ctx, { debug: true });
console.log(decision);
// {
//   allowed: false,
//   reason: "RBAC Denied: No role grants permission 'article.delete'",
//   matchedPolicies: [],
//   failedConditions: []
// }
```

---

## Next Steps

- [RBAC Guide](./guide/rbac.md) — Role hierarchies, wildcards, and type-safe permission strings
- [PBAC Guide](./guide/pbac.md) — Policy builder, conditions, deny rules, JSON policies
- [Custom Engine Guide](./guide/custom-engine.md) — Implement your own `AuthorizationEngine`
