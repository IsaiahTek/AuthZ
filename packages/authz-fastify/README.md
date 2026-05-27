# @vynelix/authz-fastify

Fastify plugin for the AuthZ authorization SDK.

## Features

- **Plugin based**: Registered as a standard Fastify plugin.
- **Decorator pattern**: Adds `.authorize()` decorator to the Fastify instance.
- **Native Hooks**: Integration with Fastify's `preHandler` lifecycle.
- **Audit Hooks**: `onPreAuth` and `onPostAuth` for security logging.
- **Caching**: Automated per-request memoization.

## Installation

```bash
npm install @vynelix/authz-core @vynelix/authz-fastify
```

## Basic Usage

```typescript
import Fastify from 'fastify';
import { createAuthz } from '@vynelix/authz-core';
import { fastifyAuthz } from '@vynelix/authz-fastify';

const engine = createAuthz({ ... });
const fastify = Fastify();

// Register the plugin
fastify.register(fastifyAuthz, { engine });

// Use the decorator in routes
fastify.after(() => {
  fastify.get('/secure-data', {
    preHandler: fastify.authorize({ action: 'data.view' })
  }, async (request, reply) => {
    return { data: '...' };
  });
});
```

## Type Safety

To get full TypeScript support for the `request.user` and `request.authzDecision` properties, you can extend the Fastify interfaces:

```typescript
import { AuthzUser, Decision } from '@vynelix/authz-core';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthzUser;
    authzDecision?: boolean | Decision;
  }
}
```

## Configuration Reference

### Plugin Registration
| Option | Type | Description |
| :--- | :--- | :--- |
| `engine` | `AuthorizationEngine` | The AuthZ engine instance. |
| `useCache` | `boolean` | (Default: `true`) Enables per-request memoization. |

### `fastify.authorize(options)`
| Option | Type | Description |
| :--- | :--- | :--- |
| `action` | `string` | The action string. |
| `resource` | `Function` | Returns the resource (receives `request`). |
| `debug` | `boolean` | If true, returns detailed decision object. |
| `onPostAuth` | `Function` | Lifecycle hook for auditing: `(ctx, res) => void`. |

## Performance

The authorizer is attached as a `preHandler` hook. Because it uses the `RequestCache` by default, multiple calls to `.can()` or repeated checks across different hooks within the same request lifecycle will result in zero performance overhead after the first evaluation.

## License
MIT
