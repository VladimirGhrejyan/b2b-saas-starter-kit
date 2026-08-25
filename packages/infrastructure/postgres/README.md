# `@b2b-saas-starter-kit/postgres`

Postgres persistence adapters: a custom TypeORM `DataSource` lifecycle (no `@nestjs/typeorm`), Node `AsyncLocalStorage` for `TenantContext` and the ambient transaction (no `nestjs-cls`), `TenantAwareRepository`, `Clock`, `IdGenerator`, and the migration runner.

**Path:** `packages/infrastructure/postgres`  
**Nx project:** `postgres`  
**Tags:** `scope:backend`, `layer:infrastructure`

`packages/infrastructure/` is a grouping directory (like `packages/shared/`). Each concern is its own Nx project: `postgres` now, `redis` / `messaging` later.

Core adapters live under `src/kernel/` (config, DataSource, persistence plumbing, migrations). Bounded-context entities, mappers, and repos live only under `src/contexts/<context>/`. TypeORM relations stay inside one context folder; cross-context links are uuid columns. The public API exports repository classes only — never entities or mappers.

Architecture: [`docs/architecture/persistence.md`](../../../docs/architecture/persistence.md), [`docs/architecture/multi-tenancy.md`](../../../docs/architecture/multi-tenancy.md), [`docs/infrastructure/postgresql.md`](../../../docs/infrastructure/postgresql.md).

## Why not `@nestjs/typeorm` or `nestjs-cls`

- **`@nestjs/typeorm`** hides `DataSource` lifecycle and encourages `InjectRepository()` in the wrong layer. This package owns a small Nest wrapper (`PostgresInfrastructureModule` + `DataSourceManager`) around a vanilla `DataSource`.
- **`nestjs-cls`** is a Nest wrapper around the same Node `AsyncLocalStorage`. `TenantContext` and the ambient transaction are per-request / per-job **on one process**. Each instance reconstructs ALS from the message (headers today, token/job payload later). Never share `EntityManager` or ALS stores across instances.

Application use cases stay constructor-injected by TypeScript type. Phase 9 composition will `useFactory` + `inject: [UNIT_OF_WORK, …]`. Tokens in this package are framework-free `Symbol`s — do not add `@Inject` to application here.

## Allowed imports

- `typeorm`, `pg`, `uuid`, `zod`, `reflect-metadata`
- `@nestjs/common` (not `@nestjs/typeorm` or other Nest packages)
- `@b2b-saas-starter-kit/platform`, `shared-kernel-types`, `config`, `domain`, `application`

Never import `contracts`, `composition*`, or `nestjs-cls`.

## Tokens

| Token             | Binds to             |
| ----------------- | -------------------- |
| `DATA_SOURCE`     | TypeORM `DataSource` |
| `UNIT_OF_WORK`    | `TypeormUnitOfWork`  |
| `TENANT_CONTEXT`  | `AlsTenantContext`   |
| `CLOCK`           | `SystemClock`        |
| `ID_GENERATOR`    | `UuidV7IdGenerator`  |
| `POSTGRES_CONFIG` | `{DATABASE_URL}`     |

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

`create` writes an empty class. `generate` diffs current entities against the live schema in `DATABASE_URL` and writes `queryRunner.query(…)` SQL. Both are drafts: review the file, then **append** the class to `src/kernel/data-source/postgres-migrations.ts` (order is the timeline). Names must be context-prefixed kebab-case (`identity-…`, `tenancy-…`, `authorization-…`). The CLI loads TypeScript through SWC (`legacyDecorator` + `decoratorMetadata`) so TypeORM entities emit `design:type`; tsx/esbuild cannot.

`migrationsRun` is never `true` at `DataSource` init. Apply with `migration:run` (local, CI, or a staging one-shot). Do not run `create` / `generate` on staging.

## Phase 7 Definition of Done

- [x] Package at `packages/infrastructure/postgres` with tags `scope:backend`, `layer:infrastructure`
- [x] Custom `DataSourceManager` + `PostgresInfrastructureModule.forRootAsync` (no `TypeOrmModule`)
- [x] ALS `TenantContext` and nested-joining `TypeormUnitOfWork`
- [x] `TenantAwareRepository` filter/stamp/`assertTenant`/`withoutTenantScope`
- [x] `SystemClock` + UUID v7 `IdGenerator`
- [x] Empty migration runner + Nx `migration:run` / `migration:revert`
- [x] Unit tests + compose Postgres integration tests

## Phase 8 Definition of Done

- [x] Identity `users` adapter (`TypeOrmUserRepository`) — global, unique email, no `tenant_id`
- [x] Tenancy `tenants` / `memberships` / `membership_roles` adapters — in-context FKs only (`role_id` is a uuid column)
- [x] Authorization `roles` / `role_permissions` adapters — `save` / `saveMany`, unique `(tenant_id, name)`
- [x] Mappers reconstitute domain aggregates (no extra domain events)
- [x] Migration CLI (`create` / `generate` / `run` / `revert`); register drafts in `postgres-migrations.ts` after review
- [x] `stampTenantId` asserts ambient vs aggregate tenant; first-tenant bootstrap persists `row.tenantId`
- [x] Integration tests: round-trip, tenant isolation, mismatch, `AuthorizationService` through TypeORM repos
- [x] Public exports are repository classes only (no entities/mappers)
