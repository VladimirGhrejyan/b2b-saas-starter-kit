# `@b2b-saas-starter-kit/nest-http`

Nest HTTP delivery kit: `ApiBuilder`, global pipe/filter/interceptor, Swagger, CORS, URI versioning, `@Public()`, `@ApiRoute()`, process error handlers.

**Path:** `packages/nest-http`  
**Nx project:** `nest-http`  
**Tags:** `scope:backend`, `layer:nest-http`

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), ADR-028 / ADR-029 in [`docs/architecture/decisions.md`](../../docs/architecture/decisions.md).

## Purpose

Reusable HTTP bootstrap for Nest apps. **Not** composition (no port→adapter modules). **Not** domain. Logging goes through `LoggerLocator.get()`.

Apps import HTTP helpers from this package. **Do not import `nestjs-zod` in `apps/`.**

Do **not** call this from `apps/api` until the composition phase.

## Allowed imports

- `@b2b-saas-starter-kit/contracts`
- `@b2b-saas-starter-kit/platform`
- `@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`, `@nestjs/platform-express`, `@nestjs/serve-static`
- `helmet`, `nestjs-zod`, `zod`

Never import `domain`, `application`, `postgres`, `@b2b-saas-starter-kit/logger`, `pino`, or `composition`.

## Bootstrap (Phase 11 — do not wire `apps/api` yet)

```typescript
import {NestFactory} from '@nestjs/core'
import {ApiBuilder, createHttpProviders, ServeStatic} from '@b2b-saas-starter-kit/nest-http'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

@Module({
  imports: [ServeStatic.forRoot(apiHttpConfig.staticAssets)],
  providers: [...createHttpProviders()],
})
class AppModule {}

const app = await NestFactory.create(AppModule)
await new ApiBuilder(app, apiHttpConfig)
  .useSecurity()
  .enableCors()
  .enableVersioning()
  .useGlobalPrefix()
  .enableShutdownHooks()
  .setupSwagger()
  .listen()
```

`createHttpProviders()` registers `ApiValidationPipe`, `ApiExceptionFilter`, and `ApiSerializerInterceptor`. CORS throws when `isProduction` is true and `corsOrigins` is empty. Helmet is skipped when `isPlainHttp` is true. URI versioning defaults to `'1'`.

`OpenApi.setup` (via `ApiBuilder.setupSwagger`) mounts Swagger UI, optional basic-auth (including `/docs-json` and `/docs-yaml`), bearer auth, and writes `openapi.json` into the static directory when `staticAssets` or `swagger.schema` is set.

## Contracts in controllers

```typescript
import {HttpMethod, HttpStatus, InviteMemberInputSchema} from '@b2b-saas-starter-kit/contracts'
import {ApiErrorResponses, ApiRoute, createZodDto, Response} from '@b2b-saas-starter-kit/nest-http'

export class InviteMemberInputDto extends createZodDto(InviteMemberInputSchema) {}

@ApiRoute({method: HttpMethod.POST, path: 'invites', summary: 'Invite a member', operationId: 'inviteMember'})
@Response({status: HttpStatus.CREATED, description: 'Created membership', type: MembershipOutputDto})
@ApiErrorResponses([
  {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
  {status: HttpStatus.FORBIDDEN, description: 'Missing permission to invite members'},
])
async invite(@Body() body: InviteMemberInputDto) {}
```

## Commands

```bash
pnpm nx run nest-http:lint
pnpm nx run nest-http:typecheck
pnpm nx run nest-http:test
```
