# RBAC Guide

**Role-Based Access Control** (RBAC) in AuthZ lets you define named roles with a set of permitted actions, and supports deep hierarchical inheritance without any performance cost.

---

## Basic Roles

```typescript
import { createAuthz } from '@vynelix/authz-core';

const authz = createAuthz({
  roles: {
    guest:  { can: ['post.read'] },
    user:   { can: ['post.read', 'post.create'] },
    admin:  { can: ['*'] }, // wildcard — grants everything
  },
});
```

---

## Role Inheritance

Use the `inherits` key to build hierarchies. Permissions are **merged upward** — child roles gain all parent permissions.

```typescript
roles: {
  guest:      { can: ['post.read'] },
  user:       { inherits: ['guest'], can: ['post.create'] },   // + post.read
  editor:     { inherits: ['user'],  can: ['post.update'] },   // + post.read, post.create
  moderator:  { inherits: ['user'],  can: ['comment.delete'] },
  superadmin: { inherits: ['editor', 'moderator'], can: ['*'] },
}
```

Inheritance resolution happens **at construction time** — checks are instant `Set.has()` calls.

---

## Wildcard Permissions

| Pattern | Meaning |
| :--- | :--- |
| `'*'` | Grants access to **every** action |
| `'post.*'` | Grants access to all `post.*` actions |
| `'post.read'` | Grants access to this exact action |

```typescript
roles: {
  contentManager: {
    can: ['post.*', 'comment.*'], // all post and comment actions
  }
}
```

---

## Type-Safe Permission Strings

Use `defineResources()` to generate union types from your resource definitions:

```typescript
import { defineResources, PermissionStrings } from '@vynelix/authz-core';

const resources = defineResources({
  post:    ['read', 'create', 'update', 'delete'],
  comment: ['read', 'create', 'delete'],
});

// TypeScript now infers:
// type Perm = 'post.read' | 'post.create' | 'post.*' | 'comment.read' | ... | '*'
type Perm = PermissionStrings<typeof resources>;

const roles: Record<string, { can: Perm[] }> = {
  editor: { can: ['post.read', 'post.update'] }, // autocomplete!
};
```

---

## Circular Dependency Detection

AuthZ detects circular role inheritance at startup and throws immediately:

```typescript
const roles = {
  roleA: { inherits: ['roleB'], can: [] },
  roleB: { inherits: ['roleA'], can: [] }, // 💥
};
// throws: Error: Circular dependency detected in roles: roleA -> roleB -> roleA
```

---

## Checking Permissions

```typescript
const allowed = await authz.can({
  user:   { id: 'usr_1', roles: ['editor'] },
  action: 'post.update',
});
```

A user can have **multiple roles** — access is granted if **any** role grants the action:

```typescript
const user = { id: 'usr_1', roles: ['guest', 'moderator'] };
// Has: post.read, post.create, comment.delete
```
