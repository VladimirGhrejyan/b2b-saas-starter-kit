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

### 1. Writes fail-open when tenant context is missing — High, Architectural Weakness (security)

`src/kernel/persistence/tenant-aware.repository.ts`

```typescript
protected stampTenantId<T>(row: T & {tenantId?: string}): T & {tenantId: string} {
  if (this.#isBootstrapWrite()) {
    if (row.tenantId === undefined) {
      throw new TenantContextMismatchError()
    }
    return {...row, tenantId: row.tenantId}
  }
  ...
}
#isBootstrapWrite(): boolean {
  const store = tenantAls.getStore()
  return store === undefined || store.skipTenantScope || store.scope === undefined
}
```

**Problem:** `store === undefined` (no ALS at all) is treated as "bootstrap," so any write with a `tenantId` already on the row is persisted as-is, with no assertion. Reads in the same situation throw. So a use case/worker that forgets to establish `TenantContext` will **silently write** to whatever tenant the row claims, while reads would have errored.

**Why it matters:** Tenant isolation is the package's core guarantee. The safe asymmetry is fail-closed on both sides. Here the write path is opt-out-by-omission: the guardrail disappears whenever context setup is skipped by mistake.

**Recommendation:** Make "bootstrap" an **explicit intent**, not the absence of a store. E.g. require `withoutTenantScope()` (or a dedicated `bootstrapTenant()` marker in the ALS store) for the no-ambient path, and throw `TenantContextNotEstablishedError` when `store === undefined` and no explicit bootstrap flag is set. That preserves the genuine first-tenant chicken-and-egg case while closing the accidental-write hole.

### 2. No connection pool, timeouts, or query observability — High, Recommended (production readiness)

`src/kernel/data-source/create-data-source.ts`

```typescript
return new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL,
  entities: [...postgresEntities, ...(options.entities ?? [])],
  migrations: options.migrations ?? postgresMigrations,
  migrationsRun: false,
  synchronize: false,
  logging: false,
})
```

**Problem:** No `poolSize`/`extra.max`, `connectTimeoutMS`, `extra.statement_timeout`, `extra.lock_timeout`, `extra.idle_in_transaction_session_timeout`, `application_name`, or `maxQueryExecutionTime`. `logging` is hardcoded `false`.

**Why it matters:** With horizontal scaling (many API/worker instances) against one Postgres, an unbounded/oversized pool per instance can exhaust `max_connections`. Without `statement_timeout`/`lock_timeout`, a single bad query or lock wait can pin a connection indefinitely. Without `application_name` and slow-query logging, you have no production observability.

**Recommendation:** Add to `PostgresConfig` (all optional with sane defaults): pool max, connect timeout, `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`, `application_name`, and TypeORM `maxQueryExecutionTime` for slow-query logging. Set them via `extra` (node-postgres passthrough). Plan for PgBouncer (transaction pooling) as the scale-out path and keep per-instance pools small. Introduce now — it's cheap and hard to retrofit once apps depend on the config shape.

### 3. Multi-statement writes assume an ambient transaction but don't require one — High, Architectural Weakness (correctness)

`src/contexts/authorization/typeorm-role.repository.ts` / `src/contexts/tenancy/typeorm-membership.repository.ts`

`save()` performs `upsert(parent)` → `delete(children)` → `insert(children)` as three statements, and `saveMany()` loops `save()`. `manager` resolves to `dataSource.manager` (auto-commit) when no `transactionAls` store is present.

**Why it matters:** Outside `uow.run`, a failure between statements leaves a half-written aggregate (role with no permissions, membership with stale roles). `saveMany` can persist some roles and not others. The correctness of these repos silently depends on the caller wrapping them.

**Recommendation:** Either (a) assert an ambient transaction for multi-statement writes (throw if `transactionAls.getStore()` is undefined), or (b) wrap the child-replacement in `this.dataSource.transaction` when no ambient tx exists. (a) is more in keeping with the explicit-UoW design. At minimum, document the invariant on the port.

### 4. Child-collection "delete-then-insert" is racy under concurrency — Medium, Improvement

Same two repos. `DELETE role_permissions WHERE role_id=x; INSERT ...` under default READ COMMITTED lets two concurrent saves of the same aggregate interleave (lost update / transient empty state). Recommend taking a row lock on the parent (`SELECT … FOR UPDATE`) within the tx, or diffing with `ON CONFLICT`, so aggregate updates serialize.

### 5. Parameter-name collision in `scoped()` silently overrides the caller's filter — Medium, Bug (contract)

`src/kernel/persistence/tenant-aware.repository.ts` binds `:tenantId`:

```typescript
protected scoped<T extends ObjectLiteral>(alias: string, qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
  if (this.#isTenantScopeSkipped()) {
    return qb
  }
  return qb.andWhere(`${alias}.tenantId = :tenantId`, {tenantId: this.tenantContext.getTenantId()})
}
```

But `findByTenant(tenantId)` already binds `:tenantId` to its argument, then `scoped` overwrites that same parameter with the ambient value. So `findByTenant(X)` executed under ambient `Y` silently returns `Y`'s rows. It **fails closed** (no cross-tenant leak — you only ever see ambient), so this is not a security hole, but the explicit argument is silently ignored, which can mask bugs.

**Recommendation:** Use a collision-proof param name (e.g. `:__ambientTenantId`) in `scoped`, and have `findByTenant`/`findByUserAndTenant` call `assertTenant(tenantId)` so a mismatch is an explicit error rather than a silent substitution.

### 6. Driver unique-violation leaks instead of a typed conflict — Medium, Improvement

`save()` uses `upsert(..., {conflictPaths: ['id']})`, but secondary uniques (`users.email`, `roles (tenant_id,name)`) surface as a raw Postgres `23505` to the application (the user-email integration test relies on this). Recommend catching `23505` in the repos and throwing a domain/application conflict error, so callers don't pattern-match driver errors and internal constraint names don't leak.

### 7. `TenantEntity.tenantId = id` and redundant index — Low, Preference

`tenant.mapper.ts` sets `row.tenantId = tenant.id`, and `tenant.entity.ts` adds `idx_tenants_tenant_id` on a column equal to the PK. The pool-model uniformity (every tenant-owned table has `tenant_id`, useful for future RLS) is a defensible choice, but it's undocumented in code and the extra index is redundant with the PK. Add a one-line comment explaining the self-reference, and drop the index (or make it the query path you actually use).

### 8. Migration "no migrations" detection is string/locale-brittle — Low, Improvement

`src/kernel/migrations/migration-runner.ts` `#isNoMigrationsError` matches `/no (executed )?migrations/i` on the error message. Fine now, but it will break silently on a TypeORM message change. Consider asserting on structure where possible, or centralizing this as a known-fragile spot with a test.

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

- **Should change now:** Finding 1 (write-path fail-open) and Finding 2 (pool/timeouts/observability). These are core to the package's stated guarantees and to production readiness, and both are cheap to add at this stage.
- **Should change soon:** Findings 3–5 (transaction requirement for multi-statement writes, the delete/insert race, and the `:tenantId` param collision) — correctness issues that will bite under real concurrency.
- **Can defer:** Findings 6–8 and the optional items.
- **Keep as-is:** the overall port/adapter structure, UoW/ALS design, custom `DataSource` lifecycle, per-context layout, and review-first migrations.

No architectural decision needs reversing. Finding 1 is a tightening of the existing `TenantAwareRepository` contract, and Finding 2 is additive config — both fit within the current design rather than challenging it.
