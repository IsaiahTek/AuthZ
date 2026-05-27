import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import { AuthorizationEngine, AuthzContext, Decision, RequestCache } from '@vynelix/authz-core';

export interface AuthzPluginOptions {
  engine: AuthorizationEngine;
  useCache?: boolean;
}

export interface AuthorizeOptions {
  action: string;
  resource?: string | ((req: FastifyRequest) => any);
  extractor?: (req: FastifyRequest) => any;
  debug?: boolean;
  onPreAuth?: (ctx: AuthzContext) => void | Promise<void>;
  onPostAuth?: (ctx: AuthzContext, decision: Decision | boolean) => void | Promise<void>;
}

declare module 'fastify' {
  interface FastifyInstance {
    authorize(options: AuthorizeOptions): (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authzPlugin: FastifyPluginAsync<AuthzPluginOptions> = async (fastify, options) => {
  const { engine, useCache = true } = options;

  fastify.decorate('authorize', (authOptions: AuthorizeOptions) => {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      const user = authOptions.extractor ? authOptions.extractor(req) : (req as any).user;

      if (!user) {
        reply.status(401).send({ error: 'Unauthorized: No user found' });
        return;
      }

      let resource = undefined;
      if (typeof authOptions.resource === 'function') {
        resource = await authOptions.resource(req);
      } else if (typeof authOptions.resource === 'string') {
        resource = { type: authOptions.resource };
      }

      const ctx: AuthzContext = {
        user,
        resource,
        action: authOptions.action,
        meta: { req },
      };

      // Per-request Cache setup
      if (useCache && !(req as any).authzCache) {
        (req as any).authzCache = new RequestCache();
      }
      const cache = (req as any).authzCache;

      // Pre-auth hook
      if (authOptions.onPreAuth) {
        await authOptions.onPreAuth(ctx);
      }

      let decision: boolean | Decision;

      if (authOptions.debug) {
        decision = (await engine.can(ctx, { debug: true, cache })) as Decision;
        (req as any).authzDecision = decision;

        // Post-auth hook
        if (authOptions.onPostAuth) {
          await authOptions.onPostAuth(ctx, decision);
        }

        if (!decision.allowed) {
          reply.status(403).send({ error: 'Forbidden', decision });
          return;
        }
      } else {
        decision = (await engine.can(ctx, { cache })) as boolean;

        // Post-auth hook
        if (authOptions.onPostAuth) {
          await authOptions.onPostAuth(ctx, decision);
        }

        if (!decision) {
          reply.status(403).send({ error: 'Forbidden' });
          return;
        }
      }
    };
  });
};

export const fastifyAuthz = fp(authzPlugin, {
  name: '@vynelix/authz-fastify',
  fastify: '4.x',
});
