# `@b2b-saas-starter-kit/platform`

Backend capability **ports** — interfaces only. Adapters live in `packages/infrastructure/*`. In-memory fakes for use-case tests live in `packages/application/src/testing` (`@b2b-saas-starter-kit/application/testing`).

**Path:** `packages/platform`  
**Nx project:** `platform`  
**Tags:** `scope:backend`, `layer:platform`

## Purpose

Give application, infrastructure, and the HTTP/worker edge a shared, technology-agnostic contract for transactions, tenant scope, time, IDs, and logging.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), [`docs/architecture/persistence.md`](../../docs/architecture/persistence.md), [`docs/architecture/multi-tenancy.md`](../../docs/architecture/multi-tenancy.md).

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- `node:` builtins

Never import Nest, TypeORM, Redis, `domain`, `application`, `contracts`, `utils`, `config`, or infrastructure.

## Who consumes vs who implements

| Port            | Consumes                                         | Implements                                      |
| --------------- | ------------------------------------------------ | ----------------------------------------------- |
| `UnitOfWork`    | Application use cases                            | `infrastructure/postgres` (`TypeormUnitOfWork`) |
| `TenantContext` | Edge sets via `run`; infra reads via getters     | `infrastructure/postgres` (`AlsTenantContext`)  |
| `Clock`         | Application (pass `now()` into domain factories) | `infrastructure/postgres` (`SystemClock`)       |
| `IdGenerator`   | Application (`UserId.parse(ids.generate())`)     | `infrastructure/postgres` (`UuidV7IdGenerator`) |
| `Logger`        | Application / edge via `getLogger()`             | `infrastructure/logger` (`PinoLogger`)          |

Domain never imports this package.

## Semantics

- **`UnitOfWork.run`** opens a transaction and passes an opaque `TxContext` (`{id}`). Use cases typically ignore `ctx`. Repositories join the **ambient** transaction inside the adapter — they do not take `EntityManager` or `TxContext` on domain port signatures.
- **`TenantContext`** is fail-closed: `getTenantId()` / `getActorId()` throw `TenantContextNotEstablishedError` when no `run` scope is active. First-tenant and admin paths call `withoutTenantScope(work)` (writes still require `tenantId` on the row).
- **`Clock.now()`** is a UTC instant.
- **`IdGenerator.generate()`** returns a raw string. Branding happens in application.
- **`Logger`** is a process locator, not Nest DI: `initLogger(impl)` at bootstrap, `getLogger()` at call sites, `resetLogger()` in tests. `getLogger()` throws `LoggerNotInitializedError` when unset (no silent no-op). Domain does not log.

```typescript
import type {Clock, IdGenerator, TenantContext, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

await tenantContext.run({tenantId, actorId}, async () => {
  return uow.run(async () => {
    const id = UserId.parse(ids.generate())
    const occurredAt = clock.now()
    // …
  })
})
```

## API

| Export                                     | Role                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `UnitOfWork`                               | `run(work)` transaction boundary                                      |
| `TxContext`                                | Opaque `{id}` — no persistence types                                  |
| `TenantContext`                            | `run(scope, work)` + `withoutTenantScope(work)` + fail-closed getters |
| `TenantScope`                              | `{tenantId, actorId}`                                                 |
| `TenantContextNotEstablishedError`         | Thrown when getters are called outside a scope                        |
| `Clock`                                    | `now(): Date` (UTC)                                                   |
| `IdGenerator`                              | `generate(): string`                                                  |
| `Logger` / `LogLevel`                      | `context(name)` + pino-style level methods                            |
| `initLogger` / `getLogger` / `resetLogger` | Process locator (overwrite on init; throw if unset)                   |
| `LoggerNotInitializedError`                | Thrown by `getLogger()` before `initLogger`                           |

## Must not go here yet

- `CachePort` / `LockPort` / `PubSubPort` (Redis phase)
- Nest injection tokens, ALS adapters, TypeORM `UnitOfWork` — those live in `packages/infrastructure/postgres`
- Pino adapter — `packages/infrastructure/logger`
- In-memory test doubles (`packages/application/src/testing`)

## Commands

```bash
pnpm nx run platform:typecheck
pnpm nx run platform:test
pnpm nx run platform:lint
```

## Phase 3 Definition of Done

- [x] Package at `packages/platform` with tags `scope:backend`, `layer:platform`
- [x] `UnitOfWork`, `TxContext`, `TenantContext`, `Clock`, `IdGenerator`
- [x] Depends only on `@b2b-saas-starter-kit/shared-kernel-types`
- [x] Platform-purity `no-restricted-imports` enabled
- [x] Surface locked by in-memory-shaped fakes + fail-closed getter test

## Phase 9 Definition of Done

- [x] `Logger` port + `LogLevel`
- [x] `initLogger` / `getLogger` / `resetLogger` process locator (no Nest, no no-op default)
- [x] `LoggerNotInitializedError` with stable `code`
- [x] Locator unit tests (unset / init / overwrite / reset)
