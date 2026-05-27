# Task: Advanced TypeScript Typing & Inference for AuthZ DSL

Enhance the DSL with strong TypeScript inference.

---

## 🎯 Goals

* Autocomplete for actions and resources
* Prevent invalid permissions at compile-time
* Infer types from config

---

## 🧱 Requirements

### 1. Resource Definition

```ts
defineResources({
  post: ['read', 'create', 'update', 'delete'],
  user: ['read', 'update']
});
```

---

### 2. Typed Permissions

Convert to:

```ts
type Permission = "post.read" | "post.update" | ...
```

---

### 3. Type-safe policy

```ts
policy<'post.update'>()
```

---

### 4. Strong Context Typing

```ts
interface AuthzContext<U, R> {
  user: U;
  resource: R;
}
```

---

### 5. Inference Example

```ts
authz.can({
  action: "post.update", // autocomplete
});
```

---

## 🧩 Output

* Generic types
* utility types
* mapped types
* inference system

Avoid runtime overhead.
