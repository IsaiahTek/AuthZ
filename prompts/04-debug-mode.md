# Task: Implement Debug Mode for Authorization Engine

Add a debug system to explain decisions.

---

## 🎯 Goals

* Help developers understand WHY access was denied
* Improve DX significantly

---

## 🧱 API

```ts
authz.can(ctx, { debug: true })
```

---

## 🧠 Response Format

```ts
{
  allowed: false,
  reason: "Denied by policy: post.delete",
  matchedPolicies: [...],
  failedConditions: [...]
}
```

---

## 🧩 Requirements

* Track evaluated policies
* Track failed conditions
* Track matched rules

---

## 🧩 Output

* debug mode implementation
* structured logs
* dev-friendly output
