# Transport Layer Review — `apps/api` + `nest-http`

Reviewer pass over the HTTP transport layer: process bootstrap, `ApiBuilder`, global pipe/filter/serializer, the auth/ALS interceptors, and OpenAPI. Focus areas requested: overall improvement of the transport setup and **observability integration**.

Sources of truth used: `docs/architecture/backend.md`, `docs/architecture/decisions.md` (ADR-027), `docs/implementation-plan.md` (§7 deferred), and `.cursor/rules/*`.

Scope reviewed:

- `apps/api/src/main.ts`, `app/app.module.ts`, `common/**`
- `packages/nest-http/src/**` (`ApiBuilder`, `createHttpProviders`, `ApiExceptionFilter`, `OpenApi`, process handlers, pipe/serializer)

---

# Summary

The transport layer is **clean, well-bounded, and correct for the current phase**. Layer discipline is excellent: `apps/api` never touches `postgres`/`domain`/`application`, and `nest-http` is delivery-only. The `ApiBuilder` fluent bootstrap, fail-closed CORS, constant-time Swagger basic-auth, and centralized coded-error envelope are all above-average for a starter kit.

The gaps are almost entirely **observability and production-hardening**, and they are known/deferred (ADR-027, implementation-plan §7). The most important structural point: **there is currently no request-scoped context**, so nothing — logs, errors, future metrics — can be correlated to a request, tenant, or actor. That single missing primitive is the foundation everything else (access logs, tracing, metrics exemplars) should build on, so it should be introduced first and deliberately, respecting the layer rules.

Nothing here is a blocker for the current milestone. The recommendations are about what to build **next** and how to keep it inside the existing boundaries.

---

# Strengths

Worth preserving:

- **Strict layering.** `apps/api` depends only on `nest-http`, `composition`, `contracts`, `logger`. `nest-http` depends on Nest + `contracts` + `platform` (`LoggerLocator`) only. This is the hard part and it's done right.
- **Fail-closed CORS in production** (`ApiBuilder.enableCors` throws when `isProduction && corsOrigins` empty) — good default posture.
- **Constant-time Swagger basic-auth** using `timingSafeEqual`, and it also guards `/docs-json` / `/docs-yaml`, not just the UI. Easy to get wrong; done correctly.
- **Coded-error envelope is centralized** in `ApiExceptionFilter` with no domain-error imports — the kit stays decoupled from the domain while still mapping `{code, message}`.
- **App-specific authorization** (`@RequirePermission`) runs _inside_ the tenant ALS scope, and the coarse `@Public` seam lives in the kit — correct separation.
- **Process-level safety net** (`unhandledRejection` / `uncaughtException` → `fatal`) and `enableShutdownHooks()` are wired.
- **Structured logger port** with `context()` children and authorization-header redaction.

---

# Findings

Ordered by severity. Category tags per the reviewer rubric.

## 1. No request-scoped context (correlation id / tenant / actor) — **High, Architectural Weakness (Observability)**

**Location:** `apps/api` transport + `packages/infrastructure/logger`, `packages/platform`.

**Problem.** There is no request id and no request-scoped store. `PinoLogger.context(name)` only attaches a static `context` string. A log line from `ApiExceptionFilter` or any use case cannot be tied to the HTTP request, tenant, or actor that produced it. ADR-027 and implementation-plan §7 both explicitly defer the "Request/tenant ALS log mixin" — this review is flagging that it is now the highest-value increment.

**Why it matters.** Without a correlation id you cannot: follow one request across log lines, join API logs to future worker/outbox logs, attach tenant/actor to errors for support triage, or later hang trace/span ids off the same key. Every other observability feature below is degraded without it.

**Recommendation.** Introduce a generic request-scoped ALS as a **platform** primitive (peer of `LoggerLocator`), so both `nest-http` and the logger adapter can use it without a layer violation:

```typescript
// packages/platform — RequestContextLocator (ALS), framework-free
export type RequestContext = {
  requestId: string
  tenantId?: string
  actorId?: string
}
// run(ctx, work), get(): RequestContext | undefined
```

- In `apps/api` (or a small `nest-http` interceptor), read/generate `x-request-id` and open the ALS scope at the very start of the request.
- Add a Pino **mixin** in `packages/infrastructure/logger` (already depends on `platform`) that spreads `RequestContextLocator.get()` onto every line. No app code changes, no layer break.
- Bind `tenantId`/`actorId` into the same context from `DevPrincipalInterceptor` (later, the JWT guard) so authenticated requests are automatically enriched.

This is the keystone; do it before access logs, metrics, or tracing.

## 2. No HTTP access logging — **High, Architectural Weakness (Observability)**

**Location:** `packages/nest-http` (no logging interceptor/middleware).

**Problem.** Only _unhandled_ and _serialization_ exceptions are logged. Successful requests and, crucially, **all 4xx `HttpException`s (401/403/404/409) are never logged.** A brute-force 401 storm or a 403 authorization regression is invisible in the logs.

**Why it matters.** Access logs are the baseline signal for latency, error rate, and traffic shape (RED). Their absence means you're blind to everything short of a 500.

