import { AuthzContext, AuthorizationEngine, PolicyDefinition, Decision, Condition, JsonCondition, CanOptions } from './types';

// ---------------------------------------------------------------------------
// Shared JSON condition evaluator (used by both PolicyBuilder and PBACEngine)
// ---------------------------------------------------------------------------
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function evaluateJsonCondition(condition: JsonCondition, ctx: AuthzContext): boolean {
  const { op, path, value } = condition;
  const actualValue = getValueByPath(ctx, path);
  switch (op) {
    case 'equals':    return actualValue === value;
    case 'notEquals': return actualValue !== value;
    case 'in':        return Array.isArray(value) && value.includes(actualValue);
    case 'contains':  return Array.isArray(actualValue) && actualValue.includes(value);
    default:          return false;
  }
}

export class PolicyBuilder<Action extends string = string, Resource extends string = string> {
  private policy: PolicyDefinition;

  constructor(action: Action) {
    this.policy = {
      action,
      effect: 'ALLOW',
    };
  }

  on<R extends string>(resource: R): PolicyBuilder<Action, R> {
    this.policy.resource = resource;
    return this as any;
  }

  when(condition: Condition): this {
    this.policy.condition = condition;
    return this;
  }

  whenAny(conditions: Condition[]): this {
    this.policy.condition = async (ctx) => {
      for (const cond of conditions) {
        const result = typeof cond === 'function'
          ? await cond(ctx)
          : await evaluateJsonCondition(cond, ctx);
        if (result) return true;
      }
      return false;
    };
    return this;
  }

  whenAll(conditions: Condition[]): this {
    this.policy.condition = async (ctx) => {
      for (const cond of conditions) {
        const result = typeof cond === 'function'
          ? await cond(ctx)
          : await evaluateJsonCondition(cond, ctx);
        if (!result) return false;
      }
      return true;
    };
    return this;
  }

  deny(): this {
    this.policy.effect = 'DENY';
    return this;
  }

  fields(fields: string[]): this {
    this.policy.fields = fields;
    return this;
  }

  build(): PolicyDefinition {
    return this.policy;
  }
}

export const policy = <Action extends string>(action: Action) => new PolicyBuilder<Action>(action);

export class PBACEngine implements AuthorizationEngine {
  private indexedPolicies: Map<string, PolicyDefinition[]> = new Map();
  private wildcardPolicies: PolicyDefinition[] = [];

  constructor(policies: PolicyDefinition[]) {
    this.indexPolicies(policies);
  }

  private indexPolicies(policies: PolicyDefinition[]) {
    for (const p of policies) {
      if (p.action === '*') {
        this.wildcardPolicies.push(p);
        continue;
      }
      
      const list = this.indexedPolicies.get(p.action) || [];
      list.push(p);
      this.indexedPolicies.set(p.action, list);
    }
  }

  private async evaluateCondition(condition: Condition, ctx: AuthzContext): Promise<boolean> {
    if (typeof condition === 'function') {
      return condition(ctx);
    }
    return evaluateJsonCondition(condition, ctx);
  }

  async can(ctx: AuthzContext, options?: CanOptions): Promise<boolean | Decision> {
    const decision = await this.explain(ctx);
    if (options?.debug) {
      return decision;
    }
    return decision.allowed;
  }

  async explain(ctx: AuthzContext): Promise<Decision> {
    const actionPolicies = this.indexedPolicies.get(ctx.action) || [];
    const matchedPolicies = [...actionPolicies, ...this.wildcardPolicies].filter(p => {
      return !p.resource || p.resource === ctx.resource?.type;
    });

    if (matchedPolicies.length === 0) {
      return {
        allowed: true,
        reason: 'No policies matched for this action/resource (Abstain)',
      };
    }

    const denyPolicies = matchedPolicies.filter(p => p.effect.toUpperCase() === 'DENY');
    const allowPolicies = matchedPolicies.filter(p => p.effect.toUpperCase() === 'ALLOW');

    // 1. Check DENY policies first (Deny overrides Allow)
    for (const p of denyPolicies) {
      if (!p.condition || (await this.evaluateCondition(p.condition, ctx))) {
        return {
          allowed: false,
          reason: `Denied by policy: ${p.action}${p.resource ? ` on ${p.resource}` : ''}`,
          matchedPolicies: [p.action],
        };
      }
    }

    // 2. Check ALLOW policies
    const successPolicies: string[] = [];
    const failedConditions: string[] = [];

    for (const p of allowPolicies) {
      if (!p.condition) {
        successPolicies.push(p.action);
        continue;
      }

      const pass = await this.evaluateCondition(p.condition, ctx);
      if (pass) {
        successPolicies.push(p.action);
      } else {
        failedConditions.push(`Condition failed for policy: ${p.action}`);
      }
    }

    if (successPolicies.length > 0) {
      return {
        allowed: true,
        reason: `Allowed by policies: ${successPolicies.join(', ')}`,
        matchedPolicies: successPolicies,
      };
    }

    return {
      allowed: false,
      reason: 'No matching ALLOW policy found',
      failedConditions,
    };
  }
}
