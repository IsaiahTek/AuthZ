# Task: Integrate DSL with Framework Adapters

Connect the core DSL to:

* Express
* Fastify
* NestJS

---

## 🎯 Goals

* Zero duplication
* Clean separation from core

---

## 🧱 Express

```ts
authorize('post.update')
```

Middleware:

* extracts req.user
* calls authz.can

---

## ⚡ Fastify

* plugin
* decorator

---

## 🧩 NestJS

### Decorator

```ts
@Authorize('post.update')
```

### Guard

* reads metadata
* calls engine

---

## 🧠 Requirement

Adapters must:

* NOT contain business logic
* ONLY call core engine

---

## 🧩 Output

* adapters
* usage examples
* tests
