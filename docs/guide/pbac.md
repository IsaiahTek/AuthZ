# PBAC Guide

**Policy-Based Access Control** (PBAC) in AuthZ adds attribute-aware, fine-grained access rules on top of roles. Policies are evaluated against the full `AuthzContext` (user, resource, action, meta).

---

## The Policy Builder

Use the fluent `policy()` DSL to define policies:

```typescript
import { policy } from '@vynelix/authz-core';

const myPolicy = policy('post.update')  // action to match
  .on('post')                           // optional resource type filter
  .when((ctx) => ctx.user.id === ctx.resource?.ownerId) // condition
  .build();
```

---

## Allow Policies

A policy with no `deny()` call defaults to **ALLOW**:

```typescript
policy('post.update')
  .on('post')
  .when((ctx) => ctx.user.id === ctx.resource?.ownerId)
  .build()
// Only allows post.update if the user owns the post
```

---

## Deny Policies

Deny policies **override** everything — even admin roles:

```typescript
policy('post.delete')
  .deny()
  .when((ctx) => ctx.resource?.locked === true)
  .build()
// Nobody can delete a locked post
```

---

## Combining Conditions

### `whenAll` — All conditions must pass

```typescript
policy('payment.approve')
  .whenAll([
    (ctx) => ctx.user.roles?.includes('finance'),
    (ctx) => ctx.meta?.amount < 10_000,
  ])
  .build()
```

### `whenAny` — At least one condition must pass

```typescript
policy('document.view')
  .whenAny([
    (ctx) => ctx.user.id === ctx.resource?.ownerId,
    (ctx) => ctx.user.roles?.includes('auditor'),
  ])
  .build()
```

---

## JSON Conditions (Serializable Policies)

For database-driven or dynamically loaded policies, use **JSON conditions** instead of functions:

```typescript
const policyFromDB = {
  action: 'user.view',
  resource: 'user',
  effect: 'ALLOW',
  condition: {
    op: 'equals',
    path: 'user.tenantId',
    value: 'tenant_123'
  }
};
```

Supported operators:

| `op` | Description |
| :--- | :--- |
| `equals` | `ctx[path] === value` |
| `notEquals` | `ctx[path] !== value` |
| `in` | `value.includes(ctx[path])` |
| `contains` | `ctx[path].includes(value)` |

The `path` is dot-notation resolved against the full `AuthzContext`:
- `"user.id"` → `ctx.user.id`
- `"resource.tenantId"` → `ctx.resource?.tenantId`
- `"meta.ipAddress"` → `ctx.meta?.ipAddress`

---

## Evaluation Order

For each request, PBAC evaluates in this order:

1. **DENY policies** matching the action/resource → if any condition passes → **immediate DENY**
2. **ALLOW policies** matching the action/resource → if any condition passes → **ALLOW**
3. **No matching policies** → **Abstain** (RBAC is the only authority)

---

## Composing RBAC + PBAC (AND Logic)

When you use `createAuthz({ roles, policies })`, access is granted **only when both engines agree**:

```
RBAC allows (role has the permission)
    AND
PBAC allows (condition passes) OR PBAC abstains (no matching policy)
    AND NOT
Explicit DENY policy (condition triggered)
```

---

## Async Conditions

Conditions can be `async` for database lookups:

```typescript
policy('document.download')
  .on('document')
  .when(async (ctx) => {
    const subscription = await db.getSubscription(ctx.user.id);
    return subscription.isActive;
  })
  .build()
```

> ⚠️ **Note**: Use async conditions with care — they add I/O latency to every authorization check. Consider caching the lookup result in `ctx.meta` via a pre-auth hook.
