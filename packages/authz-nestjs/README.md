# @vynelix/authz-nestjs

NestJS module and guard for the AuthZ authorization SDK.

## Features

- **AuthzGuard**: Protect routes using standard NestJS Guard decoration.
- **@Authorize Decorator**: Fine-grained metadata for actions and resources.
- **Global Configuration**: Set engine and global extractors via `AuthzModule.forRoot`.
- **Audit Hooks**: `onPreAuth` and `onPostAuth` hooks integrated into the Guard lifecycle.
- **Caching**: Automated per-request memoization.

## Installation

```bash
npm install @vynelix/authz-core @vynelix/authz-nestjs
```

## Basic Usage

### 1. Global Setup
```typescript
@Module({
  imports: [
    AuthzModule.forRoot({
      engine: myAuthzEngine,
      extractor: (req) => req.user,
      defaultDebug: false
    })
  ]
})
export class AppModule {}
```

### 2. Guard Application
```typescript
@Controller('posts')
@UseGuards(AuthzGuard)
export class PostController {
  
  @Put(':id')
  @Authorize({ 
    action: 'post.update', 
    resource: 'post' // Auto-converts to { type: 'post' }
  })
  async update() { ... }
}
```

## Dependency Injection

If you need to construct your engine using other services (e.g., loading policies from a database), use the `factory` pattern in a custom provider and pass it to `forRoot`.

```typescript
// app.module.ts
providers: [
  {
    provide: 'MY_ENGINE',
    useFactory: async (dbService) => {
      const policies = await dbService.loadPolicies();
      return createAuthz({ policies });
    },
    inject: [DatabaseService]
  }
]
```

## Unit Testing

You can easily mock the `AuthzGuard` or provide a dummy engine during testing:

```typescript
const moduleFixture: TestingModule = await Test.createTestingModule({
  imports: [AppModule],
})
.overrideProvider('AUTHZ_ENGINE')
.useValue({ can: () => true }) // Direct mock
.compile();
```

## Module Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `engine` | `AuthorizationEngine` | The AuthZ engine instance. |
| `extractor` | `Function` | Default logic to extract the user from the Request. |
| `defaultDebug` | `boolean` | Global debug toggle. |
| `useCache` | `boolean` | (Default: `true`) Enables per-request memoization. |

## License
MIT
