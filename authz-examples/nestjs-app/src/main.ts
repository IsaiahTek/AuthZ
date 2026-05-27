import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module, Put, UseGuards, Req } from '@nestjs/common';
import { createAuthz, policy } from '@vynelix/authz-core';
import { AuthzModule, Authorize, AuthzGuard } from '@vynelix/authz-nestjs';

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

@Controller('posts')
@UseGuards(AuthzGuard)
class PostController {
  @Get()
  @Authorize({ action: 'post.read', debug: true })
  getPosts(@Req() req: any) {
    console.log("Headers: ", req.headers);
    return { message: 'List of posts', decision: req.authzDecision };
  }

  @Put(':id')
  @Authorize({ action: 'post.update', resource: 'post', debug: true })
  updatePost(@Req() req: any) {
    // In a real app, you'd load the post, check ownership, and inject it into Request.
    // For now we mock the ownership check by assuming it matches.
    return { message: 'Post updated', decision: req.authzDecision };
  }
}

@Module({
  imports: [
    AuthzModule.forRoot({
      engine,
      extractor: (req) => {
        // Mock Auth
        const role = req.headers['x-role'] as string || 'guest';
        const id = req.headers['x-user-id'] as string || 'user-1';
        return { id, roles: [role] };
      },
      defaultDebug: true
    }),
  ],
  controllers: [PostController],
})
class AppModule { }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3002);
  console.log('NestJS app running on port 3002');
}
bootstrap();
