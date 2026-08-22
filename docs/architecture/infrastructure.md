# Infrastructure: Redis, Messaging, Jobs, Config

Technical capabilities that support the contexts without being domain concepts. All are reached through **ports** so the domain and application layers never depend on a concrete technology.

Related: [`backend.md`](./backend.md), [`persistence.md`](./persistence.md), [`multi-tenancy.md`](./multi-tenancy.md).

## Redis

Redis is used for **caching, distributed locks, and pub/sub** (and it backs BullMQ). It is exposed through generic **capability ports**, not as a Redis client sprinkled through the code.

- **Ports (interfaces):** `CachePort`, `LockPort`, `PubSubPort` live in `platform`. They are generic and technology-agnostic — nothing in their signatures mentions Redis.
- **Adapters (implementations):** live in `infrastructure/redis`, using a Redis client (e.g. `ioredis`).
- **Policy is per-context.** The _capability_ is generic; _what_ to cache, _which_ keys to lock, and _when_ is decided in each context's **application** layer. The domain layer never mentions caching or locking.

```typescript
// platform/cache.port.ts
export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
}

// application/authorization/get-effective-permissions.use-case.ts
@Injectable()
export class GetEffectivePermissionsUseCase {
  constructor(private readonly cache: CachePort /* … */) {}
  async execute(q: Query) {
    const key = cacheKeys.effectivePermissions(q.tenantId, q.userId)
    // context decides the policy; cache is a generic capability
  }
}
```

### Redis and multi-tenancy

All Redis keys are **tenant-prefixed** (`t:<tenantId>:...`) so cached/locked state cannot leak across tenants. A small key-builder in `platform`/`application` enforces the convention. See [`multi-tenancy.md`](./multi-tenancy.md).

### Is Redis one shared package or per-context?

**One shared adapter package** (`infrastructure/redis`) providing the generic capabilities; **per-context usage/policy** in each context's application code. This avoids five near-identical Redis clients while keeping caching decisions local to each context.

## Messaging & background jobs

- **BullMQ** (Redis-backed) runs asynchronous work; processors live in `apps/worker`.
- **Transactional outbox** guarantees reliable job/event dispatch: outbox rows are written **in the same database transaction** as the domain change (via the `UnitOfWork`), then an **outbox relay** publishes them to BullMQ.

```
domain change + outbox row  ── one Postgres transaction (UnitOfWork) ──▶ commit
outbox relay (worker)       ── polls unpublished rows ──▶ BullMQ
BullMQ processor (worker)   ── does the work ──▶ marks outbox row processed
```

This prevents the classic "saved to DB but the job never fired" (or vice-versa) inconsistency. The outbox implementation lives in `infrastructure/messaging`; the port/contract it satisfies is defined so application code enqueues intent without knowing about BullMQ.

### Domain events vs. integration/outbox events

- **Domain events** are dispatched **in-process** after commit for same-process reactions.
- **Outbox events** are for **reliable, cross-boundary** delivery (e.g. `notifications` reacting to `tenancy`, or future out-of-process consumers). A context chooses in-process vs. outbox based on whether the reaction must survive a crash.

## Pub/Sub

`PubSubPort` (Redis pub/sub) supports lightweight fan-out (e.g. cache invalidation across instances, future realtime). It is **not** a durability mechanism — anything that must not be lost uses the outbox. A realtime `gateway` app can later subscribe to `PubSubPort` channels; it is deferred for now (see [`decisions.md`](./decisions.md)).

## Configuration

- **`@b2b-saas-starter-kit/config`** (`packages/shared/config`) exposes `ConfigLoader`: load from a pluggable `source`, validate with **Zod**, return a typed object.
- **v1 source:** `source: 'yaml'` — merge YAML files from an app `config/` directory (see `config.dist.yml` templates when apps exist).
- Apps own schemas and values; the shared package owns the load pipeline. Call `ConfigLoader.load` explicitly at bootstrap / Vite plugin time (no import-time load).
- Invalid config **fails fast** (`ConfigValidationError`).
- Secrets must not be committed. Today they may live in gitignored YAML; before production, prefer env/secret-manager overlays behind new `source` variants without changing app facades.

## Logging & observability (design intent)

- A `Logger` seam in `platform` keeps the logging library swappable.
- Structured, context-enriched logs should include `tenantId`, `userId`, request/correlation IDs (populated from the ambient context). Concrete tooling is deferred; the seam is the architectural commitment.
