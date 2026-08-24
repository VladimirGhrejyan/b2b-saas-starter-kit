# `@b2b-saas-starter-kit/platform`

Backend capability **ports** — interfaces only. Adapters live in `infrastructure-*`. In-memory fakes for use-case tests live in `packages/application/src/testing` (`@b2b-saas-starter-kit/application/testing`).

**Path:** `packages/platform`  
**Nx project:** `platform`  
**Tags:** `scope:backend`, `layer:platform`

## Purpose

Give application, infrastructure, and the HTTP/worker edge a shared, technology-agnostic contract for transactions, tenant scope, time, and IDs.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), [`docs/architecture/persistence.md`](../../docs/architecture/persistence.md), [`docs/architecture/multi-tenancy.md`](../../docs/architecture/multi-tenancy.md).

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- `node:` builtins

Never import Nest, TypeORM, Redis, `domain`, `application`, `contracts`, `utils`, `config`, or infrastructure.

## Who consumes vs who implements

| Port            | Consumes                                         | Implements (later)                          |
| --------------- | ------------------------------------------------ | ------------------------------------------- |
| `UnitOfWork`    | Application use cases                            | `infrastructure-postgres` (Phase 7)         |
| `TenantContext` | Edge sets via `run`; infra reads via getters     | `infrastructure-postgres` CLS/ALS (Phase 7) |
| `Clock`         | Application (pass `now()` into domain factories) | `infrastructure-postgres` (Phase 7)         |
| `IdGenerator`   | Application (`UserId.parse(ids.generate())`)     | UUID v7 adapter (Phase 7)                   |

Domain never imports this package.

## Semantics

- **`UnitOfWork.run`** opens a transaction and passes an opaque `TxContext` (`{id}`). Use cases typically ignore `ctx`. Repositories join the **ambient** transaction inside the adapter — they do not take `EntityManager` or `TxContext` on domain port signatures.
- **`TenantContext`** is fail-closed: `getTenantId()` / `getActorId()` throw `TenantContextNotEstablishedError` when no `run` scope is active. Pre-context lookups use the repository escape hatch, not a soft read here.
- **`Clock.now()`** is a UTC instant.
- **`IdGenerator.generate()`** returns a raw string. Branding happens in application.

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

| Export                             | Role                                           |
| ---------------------------------- | ---------------------------------------------- |
| `UnitOfWork`                       | `run(work)` transaction boundary               |
| `TxContext`                        | Opaque `{id}` — no persistence types           |
| `TenantContext`                    | `run(scope, work)` + fail-closed getters       |
| `TenantScope`                      | `{tenantId, actorId}`                          |
| `TenantContextNotEstablishedError` | Thrown when getters are called outside a scope |
| `Clock`                            | `now(): Date` (UTC)                            |
| `IdGenerator`                      | `generate(): string`                           |

## Must not go here yet

- `CachePort` / `LockPort` / `PubSubPort` (Redis phase)
- `Logger`
- Nest injection tokens, CLS/ALS adapters, TypeORM `UnitOfWork`
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
