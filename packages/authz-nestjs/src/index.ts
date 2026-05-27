export { createAuthz, policy } from '@vynelix/authz-core';

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Module,
  DynamicModule,
  SetMetadata,
  Global,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationEngine, AuthzContext, Decision, RequestCache } from '@vynelix/authz-core';

export interface AuthorizeMetadata {
  action: string;
  resource?: string | ((req: any) => any);
  extractor?: (req: any) => any;
  debug?: boolean;
  onPreAuth?: (ctx: AuthzContext) => void | Promise<void>;
  onPostAuth?: (ctx: AuthzContext, decision: Decision | boolean) => void | Promise<void>;
}

export const AUTHORIZE_KEY = 'vynelix_authz_authorize';
export const Authorize = (metadata: AuthorizeMetadata) => SetMetadata(AUTHORIZE_KEY, metadata);

@Injectable()
export class AuthzGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private reflector: Reflector,
    @Inject('AUTHZ_ENGINE') private engine: AuthorizationEngine,
    @Inject('AUTHZ_OPTIONS') private options: {
      useCache?: boolean;
      extractor?: (req: any) => any;
      defaultDebug?: boolean;
    }
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<AuthorizeMetadata>(AUTHORIZE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = metadata.extractor
      ? metadata.extractor(request)
      : this.options.extractor
        ? this.options.extractor(request)
        : request.user;

    if (!user) {
      throw new UnauthorizedException('Unauthorized: No user found');
    }

    let resource = undefined;
    if (typeof metadata.resource === 'function') {
      resource = await metadata.resource(request);
    } else if (typeof metadata.resource === 'string') {
      resource = { type: metadata.resource };
    }

    const ctx: AuthzContext = {
      user,
      resource,
      action: metadata.action,
      meta: { request, context },
    };

    // Per-request Cache setup
    if (this.options.useCache !== false && !request.authzCache) {
      request.authzCache = new RequestCache();
    }
    const cache = request.authzCache;

    // Pre-auth hook
    if (metadata.onPreAuth) {
      await metadata.onPreAuth(ctx);
    }

    let decision: boolean | Decision;
    const isDebug = metadata.debug ?? this.options.defaultDebug;

    if (isDebug) {
      decision = (await this.engine.can(ctx, { debug: true, cache })) as Decision;
      request.authzDecision = decision;

      // Post-auth hook
      if (metadata.onPostAuth) {
        await metadata.onPostAuth(ctx, decision);
      }

      if (!decision.allowed) {
        throw new ForbiddenException({ error: 'Forbidden', decision });
      }
    } else {
      decision = (await this.engine.can(ctx, { cache })) as boolean;

      // Post-auth hook
      if (metadata.onPostAuth) {
        await metadata.onPostAuth(ctx, decision);
      }

      if (!decision) {
        throw new ForbiddenException('Forbidden');
      }
    }

    return true;
  }
}

export interface AuthzModuleOptions {
  engine: AuthorizationEngine;
  extractor?: (req: any) => any;
  defaultDebug?: boolean;
  useCache?: boolean;
}

@Global()
@Module({})
export class AuthzModule {
  static forRoot(options: AuthzModuleOptions): DynamicModule {
    return {
      module: AuthzModule,
      providers: [
        {
          provide: 'AUTHZ_ENGINE',
          useValue: options.engine,
        },
        {
          provide: 'AUTHZ_OPTIONS',
          useValue: {
            useCache: options.useCache ?? true,
            extractor: options.extractor,
            defaultDebug: options.defaultDebug
          },
        },
        AuthzGuard,
      ],
      exports: ['AUTHZ_ENGINE', 'AUTHZ_OPTIONS', AuthzGuard],
    };
  }
}
