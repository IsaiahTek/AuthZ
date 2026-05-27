import { 
  createAuthz as createCoreAuthz, 
  AuthzOptions, 
  AuthorizationEngine, 
  AuthzContext, 
  CanOptions, 
  Decision, 
  RequestCache 
} from '@vynelix/authz-core';

export * from '@vynelix/authz-core';

/**
 * Node-specific AuthZ engine wrapper.
 * Provides a built-in mechanism for per-request caching if desired.
 */
export class NodeAuthzEngine implements AuthorizationEngine {
  constructor(private engine: AuthorizationEngine) {}

  can(ctx: AuthzContext, options?: CanOptions): boolean | Decision | Promise<boolean | Decision> {
    return this.engine.can(ctx, options);
  }

  explain(ctx: AuthzContext): Decision | Promise<Decision> {
    return this.engine.explain ? this.engine.explain(ctx) : { allowed: false, reason: 'Engine does not support explain' };
  }

  /**
   * Helper to create a fresh request-scoped cache.
   */
  createRequestCache(): RequestCache {
    return new RequestCache();
  }
}

export function createAuthz(options: AuthzOptions): NodeAuthzEngine {
  const engine = createCoreAuthz(options);
  return new NodeAuthzEngine(engine);
}
