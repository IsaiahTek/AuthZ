import { Bench } from 'tinybench';
import { createAuthz, policy, RequestCache } from './index.js';

async function runBenchmarks() {
  const bench = new Bench({ time: 1000 });

  // Setup complex configuration
  const roles: any = {};
  for (let i = 0; i < 100; i++) {
    roles[`role_${i}`] = {
      inherits: i > 0 ? [`role_${i - 1}`] : [],
      can: [`permission_${i}`, `action.*`],
    };
  }

  const policies = [];
  for (let i = 0; i < 100; i++) {
    policies.push(
      policy(`action.${i}`)
        .on('resource')
        .when((ctx) => ctx.user.id === 'admin')
        .build()
    );
  }

  const authz = createAuthz({ roles, policies });
  const ctx = {
    user: { id: 'user_1', roles: ['role_99'] },
    action: 'action.50',
    resource: { type: 'resource', id: 'res_1' },
  };

  const cache = new RequestCache();

  bench
    .add('RBAC Only (Deep inheritance)', async () => {
      await authz.can({ ...ctx, action: 'permission_0' });
    })
    .add('PBAC Only (Indexed)', async () => {
      await authz.can({ ...ctx, action: 'action.50', user: { id: 'admin', roles: [] } });
    })
    .add('Combined Check (No Cache)', async () => {
      await authz.can(ctx);
    })
    .add('Combined Check (With Cache Hit)', async () => {
      await authz.can(ctx, { cache });
    });

  await bench.run();

  console.table(bench.table());
}

runBenchmarks().catch(console.error);
