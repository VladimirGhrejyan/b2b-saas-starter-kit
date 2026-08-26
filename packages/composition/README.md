# `@b2b-saas-starter-kit/composition`

Nest composition root: per-context modules bind ports to postgres adapters and register use cases.

**Path:** `packages/composition`  
**Nx project:** `composition`  
**Tags:** `scope:backend`, `layer:composition`

`apps/api` imports this package instead of `application` or `postgres`.

## Allowed imports

- `@b2b-saas-starter-kit/domain`, `application`, `postgres`, `platform`, `shared-kernel-types`, `config`, `utils`
- `@nestjs/common`, `@nestjs/core`

Never import `contracts`, `nest-http`, `logger`, `pino`, or `nestjs-zod`.
