import express, { Request } from 'express';
import { createAuthz, policy, AuthzContext, Decision } from '@vynelix/authz-core';
import { authorize } from '@vynelix/authz-express';

const app = express();

const engine = createAuthz({
  roles: {
    user: { can: ['post.read'] },
    admin: { can: ['*'] }
  },
  policies: [
    policy('post.update')
      .on('post')
      .when((ctx: AuthzContext) => ctx.user.id === ctx.resource?.ownerId)
      .build(),
    // Demonstrate JSON-based policy
    {
      action: 'post.delete',
      resource: 'post',
      effect: 'allow',
      condition: { op: 'equals', path: 'user.id', value: 'admin-1' }
    }
  ]
});

// Mock Auth Middleware
app.use((req, res, next) => {
  const role = req.headers['x-role'] as string || 'user';
  const id = req.headers['x-user-id'] as string || 'user-1';
  (req as any).user = { id, roles: [role] };
  next();
});

// RBAC + PBAC check with hooks and cache
app.put(
  '/posts/:id',
  authorize(engine, {
    action: 'post.update',
    resource: (req: Request) => ({ type: 'post', id: req.params.id, ownerId: 'user-1' }),
    useCache: true, // Internal O(1) repeat check
    debug: true,
    onPreAuth: (ctx: AuthzContext) => console.log(`[Audit] Checking ${ctx.action}...`),
    onPostAuth: (ctx: AuthzContext, decision: Decision | boolean) => {
      const status = typeof decision === 'boolean' ? decision : decision.allowed;
      console.log(`[Audit] ${ctx.user.id} ${status ? 'ALLOWED' : 'DENIED'} ${ctx.action}`);
    }
  }),
  (req, res) => {
    res.json({ message: 'Post updated', decision: (req as any).authzDecision });
  }
);

app.listen(3000, () => {
  console.log('Express app running on port 3000');
  console.log('Try: curl -H "x-user-id: user-1" -X PUT http://localhost:3000/posts/123');
});
