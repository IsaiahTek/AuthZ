import { describe, it, expect, vi } from 'vitest';
import Fastify from 'fastify';
import { fastifyAuthz } from './index.js';

describe('Fastify Adapter', () => {
  const mockEngine = {
    can: vi.fn(),
  } as any;

  it('should return 401 if no user is found', async () => {
    const app = Fastify();
    await app.register(fastifyAuthz, { engine: mockEngine });
    
    app.get('/test', { preHandler: app.authorize({ action: 'test' }) }, () => 'ok');

    const res = await app.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(401);
  });

  it('should successfully pass if engine allows', async () => {
    mockEngine.can.mockResolvedValue(true);
    const app = Fastify();
    await app.register(fastifyAuthz, { engine: mockEngine });
    
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (req) => { req.user = { id: 'usr_1' }; });
    app.get('/test', { preHandler: app.authorize({ action: 'test' }) }, () => 'ok');

    const res = await app.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toBe('ok');
  });

  it('should return 403 if engine denies', async () => {
    mockEngine.can.mockResolvedValue(false);
    const app = Fastify();
    await app.register(fastifyAuthz, { engine: mockEngine });
    
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (req) => { req.user = { id: 'usr_1' }; });
    app.get('/test', { preHandler: app.authorize({ action: 'test' }) }, () => 'ok');

    const res = await app.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(403);
  });

  it('should return 403 with decision trace when debug is true', async () => {
    mockEngine.can.mockResolvedValue({ allowed: false, reason: 'Bad policy' });
    const app = Fastify();
    await app.register(fastifyAuthz, { engine: mockEngine });
    
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (req) => { req.user = { id: 'usr_1' }; });
    app.get('/test', { preHandler: app.authorize({ action: 'test', debug: true }) }, () => 'ok');

    const res = await app.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(403);
    const data = JSON.parse(res.payload);
    expect(data.decision.reason).toBe('Bad policy');
  });
});
