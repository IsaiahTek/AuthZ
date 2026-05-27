# Task: Design Extensibility & Plugin System

Make the authorization system extensible.

---

## 🎯 Goals

* Allow custom engines
* Allow third-party integrations

---

## 🧱 Requirements

### 1. Custom Engine

```ts
class MyEngine implements AuthorizationEngine {
  can(ctx) { ... }
}
```

---

### 2. Plugin Registration

```ts
createAuthz({
  engine: new MyEngine()
})
```

---

### 3. Adapter Hooks

Allow:

* pre-evaluation hook
* post-evaluation hook

---

### 4. Future Integrations

Design for:

* CASL adapter
* external policy engines

---

## 🧩 Output

* plugin system
* extension API
* examples
