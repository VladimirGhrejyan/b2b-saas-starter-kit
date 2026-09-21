# Review — Worker + Messaging + BullMQ

**Scope:** `apps/worker`, `packages/composition/src/worker`, `packages/infrastructure/messaging`
**Reference architecture:** `docs/architecture/infrastructure.md`, `docs/architecture/backend.md`, `.cursor/rules/backend/*`
**Type:** Review only — no code changed.

---

## Summary

The setup is **well-structured and faithful to the documented architecture**. The layering is clean (thin `apps/worker`, processors in `composition`, BullMQ mechanics isolated in `infrastructure/messaging`), the transactional-outbox flow implements the correct _claim → enqueue → process → complete_ ordering, and the concurrency-sensitive SQL uses `FOR UPDATE SKIP LOCKED` correctly. The dedicated blocking ioredis connection is configured the way BullMQ requires.

The gaps are mostly **operational hardening and a few boundary/consistency issues**, not correctness bugs in the happy path. The three items you flagged are all legitimate:

1. `domain-event-types.ts` is a hand-maintained duplication of domain knowledge living in the wrong layer, with a **silent-drift** failure mode.
2. `maintenance-processor.service.ts` uses an `if/return` dispatch chain that silently swallows unknown job names.
3. `maintenance-scheduler.ts` repeats near-identical registration calls that should be table-driven.

None are critical, but #1 has real correctness implications (events can go silently unhandled) and several operational findings (job retention, error observability, idempotency) matter before this carries real side-effectful handlers.

---

## Strengths (preserve these)

- **Correct outbox ordering.** The relay claims `pending → processing` and enqueues; the processor dispatches and _then_ marks `processed` (`outbox-event-processor.service.ts` → `relay.complete`). It never marks processed at enqueue time — exactly what `infrastructure.md` mandates.
- **Concurrency-safe claiming.** `claimBatch` and `reclaimStaleProcessing` both use `FOR UPDATE SKIP LOCKED`, so multiple worker replicas can run without double-claiming. This is the right primitive for horizontal scaling.
- **Crash recovery is designed in.** Stale `processing` rows are reclaimed to `pending` by a maintenance job, matching the "Redis is ephemeral, recover from Postgres" stance.
- **Correct BullMQ connection.** `maxRetriesPerRequest: null`, capped `retryStrategy`, `rediss:` TLS detection, and a dedicated connection separate from the cache client (`bullmq-client.manager.ts`, `create-bullmq-connection-options.ts`).
- **Idempotent enqueue.** `addOutboxJob` uses `jobId: payload.outboxId`, so re-enqueuing the same row dedupes at the BullMQ level.
- **Tenant context is restored** before dispatch (`#dispatch` runs handlers inside `tenantContext.run(...)` with a synthetic worker actor) — consistent with `multi-tenancy.mdc`'s "worker re-establishes TenantContext" rule.
- **Retry/backoff on the outbox queue** (`attempts: 3`, exponential backoff) plus a terminal `failed` state on last attempt.
- **Config is loaded via `ConfigLoader` + Zod** with sensible defaults, not raw `process.env` sprawl.
- **`#`-private members in composition are compliant** — `apps-layer.mdc` only forbids `#` in `apps/`; `packages/composition` may use it. No action needed there.

---

## Findings (ordered by impact)

### 1. `domain-event-types.ts` lives in the worker and silently drifts from the domain — **[your Q1]**

- **Severity:** Medium–High
- **Category:** Architecture Weakness
- **Location:** `packages/composition/src/worker/domain-event-types.ts`, consumed in `outbox-relay.service.ts:29`

**Problem.** `DOMAIN_EVENT_TYPES` is a hand-written runtime array of event-type strings. The canonical definition of these events is the **domain layer**: the `DomainEvent` union in `packages/domain/src/domain-events.ts` (composed of `IdentityDomainEvent | TenancyDomainEvent | AuthorizationDomainEvent`). So this list is a _second, untyped copy_ of domain knowledge, physically located in the composition/worker layer.

Two distinct problems:

1. **Wrong ownership.** "Which domain events exist" is domain knowledge, not worker-wiring knowledge. The worker should not be the source of truth for the event catalog.
2. **Silent-drift failure mode.** The array is only used to register `DomainEventLoggingHandler` per type. Dispatch (`InProcessEventBus.dispatch`) looks up handlers by `event.type` and **no-ops when none are registered**. So if someone adds a new domain event (say `ApiKeyCreated`, which _is_ already in the domain union but **missing from this array**), the outbox will still deliver it, the processor will still dispatch it, and it will be **silently unlogged/unhandled** — no error, no compile failure. Note the array today already omits the API-key events that exist in `IdentityDomainEvent`, which demonstrates the drift is already real.

