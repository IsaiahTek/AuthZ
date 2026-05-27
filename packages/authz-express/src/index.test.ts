import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorize } from './index.js';
import { Request, Response } from 'express';

describe('Express Adapter', () => {
  const mockEngine = {
    can: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no user is found', async () => {
    const middleware = authorize(mockEngine, { action: 'post.read' });
    const req = {} as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No user found' });
  });

  it('should successfully pass if engine allows', async () => {
    mockEngine.can.mockResolvedValue(true);
    const middleware = authorize(mockEngine, { action: 'post.read' });
    
    const req = { user: { id: 'usr_1' } } as any;
    const res = {} as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if engine denies', async () => {
    mockEngine.can.mockResolvedValue(false);
    const middleware = authorize(mockEngine, { action: 'post.update' });
    
    const req = { user: { id: 'usr_1' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should extract user context overriding default', async () => {
    mockEngine.can.mockResolvedValue(true);
    const middleware = authorize(mockEngine, { 
      action: 'post.read',
      extractor: (r) => ({ id: r.headers['x-user-id'] as string }),
    });
    
    const req = { headers: { 'x-user-id': 'custom_1' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(mockEngine.can).toHaveBeenLastCalledWith(
      expect.objectContaining({ user: { id: 'custom_1' } }),
      expect.objectContaining({ cache: expect.any(Object) })
    );
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 with decision trace when debug is true', async () => {
    const decision = { allowed: false, reason: 'Bad policy' };
    mockEngine.can.mockResolvedValue(decision);
    
    const middleware = authorize(mockEngine, { action: 'post.delete', debug: true });
    
    const req = { user: { id: 'usr_1' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden', decision });
  });
});
