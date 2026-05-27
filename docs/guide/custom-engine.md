# Custom Engine Guide

AuthZ is built around the `AuthorizationEngine` interface, making it fully pluggable. You can replace, extend, or compose any part of the authorization system.

---

## The `AuthorizationEngine` Interface

```typescript
import { AuthzContext, Decision, CanOptions } from '@vynelix/authz-core';

interface AuthorizationEngine {
  can(context: AuthzContext, options?: CanOptions): boolean | Decision | Promise<boolean | Decision>;
  explain?(context: AuthzContext): Decision | Promise<Decision>;
}
```

---

## Minimal Custom Engine

```typescript
import { AuthorizationEngine, AuthzContext, Decision } from '@vynelix/authz-core';

export class DatabasePolicyEngine implements AuthorizationEngine {
  constructor(private db: PolicyDatabase) {}

  async can(ctx: AuthzContext): Promise<boolean> {
    const policies = await this.db.findPolicies({
      userId: ctx.user.id,
      action:  ctx.action,
    });
    return policies.some(p => this.evaluate(p, ctx));
  }

  private evaluate(policy: DBPolicy, ctx: AuthzContext): boolean {
    // your custom logic
    return true;
  }
}

// Use it directly
const engine = new DatabasePolicyEngine(db);
const allowed = await engine.can({ user, action: 'invoice.view' });
```

---

## Using a Custom Engine with Framework Adapters

All adapters accept any `AuthorizationEngine` — just pass your custom instance:

```typescript
// Express
import { authorize } from '@vynelix/authz-express';
app.get('/invoices', authorize(myCustomEngine, { action: 'invoice.view' }));

// NestJS
AuthzModule.forRoot({ engine: myCustomEngine });
```

---

## Composing Multiple Engines

Use `CombinedEngine` to layer multiple engines with AND semantics:

```typescript
import { CombinedEngine, RBACEngine, PBACEngine } from '@vynelix/authz-core';

const rbac = new RBACEngine({ admin: { can: ['*'] } });
const pbac = new PBACEngine([myPolicy]);
const combined = new CombinedEngine({ rbac, pbac });
```

Or pass custom engines in any combination:

```typescript
class TenantEngine implements AuthorizationEngine {
  can(ctx: AuthzContext) {
    return ctx.user.tenantId === ctx.resource?.tenantId;
  }
}

// Manually chain engines
const final: AuthorizationEngine = {
  async can(ctx) {
    if (!await rbac.can(ctx)) return false;
    if (!await new TenantEngine().can(ctx)) return false;
    return true;
  }
};
```

---

## Caching in Custom Engines

To support the built-in `RequestCache`, check `options.cache` in your `can()` implementation:

```typescript
async can(ctx: AuthzContext, options?: CanOptions): Promise<boolean | Decision> {
  const key = `${ctx.user.id}:${ctx.action}`;

  if (options?.cache) {
    const cached = options.cache.get(key);
    if (cached !== undefined) return cached;
  }

  const result = await this.evaluate(ctx);

  if (options?.cache) {
    options.cache.set(key, typeof result === 'boolean' ? result : result.allowed);
  }

  return result;
}
```

---

## Returning Rich Decisions

If you implement `explain()`, debug mode in all adapters will surface your reasoning:

```typescript
async explain(ctx: AuthzContext): Promise<Decision> {
  const allowed = await this.evaluate(ctx);
  return {
    allowed,
    reason: allowed
      ? `Granted by DatabasePolicyEngine for user ${ctx.user.id}`
      : `No matching policy found in DB for action '${ctx.action}'`,
    matchedPolicies: allowed ? ['db-policy-42'] : [],
  };
}
```
