import { describe, it, expect, vi } from 'vitest';
import { RequestCache } from '@vynelix/authz-core';
import { createAuthz, NodeAuthzEngine } from './index.js';

describe('authz-node: NodeAuthzEngine', () => {
  const roles = {
    viewer: { can: ['post.read'] },
    editor: { inherits: ['viewer'], can: ['post.update'] },
    admin:  { can: ['*'] },
  };

  const engine = createAuthz({ roles });

  // -------------------------------------------------------------------------
  // createRequestCache()
  // -------------------------------------------------------------------------
  it('should create a fresh RequestCache instance', () => {
    const cache = engine.createRequestCache();
    expect(cache).toBeInstanceOf(RequestCache);
  });

  it('should return distinct cache instances each time', () => {
    const a = engine.createRequestCache();
    const b = engine.createRequestCache();
    expect(a).not.toBe(b);
  });

  // -------------------------------------------------------------------------
  // createAuthz() factory
  // -------------------------------------------------------------------------
  it('should return a NodeAuthzEngine from createAuthz()', () => {
    expect(engine).toBeInstanceOf(NodeAuthzEngine);
  });

  // -------------------------------------------------------------------------
  // can()
  // -------------------------------------------------------------------------
  it('should allow authorized action', async () => {
    const allowed = await engine.can({
      user: { id: 'u1', roles: ['editor'] },
      action: 'post.read',
    });
    expect(allowed).toBe(true);
  });

  it('should deny unauthorized action', async () => {
    const allowed = await engine.can({
      user: { id: 'u1', roles: ['viewer'] },
      action: 'post.update',
    });
    expect(allowed).toBe(false);
  });

  it('should allow admin wildcard action', async () => {
    const allowed = await engine.can({
      user: { id: 'u1', roles: ['admin'] },
      action: 'anything.goes',
    });
    expect(allowed).toBe(true);
  });

  it('should return a Decision object when debug: true is provided', async () => {
    const decision = await engine.can(
      { user: { id: 'u1', roles: ['viewer'] }, action: 'post.read' },
      { debug: true }
    ) as any;
    expect(decision).toHaveProperty('allowed', true);
    expect(decision).toHaveProperty('reason');
  });

  it('should use the cache to memoize results', async () => {
    const cache = engine.createRequestCache();
    const ctx = { user: { id: 'u1', roles: ['editor'] }, action: 'post.update' };

    // First call — compute result and store in cache
    const result1 = await engine.can(ctx, { cache });

    // Manually inspect cache — should have a value set
    const cacheKey = `u1:post.update:no-resource-id`;
    expect(cache.get(cacheKey)).toBe(true);

    // Second call — must return same result
    const result2 = await engine.can(ctx, { cache });
    expect(result1).toBe(result2);
  });

  // -------------------------------------------------------------------------
  // explain()
  // -------------------------------------------------------------------------
  it('should return a Decision with explanation for allowed action', async () => {
    const decision = await engine.explain({
      user: { id: 'u1', roles: ['editor'] },
      action: 'post.update',
    });
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBeDefined();
  });

  it('should return a Decision with explanation for denied action', async () => {
    const decision = await engine.explain({
      user: { id: 'u1', roles: ['viewer'] },
      action: 'post.delete',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/Denied/i);
  });
});
