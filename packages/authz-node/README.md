# @vynelix/authz-node

A lightweight, framework-agnostic wrapper for the AuthZ authorization SDK. Ideal for vanilla Node.js servers, AWS Lambda, or custom CLI tools.

## Features

- **Standalone**: No dependencies on Express, Fastify, or NestJS.
- **Request-Scoped Cache**: Helpers to create and manage memoization for single cycles.
- **Clean API**: Proxies the core engine while providing a unified entry point.

## Installation

```bash
npm install @vynelix/authz-core @vynelix/authz-node
```

## Basic Usage

```typescript
import { createAuthz } from '@vynelix/authz-node';

const authz = createAuthz({
  roles: { ... },
  policies: [ ... ]
});

// Vanilla HTTP Handler
async function handler(req, res) {
  const allowed = await authz.can({
    user: req.user,
    action: 'post.read'
  });
  
  if (!allowed) return res.status(403).send('Forbidden');
  // ...
}
```

## Manual Caching

For high-performance loops or complex request lifecycles, you can manage the `RequestCache` manually:

```typescript
import { RequestCache } from '@vynelix/authz-node';

const cache = new RequestCache();

// Multiple checks within the same logic block will be memoized
await authz.can(ctx1, { cache });
await authz.can(ctx1, { cache }); // Returns instant result from cache
```

## License
MIT
