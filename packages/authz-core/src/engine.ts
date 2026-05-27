import { AuthzContext, AuthorizationEngine, Decision, RolesConfig, PolicyDefinition, CanOptions } from './types';
import { RBACEngine } from './rbac';
import { PBACEngine } from './pbac';

export class CombinedEngine implements AuthorizationEngine {
  private rbac: RBACEngine;
  private pbac: PBACEngine;

  constructor(engines: { rbac?: RBACEngine; pbac?: PBACEngine } | AuthorizationEngine[]) {
    if (Array.isArray(engines)) {
      this.rbac = engines.find((e) => e instanceof RBACEngine) as RBACEngine;
      this.pbac = engines.find((e) => e instanceof PBACEngine) as PBACEngine;
    } else {
      this.rbac = engines.rbac!;
      this.pbac = engines.pbac!;
    }
  }

  private getCacheKey(ctx: AuthzContext): string {
    const userId = ctx.user.id;
    const action = ctx.action;
    const resourceId = ctx.resource?.id || 'no-resource-id';
    return `${userId}:${action}:${resourceId}`;
  }

  async can(ctx: AuthzContext, options?: CanOptions): Promise<boolean | Decision> {
    const cache = options?.cache;
    const cacheKey = this.getCacheKey(ctx);

    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const decision = await this.explain(ctx);
    
    if (cache) {
      cache.set(cacheKey, decision.allowed);
    }

    if (options?.debug) {
      return decision;
    }
    return decision.allowed;
  }

  async explain(ctx: AuthzContext): Promise<Decision> {
    // 1. Check PBAC first for DENY rules (most specific)
    const pbacDecision = await this.pbac.explain(ctx);
    if (!pbacDecision.allowed && pbacDecision.reason?.includes('Denied by policy')) {
      return pbacDecision;
    }

    // 2. Check RBAC
    const rbacDecision = await this.rbac.explain(ctx);
    if (!rbacDecision.allowed) {
      return {
        allowed: false,
        reason: `RBAC Denied: ${rbacDecision.reason}`,
        failedConditions: pbacDecision.failedConditions,
      };
    }

    // 3. PBAC must also allow if we are following the "AND" logic
    if (!pbacDecision.allowed) {
      return {
        allowed: false,
        reason: `PBAC Denied (Condition mismatch): ${pbacDecision.reason}`,
        failedConditions: pbacDecision.failedConditions,
      };
    }

    return {
      allowed: true,
      reason: `Authorized: [RBAC: ${rbacDecision.reason}] and [PBAC: ${pbacDecision.reason}]`,
      matchedPolicies: [...(rbacDecision.matchedPolicies || []), ...(pbacDecision.matchedPolicies || [])],
    };
  }
}

export interface AuthzOptions {
  roles?: RolesConfig;
  policies?: PolicyDefinition[];
  engine?: AuthorizationEngine;
}

export function createAuthz(options: AuthzOptions): AuthorizationEngine {
  if (options.engine) {
    return options.engine;
  }
  const rbac = new RBACEngine(options.roles || {});
  const pbac = new PBACEngine(options.policies || []);
  return new CombinedEngine({ rbac, pbac });
}
