# `@b2b-saas-starter-kit/logger`

Pino adapter for the platform `Logger` port. Process-wide: bootstrap calls `initLogger(new PinoLogger(…))`; application code calls `getLogger()`.

**Path:** `packages/infrastructure/logger`  
**Nx project:** `logger`  
**Tags:** `scope:backend`, `layer:infrastructure`, `layer:logger`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Purpose

Wrap `pino` (and `pino.child({context})`) behind the platform locator so application never imports Pino. The extra `layer:logger` tag lets `type:app` bootstrap this package without opening `postgres`.

Not a Nest provider. Do not add `@Injectable()`, `@Inject(Logger)`, or `nestjs-pino`.

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `pino`, `pino-pretty`
- `node:` builtins

Never import Nest, domain, application, contracts, TypeORM, or other infrastructure packages.

## Bootstrap

Do **not** call this from `apps/api` until the HTTP composition phase. When that lands:

```typescript
import {PinoLogger} from '@b2b-saas-starter-kit/logger'
import {initLogger} from '@b2b-saas-starter-kit/platform'

initLogger(new PinoLogger({level: 'info', isPretty: false}))
```

Defaults: `level: 'info'`, `isPretty: false`. Pretty-print uses `pino-pretty` only when `isPretty: true`. `Error` as the first argument is serialized as `{err}`. `req.headers.authorization` / `Authorization` are redacted.

## Commands

```bash
pnpm nx run logger:lint
pnpm nx run logger:typecheck
pnpm nx run logger:test
```

## Phase 9 Definition of Done

- [x] Package at `packages/infrastructure/logger` with tags `scope:backend`, `layer:infrastructure`, `layer:logger`
- [x] Depends on `platform` + `pino` / `pino-pretty` only (no Nest)
- [x] `PinoLogger` implements `Logger` with one private `log` method and `pino.child({context})`
- [x] Default level `info`; `Error` → `{err}`; redact authorization headers
- [x] Unit tests: level filtering, context, `err`, redact
