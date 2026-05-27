"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const authz_core_1 = require("@vynelix/authz-core");
const authz_nestjs_1 = require("@vynelix/authz-nestjs");
const engine = (0, authz_core_1.createAuthz)({
    roles: {
        user: { can: ['post.read'] },
        admin: { can: ['*'] }
    },
    policies: [
        (0, authz_core_1.policy)('post.update')
            .on('post')
            .when((ctx) => ctx.user.id === ctx.resource?.ownerId)
            .build(),
    ]
});
let PostController = class PostController {
    // @Authorize({ action: 'post.read', debug: true })
    getPosts(req) {
        return { message: 'List of posts', decision: req.authzDecision };
    }
    updatePost(req) {
        // In a real app, you'd load the post, check ownership, and inject it into Request.
        // For now we mock the ownership check by assuming it matches.
        return { message: 'Post updated', decision: req.authzDecision };
    }
};
__decorate([
    (0, common_1.Get)()
    // @Authorize({ action: 'post.read', debug: true })
    ,
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PostController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, authz_nestjs_1.Authorize)({ action: 'post.update', resource: 'post', debug: true }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PostController.prototype, "updatePost", null);
PostController = __decorate([
    (0, common_1.Controller)('posts'),
    (0, common_1.UseGuards)(authz_nestjs_1.AuthzGuard)
], PostController);
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            authz_nestjs_1.AuthzModule.forRoot({
                engine,
                extractor: (req) => {
                    // Mock Auth
                    const role = req.headers['x-role'] || 'guest';
                    const id = req.headers['x-user-id'] || 'user-1';
                    return { id, roles: [role] };
                },
                defaultDebug: true
            }),
        ],
        controllers: [PostController],
    })
], AppModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(AppModule);
    await app.listen(3002);
    console.log('NestJS app running on port 3002');
}
bootstrap();
