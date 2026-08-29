# Infrastructure: Redis, HTTP client, Messaging, Jobs, Config, Logging

Technical capabilities that support the contexts without being domain concepts. All are reached through **ports** so the domain and application layers never depend on a concrete technology.

Related: [`backend.md`](./backend.md), [`persistence.md`](./persistence.md), [`multi-tenancy.md`](./multi-tenancy.md). Operational setup (Docker, local & staging): [`../infrastructure/README.md`](../infrastructure/README.md) ([ADR-026](./decisions.md)).

## Redis

Redis is used for **caching, distributed locks, and pub/sub** (and it backs BullMQ). It is exposed through generic **capability ports**, not as a Redis client sprinkled through the code.

- **Ports (interfaces):** `CachePort`, `LockPort`, `PubSubPort` live in `platform`. They are generic and technology-agnostic — nothing in their signatures mentions Redis.
- **Adapters (implementations):** live in `infrastructure/redis`, using a Redis client (e.g. `ioredis`).
- **`CachePort.set` requires `ttlSeconds`.** Compose Redis uses `maxmemory-policy noeviction`; expiry is correctness, not optional LRU.
- **Policy is per-context.** The _capability_ is generic; _what_ to cache, _which_ keys to lock, and _when_ is decided in each context's **application** layer. The domain layer never mentions caching or locking.

```typescript
// platform/cache.port.ts
export interface CachePort {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
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

## Outbound HTTP

Backend-only outbound calls. `nest-http` stays inbound.

- **Port:** `HttpClientPort` on `platform` (`request` / `scope`). `timeoutMs` is required after merge (request or `scope`). HTTP 4xx/5xx are returned on `HttpResponse` — do **not** throw on status. Transport errors only: timeout, network, aborted, response too large.
- **Adapter:** `packages/infrastructure/http-client` (`@b2b-saas-starter-kit/http-client`). Node `fetch` plus a pinned undici `Agent`. Pass `dispatcher` per request; never call `setGlobalDispatcher`.
- **Composition** imports `HttpClientModule.forRootAsync` so the Agent exists at API boot and `HTTP_CLIENT` is injectable. `apps/api` must not import the package.
- Config keys are optional with defaults (overall timeout 10s, connect timeout 5s, ~2MB body cap, optional `HTTP_CLIENT_USER_AGENT` / `HTTPS_PROXY` / `NO_PROXY`).

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

## Logging & observability

- **`Logger` port** lives in `platform`: `context(name)`, `trace` / `debug` / `info` / `warn` / `error` / `fatal`, with pino-style overloads (`msg` or `(data, msg)`). Domain does not log.
- **Not Nest DI.** A logger is a process sink. Nest providers fight `context()` and would pollute every use-case constructor. Do not use `nestjs-pino` or `@Inject(Logger)`.
- **Process locator** on `platform` so application never imports Pino:

```typescript
LoggerLocator.init(implementation: Logger): void
LoggerLocator.get(): Logger // throws if not initialized (no silent no-op default)
LoggerLocator.reset(): void
```

Bootstrap (`apps/api`, `apps/worker`): `LoggerLocator.init(new PinoLogger({level, isPretty}))`. Tests: `LoggerLocator.init(memoryLogger)` in `beforeEach`.

- **Adapter:** `packages/infrastructure/logger` (`@b2b-saas-starter-kit/logger`). One class wrapping `pino` + `pino.child({context})`. Typed levels. Production default **`info`**. `pino-pretty` only when `isPretty`. `Error` as first argument → `{err}`. Redact `req.headers.authorization` (and similar). No driver registry until a second adapter exists.
- Structured logs include `requestId`, and `tenantId` / `actorId` when a request scope is active. `RequestContextLocator` (`run` / `get` / `bind`) is a process ALS on `platform`, mixed into Pino automatically. HTTP access logs (`method`, templated `route`, `statusCode`, `durationMs`) are emitted by `nest-http` `HttpRequestInterceptor`. Do not reuse postgres `TenantContext` ALS for correlation.

## Configuration

- **`@b2b-saas-starter-kit/config`** (`packages/shared/config`) exposes `ConfigLoader`: load from a pluggable `source`, validate with **Zod**, return a typed object.
- **Sources:** `source: 'yaml'` (merge YAML files from an app `config/` directory; see `config.dist.yml` templates when apps exist) and `source: 'env'` — the container/12-factor contract that reads/validates `process.env` (raw strings; use coercing schemas). Containers use the env source (see [ADR-026](./decisions.md), [`../infrastructure/README.md`](../infrastructure/README.md)).
- Apps own schemas and values; the shared package owns the load pipeline. Call `ConfigLoader.load` explicitly at bootstrap / Vite plugin time (no import-time load).
- Invalid config **fails fast** (`ConfigValidationError`).
- Secrets must not be committed. In containers they arrive as env vars (`DATABASE_URL`, `REDIS_URL`, …); locally they may live in gitignored YAML. Before production, prefer a secret-manager overlay behind a new `source` variant without changing app facades.