**Why it matters.** There is no compile-time link between this runtime list and `DomainEvent`, so the type system cannot catch omissions. As real handlers (audit, email) replace the MVP logger, a missed registration becomes a **dropped side effect**, not just a missing log line.

**Recommendation (pick one, in order of preference):**

- **Best — remove the list entirely.** The logging handler is a _catch-all_; it does not need per-type registration. Give `EventBus` a wildcard/`registerAll` subscription (or have the processor call a fixed "on any event" hook) and delete `DOMAIN_EVENT_TYPES`. This also splits the relay's two responsibilities (see Finding 6).
- **Otherwise — single source of truth in the domain.** Define the runtime tuple in `packages/domain` and derive the union from it, so drift becomes a type error:

```typescript
// packages/domain/src/domain-events.ts
export const DOMAIN_EVENT_TYPES = [
  'UserCreated',
  'UserSuspended',
  'UserActivated',
  'ApiKeyCreated',
  'ApiKeyRevoked',
  'ApiKeyPermissionsReplaced',
  'TenantCreated' /* … */,
] as const

// Compile-time guard: every DomainEvent['type'] must appear in the tuple, and vice-versa.
type _AssertNoDrift = Exclude<DomainEvent['type'], (typeof DOMAIN_EVENT_TYPES)[number]> extends never ? true : never
```

The worker then imports `DOMAIN_EVENT_TYPES` from `@b2b-saas-starter-kit/domain` and the list can never silently diverge.

---

### 2. `#run` dispatch chain swallows unknown jobs — **[your Q2]**

- **Severity:** Medium
- **Category:** Improvement (with a latent correctness edge)
- **Location:** `packages/composition/src/worker/maintenance-processor.service.ts:50-70`

**Problem.** The method is a manual `if (name === X) return …` chain with a `return 0` fall-through. Three issues:

1. **Silent no-op on unknown names.** An unrecognized job name returns `0` and is treated as a successful empty purge. A typo in a job name, or a scheduler/processor mismatch, disappears with zero signal.
2. **Asymmetry / mixed abstraction levels.** Three branches delegate to use cases; the `reclaimStaleOutbox` branch inlines `Date` arithmetic and calls `outboxRelay` directly. The dispatcher both routes _and_ implements one branch.
3. **Not exhaustive.** There is no compile-time guarantee every `MaintenanceJobName` is handled.

**Recommendation.** Replace the chain with a typed handler map keyed by `MaintenanceJobName`, and fail loudly on unknown names:

```typescript
private readonly handlers: Record<MaintenanceJobName, () => Promise<number>> = {
  [MaintenanceJobName.purgeRefreshSessions]: async () =>
    (await this.purgeRefreshSessions.execute()).deleted,
  [MaintenanceJobName.purgePasswordResetTokens]: async () =>
    (await this.purgePasswordResetTokens.execute()).deleted,
  [MaintenanceJobName.purgeStaleInvitations]: async () =>
    (await this.purgeStaleInvitations.execute()).deleted,
  [MaintenanceJobName.reclaimStaleOutbox]: () => this.reclaimStaleOutbox(),
}

async #run(name: string): Promise<number> {
  const handler = this.handlers[name as MaintenanceJobName]
  if (handler === undefined) {
    LoggerLocator.get().warn({jobName: name}, 'unknown maintenance job')
    throw new Error(`Unknown maintenance job: ${name}`) // let BullMQ record it as failed
  }
  return handler()
}
```

The `Record<MaintenanceJobName, …>` makes the mapping **exhaustive at compile time**, extracts the reclaim branch to a named method (symmetry), and turns an unknown job into a visible failure. Throwing is preferable to `return 0` here because a mismatched name is a wiring bug, not a normal outcome.

---

### 3. `MaintenanceScheduler` repeats near-identical registrations — **[your Q3]**

- **Severity:** Low
- **Category:** Improvement
- **Location:** `packages/composition/src/worker/maintenance-scheduler.ts:18-30`

**Problem.** Four hand-written `await upsertJobScheduler(name, everyMs)` calls with inconsistent formatting (first inline, the rest wrapped), run sequentially. The set of job names is now duplicated across **three** places — this scheduler, the processor's `#run`, and `MaintenanceJobName` — so adding a job means editing all of them.

**Recommendation.** Drive registration from a single table and loop:

