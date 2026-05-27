import { Request, Response, NextFunction } from 'express';
import { AuthorizationEngine, AuthzContext, Decision, RequestCache } from '@vynelix/authz-core';

export interface AuthorizeOptions {
  action: string;
  resource?: string | ((req: Request) => any);
  extractor?: (req: Request) => any;
  debug?: boolean;
  onPreAuth?: (ctx: AuthzContext) => void | Promise<void>;
  onPostAuth?: (ctx: AuthzContext, decision: Decision | boolean) => void | Promise<void>;
  useCache?: boolean;
}

export const authorize = (engine: AuthorizationEngine, options: AuthorizeOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = options.extractor ? options.extractor(req) : (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: No user found' });
      }

      let resource = undefined;
      if (typeof options.resource === 'function') {
        resource = await options.resource(req);
      } else if (typeof options.resource === 'string') {
        resource = { type: options.resource };
      }

      const ctx: AuthzContext = {
        user,
        resource,
        action: options.action,
        meta: { req },
      };

      // Per-request Cache setup
      if (options.useCache !== false && !(req as any).authzCache) {
        (req as any).authzCache = new RequestCache();
      }
      const cache = (req as any).authzCache;

      // Pre-auth hook
      if (options.onPreAuth) {
        await options.onPreAuth(ctx);
      }

      let decision: boolean | Decision;

      if (options.debug) {
        decision = (await engine.can(ctx, { debug: true, cache })) as Decision;
        (req as any).authzDecision = decision;
        
        // Post-auth hook
        if (options.onPostAuth) {
          await options.onPostAuth(ctx, decision);
        }

        if (!decision.allowed) {
          return res.status(403).json({ error: 'Forbidden', decision });
        }
      } else {
        decision = (await engine.can(ctx, { cache })) as boolean;
        
        // Post-auth hook
        if (options.onPostAuth) {
          await options.onPostAuth(ctx, decision);
        }

        if (!decision) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
