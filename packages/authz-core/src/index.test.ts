import { describe, it, expect } from 'vitest';
import { createAuthz, policy, defineResources } from './index.js';

describe('AuthZ Core Engine', () => {
  const resources = defineResources({
    post: ['read', 'create', 'update', 'delete'],
  });

  const roles = {
    guest: { can: ['post.read'] },
    user: { inherits: ['guest'], can: ['post.create'] },
    editor: { inherits: ['user'], can: ['post.update'] },
    admin: { can: ['*'] },
    multiple: { inherits: ['guest', 'user'], can: ['other.action'] }
  };

  const policies = [
    policy('post.update')
      .on('post')
      .when((ctx) => ctx.user.id === ctx.resource?.ownerId)
      .build(),
    policy('post.delete')
      .deny()
      .when((ctx) => ctx.resource?.locked === true)
      .build()
  ];

  const authz = createAuthz({ roles, policies });

  it('should allow guest to read post', async () => {
    const ctx = {
      user: { id: '1', roles: ['guest'] },
      action: 'post.read',
    };
    expect(await authz.can(ctx)).toBe(true);
  });

  it('should allow user (inherited) to read post', async () => {
    const ctx = {
      user: { id: '1', roles: ['user'] },
      action: 'post.read',
    };
    expect(await authz.can(ctx)).toBe(true);
  });

  it('should allow editor to update their own post', async () => {
    const ctx = {
      user: { id: 'owner-1', roles: ['editor'] },
      resource: { type: 'post', ownerId: 'owner-1' },
      action: 'post.update',
    };
    expect(await authz.can(ctx)).toBe(true);
  });

  it('should deny editor from updating others post', async () => {
    const ctx = {
      user: { id: 'other', roles: ['editor'] },
      resource: { type: 'post', ownerId: 'owner-1' },
      action: 'post.update',
    };
    expect(await authz.can(ctx)).toBe(false);
  });

  it('should respect DENY policies even for admin', async () => {
    const ctx = {
      user: { id: 'admin-1', roles: ['admin'] },
      resource: { type: 'post', locked: true },
      action: 'post.delete',
    };
    expect(await authz.can(ctx)).toBe(false);
  });

  it('should throw on circular dependencies', () => {
    const circularRoles = {
      roleA: { inherits: ['roleB'], can: ['actionA'] },
      roleB: { inherits: ['roleA'], can: ['actionB'] },
    };
    expect(() => createAuthz({ roles: circularRoles })).toThrow(/Circular dependency/);
  });

  it('should support multiple inheritance', async () => {
    const ctx = {
      user: { id: '1', roles: ['multiple'] },
      action: 'post.create',
    };
    expect(await authz.can(ctx)).toBe(true);
  });
});
