# Task: Design RBAC + PBAC DSL (Developer API)

You are designing a TypeScript-first DSL for an authorization system that supports both RBAC (Role-Based Access Control) and PBAC (Policy-Based Access Control).

## 🎯 Goals

* Simple for beginners (RBAC-first)
* Powerful for advanced use cases (PBAC)
* Fully type-safe
* Framework-agnostic
* Composable and extensible

---

## 🧠 Core API

Everything must resolve to:

```ts
can({ user, action, resource }): boolean | Promise<boolean>
```

---

## 🧱 DSL Requirements

### 1. Roles (RBAC)

```ts
defineRoles({
  admin: { can: ['*'] },

  user: {
    can: ['post.read', 'post.create']
  },

  editor: {
    inherits: ['user'],
    can: ['post.update']
  }
});
```

Features:

* `can`
* `inherits`
* wildcard `*`
* string permissions (`resource.action`)

---

### 2. Policies (PBAC)

```ts
definePolicies([
  policy('post.update')
    .when((ctx) => ctx.user.id === ctx.resource.ownerId)
]);
```

---

### 3. Fluent API

```ts
policy('post.update')
  .on('post')
  .when(({ user, resource }) => user.id === resource.ownerId)
```

---

### 4. Logical Conditions

Support:

```ts
.whenAny([...])
.whenAll([...])
```

---

### 5. Deny Rules

```ts
policy('post.delete')
  .deny()
  .when(ctx => ctx.resource.locked)
```

Priority:
DENY overrides ALLOW

---

### 6. Field-Level Access

```ts
policy('user.update')
  .fields(['name', 'email'])
```

---

### 7. Multi-tenant Support

```ts
policy('post.read')
  .when(ctx => ctx.user.tenantId === ctx.resource.tenantId)
```

---

## 🧩 Output

Generate:

* DSL implementation
* Type definitions
* builder functions
* examples
* tests

Focus on developer experience and readability.
