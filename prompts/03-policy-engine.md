# Task: Build Policy Evaluation Engine

Implement a high-performance policy execution engine.

---

## 🎯 Goals

* Fast evaluation
* Support sync + async rules
* Combine RBAC + PBAC

---

## 🧠 Logic

Authorization passes if:

RBAC allows
AND
PBAC conditions pass
AND
No deny rule matches

---

## 🧱 Requirements

### 1. Engine Interface

```ts
interface AuthorizationEngine {
  can(ctx): boolean | Promise<boolean>;
}
```

---

### 2. Combined Engine

```ts
new CombinedEngine([rbacEngine, pbacEngine])
```

---

### 3. Execution Order

1. Check DENY policies
2. Check RBAC
3. Evaluate ALLOW policies

---

### 4. Async Support

```ts
when(async (ctx) => ...)
```

---

### 5. Optimization

* Precompile policies
* Cache results (optional)
* Avoid re-parsing

---

## 🧩 Output

* Engine implementation
* benchmarks
* unit tests