**Recommendation.** Add an opt-in access-log interceptor to `nest-http` that emits exactly one structured "request completed" line per request:

```typescript
// method, route (templated, not raw URL), statusCode, durationMs, requestId, tenantId
LoggerLocator.get().context('http').info({method, route, statusCode, durationMs, requestId}, 'request completed')
```

- Skip health/docs paths to avoid noise.
- Log level by class: 5xx → `error`, 4xx → `warn`, else `info`.
- Emit even on thrown exceptions (finalize in `finally`/`catch`) so failed requests are still counted.

## 3. No metrics / RED instrumentation — **High, Opportunity (Observability)**

**Location:** transport layer as a whole.

**Problem.** There is no `/metrics` endpoint and no request counters/histograms. For a B2B SaaS heading to GCP (per `docs/infrastructure`), rate/error/duration per route is table stakes for dashboards and alerting.

**Why it matters.** Logs answer "what happened in this request"; metrics answer "is the service healthy right now". You need both. Alerting on p95 latency / 5xx rate is not feasible today.

**Recommendation (pick one, prefer the first strategically):**

- **OpenTelemetry** (traces + metrics). Initialize the SDK in `main.ts` **before** `NestFactory.create`, with HTTP/Express and `pg` auto-instrumentation. This gives distributed traces across `transport → use case → Postgres` and metrics in one dependency, and the `traceId` can be folded into the RequestContext from Finding 1 so logs, traces, and metrics share a key. Cost: a non-trivial dependency and an exporter/collector.
- **`prom-client`** + the access-log interceptor from Finding 2 feeding a histogram. Lighter, metrics-only, no tracing. Good interim step if OTel is too heavy now.

Whichever is chosen, keep the wiring in `main.ts` / `nest-http` so the domain stays clean.

## 4. No health / readiness / liveness endpoints — **Medium, Architectural Weakness**

**Location:** `apps/api` (missing), with a DB indicator that must come through `composition`.

**Problem.** There is no `/livez` / `/readyz` / `/health`. A container orchestrator (k8s / Cloud Run) has nothing to probe; readiness cannot reflect Postgres connectivity.

**Why it matters.** Without readiness gating, traffic is routed to instances whose DB pool isn't up; without liveness, wedged instances aren't restarted. Rolling deploys and autoscaling degrade.

**Recommendation.** Use `@nestjs/terminus`. Liveness is a trivial process check. Readiness needs a DB ping — but `apps/api` must not import `postgres`. Respect the boundary by exposing a lightweight readiness capability from `composition` (e.g. a `checkDatabase()` / `HealthCheckPort`) that the terminus indicator in `apps/api` calls. Mark health routes `@Public()` and exclude them from access logs/metrics.

## 5. Exception filter observability & correctness gaps — **Medium, Architectural Weakness / Bug**

**Location:** `packages/nest-http/src/http/filters/api-exception.filter.ts`.

Three distinct issues:

- **5xx `HttpException`s are not logged.** Only `ZodSerializationException` and the final unhandled branch log. A raw `HttpException(500/502/503)` returns to the client silently. Recommend: log **any** response with `status >= 500` regardless of exception type, and include the request id.
- **Coded errors collapse to 409.** Every coded error except `INSUFFICIENT_PERMISSION` becomes `409 Conflict`. A semantically-404 error (`USER_NOT_FOUND`) is returned as 409. This is both a correctness smell and an observability one — unmapped codes are silently miscategorized and never logged. Recommend an explicit `code → HttpStatus` map, with a `warn` log (or dev-time throw) for any code not in the map, defaulting to 409/500 intentionally.
- **No request context in error logs.** Tie the filter's log lines to the RequestContext from Finding 1 (route, method, requestId, tenantId) so a logged error is actionable.

## 6. DevPrincipal header-trust has no environment guard — **High, Security (production-readiness)**

**Location:** `apps/api/src/common/auth/dev-principal.interceptor.ts`, `common/common.module.ts`.

**Problem.** Authentication is a stub that trusts `x-user-id` / `x-tenant-id` request headers. This is intended and documented (JWT replaces it later), **but nothing prevents it from running in production.** If this build shipped as-is, any client could impersonate any user/tenant by setting two headers.

**Why it matters.** It's a total authz bypass if it ever reaches a real environment. The seam is fine; the missing guardrail is the risk.

**Recommendation.** Fail safe: refuse to boot (or refuse header-trust) when `NODE_ENV === 'production'` while the DevPrincipal interceptor is active. Encode the invariant as a test. When JWT lands, this stub module should be removed from the production composition, not merely overridden.

## 7. Global interceptor ordering is implicit — **Medium, Architectural Weakness**

**Location:** `apps/api/src/common/common.module.ts`.

**Problem.** `DevPrincipalInterceptor` must run before `RequirePermissionInterceptor` (the permission check reads the ALS the first one establishes). Both are `APP_INTERCEPTOR`s in the same module, so registration order holds today — but this ordering contract is implicit and would silently break if one moved to another module (cross-module `APP_INTERCEPTOR` order is not guaranteed).

**Why it matters.** A reorder yields `TenantContextNotEstablishedError` (→ 500) or, worse, a permission check against an empty scope. Silent, hard to catch.

