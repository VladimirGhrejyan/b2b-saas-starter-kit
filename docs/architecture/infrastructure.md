# Infrastructure: Redis, HTTP client, Messaging, Jobs, Config, Logging

Technical capabilities that support the contexts without being domain concepts. All are reached through **ports** so the domain and application layers never depend on a concrete technology.

Related: [`backend.md`](./backend.md), [`persistence.md`](./persistence.md), [`multi-tenancy.md`](./multi-tenancy.md). Operational setup (Docker, local & staging): [`../infrastructure/README.md`](../infrastructure/README.md) ([ADR-026](./decisions.md)).

## Redis

Redis is used for **caching, distributed locks, and pub/sub** (and it backs BullMQ). It is exposed through generic **capability ports**, not as a Redis client sprinkled through the code.

- **Ports (interfaces):** `CachePort`, `LockPort`, `PubSubPort`, `RateLimiterPort` live in `platform`. They are generic and technology-agnostic — nothing in their signatures mentions Redis.
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

- **BullMQ** lives in `packages/infrastructure/messaging` (`@b2b-saas-starter-kit/messaging`) with a dedicated blocking ioredis connection (`maxRetriesPerRequest: null`, no cache `keyPrefix`, prefix `bsk:bull`). Processors and scheduler registration live in composition; `apps/worker` stays thin. The worker app loads env once and passes postgres/messaging slices into `WorkerModule`.
- Both `maintenance` and `outbox` queues share default job options: 3 attempts with exponential backoff, `removeOnComplete` (`age` 1h, `count` 1000), and `removeOnFail` (`age` 1 day). Redis is ephemeral — bound job hashes so it cannot grow without limit.
- `QueueWorkerFactory` logs BullMQ `error`, `stalled`, and `failed` events via `LoggerLocator`. A last-attempt failure is logged as `job exhausted` (no dead-letter queue yet).
- **Transactional outbox** stays in Postgres. Use cases write outbox rows in the same `UnitOfWork` as the domain change. The worker relay **claims** `pending` → `processing` and enqueues a BullMQ `outbox` job. The processor dispatches through `EventBus` and **then** marks the row `processed`. Do not mark processed at enqueue time.
- Outbox delivery is **at-least-once**. A crash after handlers run and before `processed`, or a stale-`processing` reclaim, can dispatch the same row again. Side-effectful handlers (email, audit) **must be idempotent**, keyed by event identity or `outboxId` (mail-provider idempotency key, unique audit row). Do not wrap worker dispatch in HTTP `IdempotencyPort`.
- Worker catch-all reactions (today: structured logging) subscribe with `EventBus.registerAll` — not a hand-maintained event-type list. Typed `register(type)` handlers still run first when present.
- Redis is ephemeral (see [`../infrastructure/redis.md`](../infrastructure/redis.md)). Lost in-flight BullMQ jobs are recovered by reclaiming stale `processing` rows back to `pending`.
- **Maintenance** uses BullMQ job schedulers (`maintenance` queue) for idempotent cleanup: expired/revoked refresh sessions, inactive password-reset tokens, stale invitations, and stale-outbox reclaim.

```
domain change + outbox row  ── one Postgres transaction (UnitOfWork) ──▶ commit
outbox relay (worker)       ── claim pending ──▶ BullMQ outbox queue
BullMQ processor (worker)   ── EventBus handlers ──▶ mark outbox row processed
stale processing            ── maintenance reclaim ──▶ pending
```

### Domain events vs. integration/outbox events

- **Domain events** are dispatched **in-process** after commit for same-process reactions.
- **Outbox events** are for **reliable, cross-boundary** delivery (e.g. `notifications` reacting to `tenancy`, or future out-of-process consumers). A context chooses in-process vs. outbox based on whether the reaction must survive a crash.

## Object storage

`FileStoragePort` lives in `platform`. Object keys are built by `ObjectKey` (`t/{tenantId}/{purpose}/{yyyy}/{mm}/{objectId}` or `g/{purpose}/…`) so tenant isolation is a prefix, not a bucket-per-tenant. The port takes a logical bucket (`private` | `public`); application never passes a raw bucket name.

