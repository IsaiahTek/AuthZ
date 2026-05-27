# @vynelix/authz-express

Express.js middleware for the AuthZ authorization SDK.

## Features

- **Middleware based**: Protect routes with `authorize(engine, options)`.
- **Pre-request Context**: Automatic extraction of user and resource from the request object.
- **Audit Hooks**: `onPreAuth` and `onPostAuth` for security logging and compliance.
- **Caching**: Automatic per-request memoization.
- **Decision Payload**: Results injected into `res.locals.authzDecision`.

## Installation

```bash
npm install @vynelix/authz-core @vynelix/authz-express
```

## Basic Usage

```typescript
import express from 'express';
import { createAuthz } from '@vynelix/authz-core';
import { authorize } from '@vynelix/authz-express';

const engine = createAuthz({ ... });
const app = express();

app.put('/posts/:id', 
  authorize(engine, {
    action: 'post.update',
    resource: (req) => ({ type: 'post', id: req.params.id, ownerId: 'user-1' })
  }),
  (req, res) => {
    res.json({ message: 'Success' });
  }
);
```

## Custom Extraction

If your user object is stored in a non-standard location (e.g. `req.session.currentUser`), you can inject it via `res.locals` before calling the authorizer, or wrap the middleware.

```typescript
// Authentication middleware sets the user
app.use((req, res, next) => {
  req.user = { id: 'admin-1', roles: ['admin'] };
  next();
});
```

## Configuration Reference

| Option | Type | Description |
| :--- | :--- | :--- |
| `action` | `string` | The action to check (e.g. `post.delete`). |
| `resource` | `Function` | A callback receiving `req` and returning the resource object. |
| `useCache` | `boolean` | (Default: `true`) Enables per-request memoization. |
| `debug` | `boolean` | Returns full decision metadata in `res.locals.authzDecision`. |
| `onPreAuth` | `Function` | Callback before engine evaluation: `(ctx) => void`. |
| `onPostAuth` | `Function` | Callback after engine evaluation: `(ctx, decision) => void`. |

## Troubleshooting

### "Unauthorized: No user found"
Ensure your authentication middleware (Passport, JWT, etc.) runs **before** the `authorize` middleware. `authz-express` expects `req.user` to be populated.

### Decision Metadata
If `debug: true` is set, you can access the rejection reason in your controller:
```typescript
(req, res) => {
  const decision = res.locals.authzDecision;
  if (!decision.allowed) {
    console.log(`Blocked: ${decision.reason}`);
  }
}
```

## License
MIT
