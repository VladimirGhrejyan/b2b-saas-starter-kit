# `@b2b-saas-starter-kit/messaging`

BullMQ queues and a dedicated blocking ioredis connection. Composition wires this package; `apps/worker` must not import it.

**Path:** `packages/infrastructure/messaging`  
**Nx project:** `messaging`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  kernel/  # config, blocking client, Nest module, queue names, tokens
  jobs/    # JobScheduler, QueueWorkerFactory, default job options, worker observability
```

The command Redis client in `@b2b-saas-starter-kit/redis` stays on `maxRetriesPerRequest: 1`. This package owns a **separate** connection (`maxRetriesPerRequest: null`, `enableOfflineQueue: true`, no cache `keyPrefix`). BullMQ prefix defaults to `bsk:bull`.

Queues: `maintenance` (repeatable cleanup) and `outbox` (claimed domain events). Processors live in composition.

Both queues use shared `DefaultJobOptions`: 3 attempts with exponential backoff, `removeOnComplete` (`age` 1h, `count` 1000), `removeOnFail` (`age` 1 day). `QueueWorkerFactory` logs `error` / `stalled` / `failed` (`job exhausted` on the last attempt).

Redis is ephemeral — outbox rows stay the system of record. Do not mark an outbox row processed at enqueue time.

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `@b2b-saas-starter-kit/config`
- `bullmq`, `ioredis`, `@nestjs/common`, `zod`
- `node:` builtins

Never import domain, application, contracts, TypeORM, or other infrastructure packages.

## Commands

```bash
pnpm nx run messaging:lint
pnpm nx run messaging:typecheck
pnpm nx run messaging:test
```
