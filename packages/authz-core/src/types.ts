export interface AuthzUser {
  id: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

export interface AuthzResource {
  type: string;
  id?: string;
  ownerId?: string;
  tenantId?: string;
  [key: string]: any;
}

export interface AuthzContext<U = AuthzUser, R = AuthzResource> {
  user: U;
  resource?: R;
  action: string;
  meta?: Record<string, any>;
}

export type DecisionReason = string;

export interface Decision {
  allowed: boolean;
  reason?: DecisionReason;
  matchedPolicies?: string[];
  failedConditions?: string[];
}

export interface CanOptions {
  debug?: boolean;
  cache?: CacheProvider;
}

export interface CacheProvider {
  get(key: string): boolean | undefined;
  set(key: string, value: boolean): void;
  delete(key: string): void;
  clear(): void;
}

export interface AuthorizationEngine {
  can(context: AuthzContext, options?: CanOptions): boolean | Decision | Promise<boolean | Decision>;
  explain?(context: AuthzContext): Decision | Promise<Decision>;
}

export type RoleDefinition = {
  can: string[];
  inherits?: string[];
};

export type RolesConfig = Record<string, RoleDefinition>;

export type ConditionFunction<U = AuthzUser, R = AuthzResource> = (
  ctx: AuthzContext<U, R>
) => boolean | Promise<boolean>;

export type JsonCondition = {
  op: 'equals' | 'notEquals' | 'in' | 'contains';
  path: string;
  value: any;
};

export type Condition = ConditionFunction | JsonCondition;

export interface PolicyDefinition {
  action: string;
  resource?: string;
  effect: 'ALLOW' | 'DENY' | 'allow' | 'deny';
  condition?: Condition;
  fields?: string[];
}
