import { AuthzContext, AuthorizationEngine, RolesConfig, Decision, CanOptions } from './types.js';

export class RBACEngine implements AuthorizationEngine {
  private flattenedRoles: Map<string, Set<string>> = new Map();

  constructor(config: RolesConfig) {
    this.flatten(config);
  }

  private flatten(config: RolesConfig) {
    for (const roleName in config) {
      const permissions = this.resolveRolePermissions(roleName, config, new Set());
      this.flattenedRoles.set(roleName, permissions);
    }
  }

  private resolveRolePermissions(
    roleName: string,
    config: RolesConfig,
    visited: Set<string>
  ): Set<string> {
    if (visited.has(roleName)) {
      throw new Error(`Circular dependency detected in roles: ${Array.from(visited).join(' -> ')} -> ${roleName}`);
    }

    const role = config[roleName];
    if (!role) {
      throw new Error(`Role "${roleName}" is not defined.`);
    }

    const permissions = new Set<string>(role.can);
    
    if (role.inherits) {
      const nextVisited = new Set(visited);
      nextVisited.add(roleName);
      
      for (const parentRole of role.inherits) {
        const parentPermissions = this.resolveRolePermissions(parentRole, config, nextVisited);
        for (const p of parentPermissions) {
          permissions.add(p);
        }
      }
    }

    return permissions;
  }

  async can(ctx: AuthzContext, options?: CanOptions): Promise<boolean | Decision> {
    if (options?.debug) {
      return this.explain(ctx);
    }
    return this.evaluate(ctx);
  }

  private evaluate(ctx: AuthzContext): boolean {
    const userRoles = ctx.user.roles || [];
    const requiredPermission = ctx.action;

    for (const role of userRoles) {
      const permissions = this.flattenedRoles.get(role);
      if (!permissions) continue;

      if (permissions.has('*')) return true;
      if (permissions.has(requiredPermission)) return true;
      
      const [resource] = requiredPermission.split('.');
      if (permissions.has(`${resource}.*`)) return true;
    }

    return false;
  }

  async explain(ctx: AuthzContext): Promise<Decision> {
    const allowed = this.evaluate(ctx);
    return {
      allowed,
      reason: allowed ? `Allowed by RBAC roles: ${ctx.user.roles?.join(', ')}` : `Denied: No role grants permission "${ctx.action}"`,
    };
  }
}