Composition always binds `InMemoryFileStorage` (`FILE_STORAGE`) until an S3-compatible adapter exists (same seam as `LoggingMailer` / SMTP). In-memory `presignPut` / `presignGet` return `memory:` URLs — they document the contract and are not HTTP. Product uploads should use presigned HTTP so bytes skip the API.

Postgres file metadata, quotas, MinIO, and upload routes are deferred.

## Pub/Sub

`PubSubPort` (Redis pub/sub) supports lightweight fan-out (e.g. cache invalidation across instances, future realtime). It is **not** a durability mechanism — anything that must not be lost uses the outbox. A realtime `gateway` app can later subscribe to `PubSubPort` channels; it is deferred for now (see [`decisions.md`](./decisions.md)).

## Idempotency

`IdempotencyPort` lives in `platform`. The Postgres adapter writes `idempotency_keys` in the ambient `UnitOfWork` so a retried mutation replays the original response. HTTP consumption is `@Idempotent()` + `IdempotencyInterceptor` in `nest-http` (registered after auth in `apps/api`). See [ADR-034](./decisions.md). It is **not** used for outbox/BullMQ delivery — that path is at-least-once and handler-idempotent (see Messaging & background jobs).

## Health probes

`HealthIndicator` lives in `platform`. Postgres answers with `SELECT 1` on `DATA_SOURCE` (no UnitOfWork / tenant ALS); Redis answers with command-client `PING`. `nest-http` exposes unversioned `GET /live` (process-only), `GET /ready` (aggregate indicators; 503 if any are down), and `GET /health` as a readiness alias for staging. See [ADR-035](./decisions.md).

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
- Structured logs include `requestId`, and `tenantId` / `actorId` when a request scope is active. `RequestContextLocator` (`run` / `get` / `bind`) is a process ALS on `platform`, mixed into Pino automatically. When an OpenTelemetry span is active, the same mixin adds `traceId` / `spanId` from `@opentelemetry/api`. HTTP access logs (`method`, templated `route`, `statusCode`, `durationMs`) are emitted by `nest-http` `HttpRequestInterceptor`. Do not reuse postgres `TenantContext` ALS for correlation.

## Metrics and traces

- **Adapter:** `packages/infrastructure/telemetry` (`@b2b-saas-starter-kit/telemetry`). Extra tag `layer:telemetry` so apps can start the SDK without opening `postgres`. See [ADR-036](./decisions.md).
- **YAML gate:** `telemetry.enabled` defaults to `false`. When `true`, `telemetry.otlpEndpoint` is required (fail-fast; no localhost default). `telemetry.serviceName` defaults to `appType`. Do not also use `OTEL_SDK_DISABLED`.
- Bootstrap (`apps/api`, `apps/worker`) calls `startTelemetry` **before** `LoggerLocator.init` / `NestFactory`, then shuts the handle down with the process. Auto-instrument HTTP, `pg`, ioredis, and undici. Ignore incoming `/live`, `/ready`, `/health`, `/docs`. Tenant identity is a **span attribute** (`applyActiveSpanAttributes` after auth), never a metric label.
- No Prometheus `GET /metrics`, no Compose collector in this slice, no `MetricsPort`.

## Configuration

- **`@b2b-saas-starter-kit/config`** (`packages/shared/config`) exposes `ConfigLoader`: load from a pluggable `source`, validate with **Zod**, return a typed object.
- **Sources:** `source: 'yaml'` (deep-merge YAML from an app `config/` directory, then overlay a small env allow-list for secrets and `nodeEnv`) and `source: 'env'` for CLI / test harnesses that only need connection strings. Compose injects secrets as env; it does not replace structured YAML (see [ADR-026](./decisions.md), [`../infrastructure/README.md`](../infrastructure/README.md)).
- Apps own schemas and `config/default.yml`; the shared package owns the load pipeline. Call `ConfigLoader.load` explicitly at bootstrap / Vite plugin time (no import-time load).
- Every app config has `nodeEnv` (`development | production`, from `NODE_ENV`) and `appEnv` (`staging | production`, kit-extended with `development`).
- Invalid config **fails fast** (`ConfigValidationError`).
- Secrets must not be committed. They arrive as env vars (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, …) overlaid onto the YAML tree. Before production, prefer a secret-manager that **sets the same env names**.