**Recommendation.** Document the invariant next to the providers and pin it with a test: a protected route hit without an established principal must fail as 401/403, not 500. Consider a single composite "principal" interceptor to make the ordering intrinsic rather than positional.

## 8. Missing transport hardening: body limits & server timeouts — **Medium, Improvement (situational)**

**Location:** `packages/nest-http/src/builder/api.builder.ts`, `main.ts`.

**Problem.** No explicit JSON body-size limit (relies on Express's implicit 100kb), no server `requestTimeout` / `headersTimeout` / keep-alive tuning.

**Why it matters.** Behind a proxy in production these guard against slow-loris, oversized payloads, and socket exhaustion. Implicit defaults are fine for local dev, risky for prod.

**Recommendation.** Add optional `bodyLimit` and server timeout settings to `ApiHttpConfig`, applied in `ApiBuilder` (`app.use(json({limit}))`, `server.requestTimeout`, `server.headersTimeout`). Keep defaults permissive in dev, tightened in prod.

## 9. `CurrentPrincipal` missing-principal → 500 — **Low, Improvement**

**Location:** `apps/api/src/common/auth/current-principal.decorator.ts`.

If the principal isn't established (misordering, or a route that forgot the interceptor), the decorator throws a plain `Error`, which the filter maps to 500. A missing principal is really a 401. Minor robustness: throw `UnauthorizedException` (or rely on the ordering test from Finding 7).

## 10. Redaction is narrow — **Low, Improvement (observability-linked)**

**Location:** `packages/infrastructure/logger/src/lib/pino-logger.ts`.

Only `authorization` headers are redacted. Latent today (no request logging), but once access logs (Finding 2) exist, expand redaction to `cookie`, `set-cookie`, `x-api-key`, and known secret fields before any header/body logging is enabled.

## 11. Env boolean handling is ad-hoc — **Low, Preference**

**Location:** `apps/api/src/common/config/env.schema.ts`, `map-api-http-config.ts`.

Booleans are `z.enum(['true','false'])` compared with `=== 'true'` and defaulted in the mapper. Works, but a shared `stringToBoolean` Zod helper (in `@b2b-saas-starter-kit/utils` or config) would remove the scattered `=== 'true'` logic and unify defaults. Cosmetic.

---

# Improvements

Concrete, in suggested order:

1. **RequestContext ALS in `platform`** + Pino mixin in `logger` (Finding 1). Foundation.
2. **Access-log interceptor in `nest-http`** (Finding 2), consuming the RequestContext.
3. **Health/readiness via terminus**, DB indicator through a `composition` capability (Finding 4).
4. **Exception-filter hardening**: log all 5xx, explicit code→status map, request context on errors (Finding 5).
5. **Production guard on DevPrincipal** (Finding 6) — small, high-value safety.
6. **Body limits + server timeouts** in `ApiBuilder` config (Finding 8).

---

# New Practices

Worth introducing for a production-bound B2B SaaS:

- **OpenTelemetry** (traces + metrics), initialized before Nest, with `pg`/HTTP auto-instrumentation; fold `traceId` into RequestContext so logs/traces/metrics share a correlation key. Strategic choice that also covers Finding 3.
- **RED metrics per route** (rate/errors/duration) with alerting on p95 latency and 5xx rate.
- **Structured access logs** with templated routes (not raw URLs) to keep cardinality bounded.
- **Readiness that reflects real dependencies** (DB pool) vs. a liveness that's process-only — distinct semantics, distinct endpoints.
- **Interceptor-ordering test** as an executable invariant for the auth pipeline.

---

# Deferred / Optional

- **Distributed tracing across worker/outbox** — valuable once `apps/worker` and the outbox are wired; the RequestContext/trace key designed now makes it free later.
- **Rate limiting** (`@nestjs/throttler`) at the edge — likely belongs at the gateway/proxy first; revisit if the app must self-protect.
- **prom-client-only interim** if OTel is deferred — acceptable stepping stone that reuses the access-log interceptor.
- **Log sampling** for high-traffic success paths — only once volume justifies it.

---

# Final Assessment

- **What should change (soon):** introduce the request-scoped context (correlation id + tenant/actor) and access logging; add health/readiness; harden the exception filter's 5xx logging and code→status mapping; put an environment guard on the DevPrincipal header-trust stub.
- **What should remain as-is:** the layering, `ApiBuilder`, fail-closed CORS, Swagger basic-auth, the coded-error envelope, and the `@Public`/`@RequirePermission` seam. These are solid.
- **What can be deferred:** full OpenTelemetry, worker-spanning tracing, rate limiting, log sampling.
- **Architectural decision required?** One small, deliberate decision: **where the request-scoped ALS lives.** Recommendation — a generic `RequestContextLocator` in `platform` (peer to `LoggerLocator`), consumed by `nest-http` and the Pino mixin in `infrastructure/logger`. This keeps observability enrichment inside the existing dependency rules and unblocks logs, metrics, and tracing from a single primitive. This extends ADR-027's deferred "request/tenant log mixin" into a concrete design; adopt it before building the observability features above.
