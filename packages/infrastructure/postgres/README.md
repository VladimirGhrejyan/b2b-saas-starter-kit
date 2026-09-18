# `@b2b-saas-starter-kit/postgres`

Postgres persistence adapters: a custom TypeORM `DataSource` lifecycle (no `@nestjs/typeorm`), Node `AsyncLocalStorage` for `TenantContext` and the ambient transaction (no `nestjs-cls`), `TenantAwareRepository`, and the migration runner.

**Path:** `packages/infrastructure/postgres`  
**Nx project:** `postgres`  
**Tags:** `scope:backend`, `layer:infrastructure`

`packages/infrastructure/` is a grouping directory (like `packages/shared/`). Each concern is its own Nx project: `postgres`, `logger`, `redis`, `http-client`, `security`, `node`; `messaging` later.

Core adapters live under `src/kernel/` (config, DataSource, persistence plumbing, migrations). Bounded-context files live under `src/contexts/<context>/{entities,mappers,repositories}`. TypeORM relations stay inside one context folder; cross-context links are uuid columns. The public API exports repository classes only — never entities or mappers.

Architecture: [`docs/architecture/persistence.md`](../../../docs/architecture/persistence.md), [`docs/architecture/multi-tenancy.md`](../../../docs/architecture/multi-tenancy.md), [`docs/infrastructure/postgresql.md`](../../../docs/infrastructure/postgresql.md).

## Why not `@nestjs/typeorm` or `nestjs-cls`

- **`@nestjs/typeorm`** hides `DataSource` lifecycle and encourages `InjectRepository()` in the wrong layer. This package owns a small Nest wrapper (`PostgresInfrastructureModule` + `DataSourceManager`) around a vanilla `DataSource`.
- **`nestjs-cls`** is a Nest wrapper around the same Node `AsyncLocalStorage`. `TenantContext` and the ambient transaction are per-request / per-job **on one process**. Each instance reconstructs ALS from the message (headers today, token/job payload later). Never share `EntityManager` or ALS stores across instances.

Application use cases inject ports with `@Inject(portToken)`. Port tokens live next to the port (`USER_REPOSITORY` in domain, `UNIT_OF_WORK` in platform). This package owns adapter-internal tokens only (`DATA_SOURCE`, `POSTGRES_CONFIG`).

## Allowed imports

- `typeorm`, `pg`, `zod`, `reflect-metadata`
- `@nestjs/common` (not `@nestjs/typeorm` or other Nest packages)
- `@b2b-saas-starter-kit/platform`, `shared-kernel-types`, `config`, `domain`, `application`

Never import `contracts`, `composition*`, or `nestjs-cls`.

## Tokens

| Token             | Binds to                               |
| ----------------- | -------------------------------------- |
| `DATA_SOURCE`     | TypeORM `DataSource`                   |
| `POSTGRES_CONFIG` | `{DATABASE_URL, POSTGRES_POOL_MAX, …}` |

Pool, connect/statement/lock/idle-in-transaction timeouts, `application_name`, and slow-query threshold (`POSTGRES_SLOW_QUERY_MS` → TypeORM `maxQueryExecutionTime`) are optional env vars with defaults. `DATABASE_URL` remains required. Query logging stays off.

## Commands

Postgres must be up (`pnpm infra:up`). Integration tests use a dedicated `app_test` database (created if missing).

```bash
pnpm infra:up
pnpm nx run postgres:lint
pnpm nx run postgres:test
pnpm nx run postgres:typecheck
pnpm nx run postgres:migration:create --name=tenancy-add-slug
pnpm nx run postgres:migration:generate --name=tenancy-add-slug
pnpm nx run postgres:migration:run
pnpm nx run postgres:migration:revert
```

`create` writes an empty class. `generate` diffs current entities against the live schema in `DATABASE_URL` and writes `queryRunner.query(…)` SQL. Both are drafts: review the file, then **append** the class to `src/kernel/data-source/postgres-migrations.ts` (order is the timeline). Names must be context-prefixed kebab-case (`identity-…`, `tenancy-…`, `authorization-…`, `kernel-…`). The CLI loads TypeScript through SWC (`legacyDecorator` + `decoratorMetadata`) so TypeORM entities emit `design:type`; tsx/esbuild cannot.

Kernel table `idempotency_keys` backs `IdempotencyPort` (claimed and completed inside the ambient UnitOfWork). Do not export the entity.

`migrationsRun` is never `true` at `DataSource` init. Apply with `migration:run` (local, CI, or a staging one-shot). Do not run `create` / `generate` on staging.

## Phase 7 Definition of Done

- [x] Package at `packages/infrastructure/postgres` with tags `scope:backend`, `layer:infrastructure`
- [x] Custom `DataSourceManager` + `PostgresInfrastructureModule.forRootAsync` (no `TypeOrmModule`)
- [x] ALS `TenantContext` and nested-joining `TypeormUnitOfWork`
- [x] `TenantAwareRepository` filter/stamp/`assertTenant`/`withoutTenantScope`
- [x] Persistence-only module (clock, ids, and crypto live in `node` / `security`)
- [x] Empty migration runner + Nx `migration:run` / `migration:revert`
- [x] Unit tests + compose Postgres integration tests

## Phase 8 Definition of Done

- [x] Identity `users` adapter (`TypeOrmUserRepository`) — global, unique email, no `tenant_id`
- [x] Tenancy `tenants` / `memberships` / `membership_roles` adapters — in-context FKs only (`role_id` is a uuid column)
- [x] Authorization `roles` / `role_permissions` adapters — `save` / `saveMany`, unique `(tenant_id, name)`
- [x] Mappers reconstitute domain aggregates (no extra domain events)
- [x] Migration CLI (`create` / `generate` / `run` / `revert`); register drafts in `postgres-migrations.ts` after review
- [x] `stampTenantId` asserts ambient vs aggregate tenant; first-tenant writes require `withoutTenantScope`
- [x] Integration tests: round-trip, tenant isolation, mismatch, `AuthorizationService` through TypeORM repos
- [x] Public exports are repository classes only (no entities/mappers)
