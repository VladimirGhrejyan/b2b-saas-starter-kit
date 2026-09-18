# `@b2b-saas-starter-kit/postgres` — Engineering Review

## Summary

This is a well-architected persistence package. The port/adapter separation is clean, the domain stays pure, the custom `DataSource` + ALS design faithfully implements the documented decisions (no `@nestjs/typeorm`, no `nestjs-cls`), and the tests cover the isolation/mismatch paths. It is in good shape for a Phase-8 foundation.

The most important issues are **production-hardening gaps** (no pool/timeout/observability config) and one **isolation asymmetry**: reads fail-closed when tenant context is missing, but writes fail-**open** through the bootstrap path. For a package whose headline guarantee is tenant isolation, that asymmetry is the finding to fix first.

## Strengths

- **Boundaries are correct.** Ports in `domain`, entities/mappers/repos per-context under `src/contexts/`, repository-only public API (`index.ts`), no entity/mapper exports. Matches `persistence.md` exactly.
- **Clean transaction model.** `TypeormUnitOfWork` joins the ambient tx via `transactionAls`; `TxContext` stays `{id}` with no `EntityManager` leak into `platform`. Nested `run` correctly reuses the store.
- **Fail-closed reads.** `scoped()` calls `tenantContext.getTenantId()`, which throws `TenantContextNotEstablishedError` when no scope exists. Good default.
- **Framework-free tokens** (`Symbol`s), constructable-without-Nest `DataSourceManager`, and a real `forRootAsync` — all good for testability and Phase-9 composition.
- **String-based inverse relations** (`@OneToMany('RolePermissionEntity', 'role')`) to break the entity import cycle is a reasonable trade-off and keeps native ESM/SWC loading working.
- **Migrations are review-first** (`migrationsRun: false`, generate = draft). Correct posture.

## Findings

### 1. Writes fail-open when tenant context is missing — High, Architectural Weakness (security) — **done**

`src/kernel/persistence/tenant-aware.repository.ts`

Bootstrap writes require `TenantContext.withoutTenantScope()`. No ALS store is no longer treated as bootstrap; `stampTenantId` throws `TenantContextNotEstablishedError` (same as reads). `CreateTenant` callers wrap the use case; the use case itself is unchanged.

### 2. No connection pool, timeouts, or query observability — High, Recommended (production readiness) — **done**

`src/kernel/data-source/create-data-source.ts`

`PostgresConfig` now includes pool max, connect/statement/lock/idle-in-transaction timeouts, `application_name`, and `maxQueryExecutionTime` (via `POSTGRES_SLOW_QUERY_MS`). Defaults apply when only `DATABASE_URL` is set. Query `logging` stays `false`.

### 3. Multi-statement writes assume an ambient transaction but don't require one — High, Architectural Weakness (correctness) — **done**

`src/kernel/persistence/child-collection.writer.ts`

Child-collection **saves and deletes** go through `ChildCollectionWriter`, which throws `AmbientTransactionRequiredError` when `transactionAls` has no store. Role, membership, and invitation `save` (and role `delete`) no longer auto-commit a half-written aggregate. Single-table writes (users, tenants) may still use `dataSource.manager` when no UoW is open.

### 4. Child-collection "delete-then-insert" is racy under concurrency — Medium, Improvement — **done**

Same writer. Parent rows are locked `SELECT … FOR UPDATE` before child replace or parent+child delete. Versioned parents (`roles`, `memberships`) also increment `version` on save.

### 5. Parameter-name collision in `scoped()` silently overrides the caller's filter — Medium, Bug (contract) — **done**

`src/kernel/persistence/tenant-aware.repository.ts`

`scoped()` binds `:__ambientTenantId`. Methods that take an explicit `tenantId` call `assertTenant` (or `assertTenant` only when `hasEstablishedTenantScope()` for `findByUserAndTenant`). A mismatch is `TenantContextMismatchError` instead of a silent substitution.

### 6. Driver unique-violation leaks instead of a typed conflict — Medium, Improvement

`save()` uses `upsert(..., {conflictPaths: ['id']})`, but secondary uniques (`users.email`, `roles (tenant_id,name)`) surface as a raw Postgres `23505` to the application (the user-email integration test relies on this). Recommend catching `23505` in the repos and throwing a domain/application conflict error, so callers don't pattern-match driver errors and internal constraint names don't leak.

### 7. `TenantEntity.tenantId = id` and redundant index — Low, Preference

`tenant.mapper.ts` sets `row.tenantId = tenant.id`, and `tenant.entity.ts` adds `idx_tenants_tenant_id` on a column equal to the PK. The pool-model uniformity (every tenant-owned table has `tenant_id`, useful for future RLS) is a defensible choice, but it's undocumented in code and the extra index is redundant with the PK. Add a one-line comment explaining the self-reference, and drop the index (or make it the query path you actually use).

### 8. Migration "no migrations" detection is string/locale-brittle — Low, Improvement

`src/kernel/data-source/migration-runner.ts` `#isNoMigrationsError` matches `/no (executed )?migrations/i` on the error message. Fine now, but it will break silently on a TypeORM message change. Consider asserting on structure where possible, or centralizing this as a known-fragile spot with a test.

## Improvements

- Set an explicit transaction isolation level where the replace-collections invariants matter (or document that READ COMMITTED is intentional).
- Make `logging`/`maxQueryExecutionTime` configurable via `PostgresConfig` for local debugging and prod slow-query capture.
- `DataSourceManager.get()` can hand out an uninitialized `DataSource` if called before `onModuleInit`; consider guarding or documenting.

## New Practices

- **Statement/lock/idle-transaction timeouts** as first-class config (ties to Finding 2) — the single highest-value production safeguard here.
- **`application_name` per app** for connection attribution in `pg_stat_activity`.
- **Constraint-violation → domain-error mapping** as a small shared helper in `kernel/persistence` (ties to Finding 6).
- **Aggregate-root locking helper** for the delete-then-insert pattern (ties to Findings 3–4).
- Optional **RLS "secure profile"** is already documented in `multi-tenancy.md`; given Finding 1, it's worth keeping on the near-term roadmap as defense-in-depth for the write path.

## Deferred / Optional

- PgBouncer/transaction-pooling topology — plan for it, don't build it now.
- Per-context migration ownership — the filename-prefix convention already leaves this door open; no action needed.
- Explicit isolation levels / serializable retries — only if a concrete contention problem appears.

## Final Assessment

- **Should change now:** none remaining from this review pass (Findings 1–5 are done).
- **Should change soon:** none remaining from Findings 3–5.
- **Can defer:** Findings 6–8 and the optional items.
- **Keep as-is:** the overall port/adapter structure, UoW/ALS design, custom `DataSource` lifecycle, per-context layout, and review-first migrations.

No architectural decision needs reversing. Finding 1 is a tightening of the existing `TenantAwareRepository` contract, and Finding 2 is additive config — both fit within the current design rather than challenging it.
