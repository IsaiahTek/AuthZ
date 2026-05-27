import { describe, it, expect, vi } from 'vitest';
import { AuthzGuard } from './index.js';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

describe('NestJS Adapter', () => {
  const mockEngine = { can: vi.fn() } as any;
  
  const createMockContext = (handlerMeta: any, req: any = {}) => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any);

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  } as any;

  it('should pass through if no Authorize metadata is present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const guard = new AuthzGuard(mockReflector, mockEngine, { engine: mockEngine });
    
    const result = await guard.canActivate(createMockContext(undefined));
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if no user is found', async () => {
    mockReflector.getAllAndOverride.mockReturnValue({ action: 'test' });
    const guard = new AuthzGuard(mockReflector, mockEngine, { engine: mockEngine });
    
    await expect(guard.canActivate(createMockContext({}, {}))).rejects.toThrow(UnauthorizedException);
  });

  it('should return true if engine allows', async () => {
    mockReflector.getAllAndOverride.mockReturnValue({ action: 'test' });
    mockEngine.can.mockResolvedValue(true);
    const guard = new AuthzGuard(mockReflector, mockEngine, { engine: mockEngine });
    
    const result = await guard.canActivate(createMockContext({}, { user: { id: 'usr_1' } }));
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if engine denies', async () => {
    mockReflector.getAllAndOverride.mockReturnValue({ action: 'test' });
    mockEngine.can.mockResolvedValue(false);
    const guard = new AuthzGuard(mockReflector, mockEngine, { engine: mockEngine });
    
    await expect(guard.canActivate(createMockContext({}, { user: { id: 'usr_1' } }))).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException containing decision if debug is true', async () => {
    mockReflector.getAllAndOverride.mockReturnValue({ action: 'test', debug: true });
    const decision = { allowed: false, reason: 'Bad policy' };
    mockEngine.can.mockResolvedValue(decision);
    const guard = new AuthzGuard(mockReflector, mockEngine, { engine: mockEngine });
    
    try {
      await guard.canActivate(createMockContext({}, { user: { id: 'usr_1' } }));
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse()).toEqual({ error: 'Forbidden', decision });
    }
  });
});