```typescript
async onModuleInit(): Promise<void> {
  const schedules: ReadonlyArray<[MaintenanceJobName, number]> = [
    [MaintenanceJobName.purgeRefreshSessions, this.config.refreshSessionsEveryMs],
    [MaintenanceJobName.purgePasswordResetTokens, this.config.passwordResetTokensEveryMs],
    [MaintenanceJobName.purgeStaleInvitations, this.config.staleInvitationsEveryMs],
    [MaintenanceJobName.reclaimStaleOutbox, this.config.reclaimStaleOutboxEveryMs],
  ]

  await Promise.all(
    schedules.map(([name, everyMs]) => this.scheduler.upsertJobScheduler(name, everyMs)),
  )
}
```

**Bigger win (optional):** co-locate the job _definition_ — name, interval-config key, and handler — in one registry that both the scheduler and the processor consume. That removes the triplicated job list entirely and makes "add a maintenance job" a single-edit operation. Worth doing once a 5th job appears; not urgent at 4.

---

### 4. Outbox poll loop has no error handling and can overlap

- **Severity:** Medium
- **Category:** Architectural Weakness
- **Location:** `packages/composition/src/worker/outbox-relay.service.ts:37-41`

**Problem.** `setInterval(() => void this.drain(), pollIntervalMs)` fires unconditionally:

- `drain()` has **no `try/catch`**. A transient DB error (pool exhaustion, timeout) makes the fire-and-forget promise reject → **unhandled promise rejection**, and the interval keeps firing into the same failure.
- The interval does not wait for the previous `drain()` (which itself loops while batches are full). Under load, drains **overlap**. `SKIP LOCKED` keeps this _correct_, but it wastes DB round-trips and connections.

**Recommendation.** Wrap the body in `try/catch` with structured logging, and use a self-rescheduling `setTimeout` (or an `#isDraining` guard) instead of `setInterval` so a new poll only starts after the previous one finishes. Add small jitter to avoid thundering-herd polling across replicas.

---

### 5. No job retention limits — Redis grows unbounded

- **Severity:** Medium
- **Category:** Architectural Weakness (operational)
- **Location:** `packages/infrastructure/messaging/src/kernel/messaging-infrastructure.module.ts:36-54`

**Problem.** The `outbox` queue sets `attempts`/`backoff` but **no `removeOnComplete`/`removeOnFail`**; the `maintenance` queue has **no `defaultJobOptions` at all**. By default BullMQ retains completed and failed jobs indefinitely. `infrastructure.md` explicitly treats Redis as ephemeral, yet completed/failed job hashes accumulate forever → steady memory growth and eventual eviction/OOM.

**Recommendation.** Set retention on both queues, e.g. `removeOnComplete: {age: 3600, count: 1000}` and a bounded `removeOnFail: {age: 86_400}`. Keep failed jobs long enough to inspect, but bounded.

---

### 6. Worker-level errors and job failures are unobserved; fixed concurrency

- **Severity:** Medium
- **Category:** Architectural Weakness (observability)
- **Location:** `packages/infrastructure/messaging/src/jobs/queue-worker.factory.ts`

**Problem.** `QueueWorkerFactory.create` builds a `Worker` with **no `error`/`failed` event listeners** and **no `concurrency`/limiter**. Consequences:

- Worker-level failures (Redis disconnects, deserialization errors) and per-job failures are **silent** — nothing is logged or metered. Combined with Finding 5, a failing outbox event fails 3× and vanishes with no operator signal.
- Default `concurrency: 1` means the outbox queue processes strictly one job at a time per replica, which may bottleneck throughput as event volume grows.

**Recommendation.** In the factory, attach `worker.on('failed', …)` / `worker.on('error', …)` → structured log + metric (include `jobId`, `name`, `attemptsMade`). Expose `concurrency` (and optionally a rate limiter) as a per-queue option so the outbox queue can scale independently of maintenance.

---

### 7. At-least-once delivery, but the idempotency store isn't wired in

- **Severity:** Medium
- **Category:** Architectural Weakness
- **Location:** `outbox-event-processor.service.ts` dispatch path; `packages/infrastructure/postgres/src/kernel/idempotency/postgres-idempotency.store.ts` (exists, unused here)

**Problem.** Reclaiming stale `processing` rows to `pending` yields **at-least-once** semantics: a crash between a successful handler and `relay.complete` will re-dispatch the event. Today the only handler _logs_, so duplicates are harmless. But the architecture targets audit fan-out and invite emails, where a duplicate = a duplicate email / double audit row. A `PostgresIdempotencyStore` already exists in the codebase but is **not** used in the dispatch path.

**Recommendation.** Before this carries side-effectful handlers, route dispatch through the idempotency store keyed by `outboxId` (or a stable event id), and **document the at-least-once contract** so every handler author knows handlers must be idempotent. This is not urgent for the MVP logger, but should land before the first real reaction.

---

### 8. Two parallel config-loading paths in the worker

