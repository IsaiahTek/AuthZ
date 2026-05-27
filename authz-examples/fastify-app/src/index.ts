import Fastify from 'fastify';
import { createAuthz, policy } from '@vynelix/authz-core';
import { fastifyAuthz } from '@vynelix/authz-fastify';

const fastify = Fastify({ logger: true });

const engine = createAuthz({
  roles: {
    user: { can: ['post.read'] },
    admin: { can: ['*'] }
  },
  policies: [
    policy('post.update')
      .on('post')
      .when((ctx) => ctx.user.id === ctx.resource?.ownerId)
      .build(),
  ]
});

// Mock Auth
fastify.addHook('preHandler', async (request, reply) => {
  const role = request.headers['x-role'] as string || 'guest';
  const id = request.headers['x-user-id'] as string || 'user-1';
  request.user = { id, roles: [role] };
});

fastify.register(fastifyAuthz, { engine });

fastify.after(() => {
  fastify.get('/posts', {
    preHandler: fastify.authorize({ action: 'post.read', debug: true })
  }, async (request, reply) => {
    return { message: 'List of posts', decision: request.authzDecision };
  });

  fastify.put('/posts/:id', {
    preHandler: fastify.authorize({ 
      action: 'post.update', 
      resource: () => ({ type: 'post', ownerId: 'user-1' }),
      debug: true 
    })
  }, async (request, reply) => {
    return { message: 'Post updated', decision: request.authzDecision };
  });
});

fastify.listen({ port: 3001 }, (err) => {
  if (err) throw err;
  console.log('Fastify app running on port 3001');
});