- **Severity:** Medium
- **Category:** Architecture Weakness
- **Location:** `apps/worker/src/app/app.module.ts` (loads `WORKER_ENV`) vs. `packages/composition/src/worker/worker.module.ts:32-39` (`loadMessagingConfigFromEnv()` / `loadPostgresConfigFromEnv()`)

**Problem.** `apps/worker` builds a large `WORKER_ENV` object through `ConfigLoader` — including `REDIS_URL` and `BULLMQ_PREFIX`. But `WorkerModule.forRootAsync` **re-reads `process.env`** independently via `loadMessagingConfigFromEnv()` and `loadPostgresConfigFromEnv()`. So `REDIS_URL`/`BULLMQ_PREFIX` are declared and validated in the app schema **and** re-read + re-validated inside infra factories. `config.mdc` says apps own the schemas and pass values down; here infra packages reach back into `process.env`. This means two validation surfaces, possible drift (an app that sets `BULLMQ_PREFIX` in `WORKER_ENV` but the messaging module reads a different default), and harder testing (can't inject config without touching `process.env`).

**Recommendation.** Load env **once** in the app and pass typed config down: have `WorkerModule.forRootAsync` accept messaging/postgres config (or the `WORKER_ENV` token) via `inject`/`useFactory`, instead of the infra factories re-reading `process.env`. Keep `loadMessagingConfigFromEnv` as a convenience for standalone use, but don't invoke it from a path where the app already owns the env.

---

### 9. Minor issues

| #   | Severity | Location                                   | Note                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9a  | Low      | `messaging-infrastructure.module.ts:37,45` | Queue factories type config inline as `{BULLMQ_PREFIX: string}` instead of `MessagingConfig` — loses type-safety if the config shape evolves. Use the real type.                                                                                                                                                                                                                     |
| 9b  | Low      | `maintenance` queue                        | No `attempts` → default 1. A transient purge/reclaim failure is dropped until the next scheduled tick. Acceptable (idempotent + repeatable), but a small `attempts` with backoff would smooth over blips.                                                                                                                                                                            |
| 9c  | Low      | `outbox-relay.service.ts:28-41`            | The relay service has **two responsibilities**: registering the logging handler on the shared `EventBus` _and_ running the poll loop. Registration also happens here while dispatch happens in a different service via the same singleton — coupling through shared mutable state. Splitting handler-registration out (see Finding 1, wildcard option) improves SRP and testability. |
| 9d  | Low      | outbox `failed` rows                       | Terminal `failed` rows have no dead-letter surface, metric, or requeue path. Pair with Finding 6 (emit a metric) and add an ops runbook / admin requeue before production.                                                                                                                                                                                                           |

---

## New Practices Worth Introducing

- **Queue defaults policy.** Standardize `removeOnComplete` / `removeOnFail` / `attempts` / `backoff` in one place (e.g. a `defaultJobOptions` factory in `messaging`) so every queue is bounded and retried consistently.
- **Worker telemetry.** `failed`/`error`/`stalled` listeners → logs + counters, wired through the existing `telemetry` package. This is the single highest-leverage operational add.
- **Idempotent-handler contract.** Document at-least-once + provide the idempotency-store wrapper as the default dispatch path.
- **Compile-time event-catalog guard.** The `_AssertNoDrift` pattern (Finding 1) turns "forgot to register an event" into a build error.

## Deferred / Optional

- Configurable per-queue **concurrency and rate limiting** — add when event volume justifies it.
- A **dead-letter queue / admin requeue UI** for terminally-failed outbox rows.
- **Poll jitter / adaptive backoff** on the relay to reduce idle DB polling across many replicas.

---

## Final Assessment

**Change soon (correctness/ownership):**

- Finding 1 — move the event catalog to the domain (or drop it via a wildcard handler); it already drifts and can silently swallow events.
- Findings 5 & 6 — job retention + worker error/failed observability; these are cheap and prevent silent Redis growth and invisible failures.

**Change before real side-effectful handlers ship:**

- Finding 7 — idempotency wrapper + documented at-least-once contract.
- Finding 4 — poll-loop error handling + overlap guard.

**Worth doing, low urgency (style/consistency you flagged):**

- Findings 2 & 3 — table-driven dispatch and registration; small, safe refactors.
- Finding 8 — collapse the duplicate config-loading paths.

**Leave as-is:** the outbox claim/complete ordering, `SKIP LOCKED` usage, the dedicated ioredis connection setup, tenant-context restoration, and the overall layer boundaries. These are correct and should be preserved.

**No architectural decision is required** — every finding fits within the existing outbox + BullMQ design documented in `infrastructure.md`. The one item that _touches_ architecture (Finding 1, event-catalog ownership) is a relocation within existing layers, not a new pattern.
