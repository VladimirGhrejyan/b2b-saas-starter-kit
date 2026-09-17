# Foundation Review

Strategic review of the reusable generic foundation, based on the repository as it stands (24 Nx projects, 6 apps, three implemented bounded contexts). Sources of truth consulted: `docs/architecture/`, `docs/architecture/frontend-foundation-investigation.md`, `docs/nx_guide.md`, `.cursor/rules/`, `apps/api/docs/transport-layer-review.md`, `packages/infrastructure/postgres/docs/REVIEW.md`, and the actual source of every package and app.

This document is a review only. It proposes nothing that already exists unless the existing implementation is incomplete or weak, and it recommends nothing merely because it is technically possible.

## Executive Summary

The foundation is **strong where it is hardest to get right and thin where it is easiest to postpone**. Layer discipline is genuinely enforced rather than documented: `@nx/enforce-module-boundaries` plus six custom ESLint rules (context isolation, FSD direction, layer purity, file structure) make the dependency rule a build-time guarantee. The domain layer is framework-free with real aggregates and 21 typed domain errors. Tenant isolation is fail-closed by construction. The `UnitOfWork` + `AsyncLocalStorage` transaction model is correct including nesting. Postgres has pool, statement, lock, and idle-in-transaction timeouts with `application_name` attribution. Thirteen compose-backed integration specs and one HTTP e2e exercise real Postgres and Redis. This is well above the norm for a starter kit, and it is the part that would be expensive to retrofit.

Three findings dominate everything else.

**First, the event-driven half of the architecture is scaffolding without a runtime.** All five aggregates faithfully call `this.record(...)` — `UserCreated`, `TenantCreated`, `MembershipRolesReplaced`, `InvitationConsumed`, `RolePermissionsReplaced`, and eleven more. Nothing outside unit tests ever calls `pullEvents()`. There is no event bus, no outbox table, no `infrastructure/messaging` project, and `apps/worker` contains a `hello-world.service.ts`. Events are recorded into a buffer and discarded when the aggregate is garbage-collected. Two Cursor rules (`backend/event-driven.mdc`, `backend/outbox-pattern.mdc`) and `docs/architecture/infrastructure.md` describe infrastructure that does not exist. This single gap blocks the `audit` and `notifications` contexts that ADR-002 promises, blocks reliable email delivery, and blocks every scheduled cleanup the schema already needs (expired refresh sessions, consumed reset tokens, stale invitations).

**Second, a small set of schema-level decisions are missing that are cheap today and painful later.** No table has `created_at` or `updated_at`. No aggregate has a version column. There is no soft delete. Adding temporal columns to eleven populated tables later means backfills with fabricated timestamps, and an `audit` context built afterwards can never reconstruct history it never recorded. Similarly, `paginatedOutputSchema` exists in `contracts`, is exported and tested, and is used by exactly zero endpoints — `GET /v1/tenants/:tenantId/members` and `GET /v1/tenants/:tenantId/roles` return unbounded arrays. Adding pagination later is a breaking API change; establishing it now costs one convention.

**Third, the composition layer inverted dependencies at compile time but not at runtime, and the cost is already visible.** Use cases correctly depend on port interfaces, but `composition.providers.ts` and the three context modules wire them with roughly thirty hand-written `useFactory` blocks that inject **concrete** classes: `inject: [UNIT_OF_WORK, CLOCK, ID_GENERATOR, TypeOrmUserRepository, TypeOrmLocalPasswordRepository, ...]`. The `{provide: UserRepository, useClass: TypeOrmUserRepository}` pattern that `backend.md` and `persistence.md` both present as the mechanism does not appear anywhere. Swapping any adapter means editing every factory that transitively touches it, and each new use case adds a fifteen-line provider block.

Beyond those, the notable gaps are operational rather than architectural: no health or readiness endpoints, no metrics, no tracing, no idempotency, no Dockerfiles or deployment path, and rate limiting that covers only auth routes and fails open. The observability keystone is already in place — `RequestContextLocator` on `platform` with a Pino mixin carrying `requestId`, `tenantId`, and `actorId` — so these are additive rather than structural.

One meta-finding worth stating plainly: **the documentation now understates the implementation, which is its own risk.** `docs/architecture/overview.md` still opens with "Status: **Design finalized, implementation pending.** No applications, packages, entities, or framework wiring exist yet." `README.md` says "The workspace is currently **empty by design**." Both describe a repository from sixty commits ago. A reader who trusts the docs will not find the working authentication stack, the FSD web app, or the twenty packages that exist.

## What We Already Have

### Workspace, boundaries, and enforcement — mature

Layer-first Nx topology exactly as ADR-001 specifies: 24 projects tagged on two axes (`scope:*` × `layer:*`), with bounded contexts as folders inside layer projects. `config/eslint/nx-boundaries.ts` implements every constraint in `docs/architecture/boundaries.md`, and fifteen further ESLint fragments add per-layer purity rules (`domain.ts` forbids Nest/TypeORM/contracts, `platform.ts` ports-only, `contracts.ts` wire-only, `frontend-core.ts` forbids ui-kit and Electron/Capacitor). The custom plugin `@b2b-saas-starter-kit` contributes six rules with their own Vitest suite run separately in CI. TypeScript project references cover all 22 libs and apps with `nx sync:check` guarding drift.

This is the most mature part of the kit and should not be touched except where noted below.

### Domain layer — mature for three contexts

`identity`, `tenancy`, `authorization` implemented; `audit` and `notifications` absent. Five aggregates (`User`, `Tenant`, `Membership`, `Invitation`, `Role`) and three entities (`LocalPassword`, `RefreshSession`, `PasswordResetToken`). Real invariants rather than anemic setters: status-transition guards, system-role immutability via `Role.#assertMutable()`, reserved role names, non-empty unique role-id lists, `PermissionCatalog.assertKnown`, invitation expiry and consumption checks. Twenty-one domain errors all carrying stable `code` strings that the HTTP filter maps without importing a single domain class. Zero framework imports, verified by lint.

### Application layer — good, with known rough edges

Seventeen commands and four queries, with a deliberate `.use-case.ts` / `.query.ts` split. `UnitOfWork` wraps every write. `AuthorizationPort.require()` is called inside use cases on all tenant-scoped operations, so workers and other non-HTTP callers get the same authoritative check the controllers get. Published ports (`AuthorizationPort`, `MembershipRolesPort`) live in `application/src/shared/` so contexts depend on an interface rather than a sibling. A full in-memory fake suite is exported via `@b2b-saas-starter-kit/application/testing`, which makes use cases testable with no Nest harness.

### Platform ports — good coverage

Thirteen-plus ports: `CachePort`, `LockPort`, `PubSubPort`, `RateLimiterPort`, `UnitOfWork`, `Clock`, `IdGenerator`, `Logger`, `MailerPort`, `PasswordHasher`, `TokenDigest`, `HttpClientPort`, `TenantContext`. Two process locators (`LoggerLocator`, `RequestContextLocator`) that keep Pino out of the application layer while still giving every log line request correlation. `CacheKey.tenant()` enforces the `t:<tenantId>:` prefix convention.

### Persistence — mature core, hardening partially done

Custom `DataSource` lifecycle (no `@nestjs/typeorm`), eleven entities across three context folders, six reviewed migrations with a context-prefix convention, and a migration CLI exposed as Nx targets. `TenantAwareRepository` fails closed on both reads and writes; the cross-tenant escape hatch is deliberately verbose. `TypeormUnitOfWork` joins an ambient transaction correctly via ALS and keeps `TxContext` as `{id}` so no `EntityManager` leaks into `platform`. Cross-context references are UUID columns with no foreign keys, per ADR-008. Migration style is good where it matters: the invitations migration uses a partial unique index on pending invites, and the admin-permission backfill is idempotent via `NOT EXISTS`.

### Redis, HTTP client, and security adapters — solid

`RedisLock` is a correct single-node lock: `SET NX` with a random token and Lua compare-and-delete on release, with an integration test for the stale-release case. `RedisRateLimiter` is a Lua fixed-window counter. The undici HTTP client is the most production-hardened adapter in the repo — pooled agent, connect and overall timeouts, retry with backoff on network/timeout/429/503, `Idempotency-Key` and `x-request-id` propagation, response size cap, proxy support, same-host redirect restriction. Argon2id password hashing with SHA-256 token digests, UUIDv7 ids, UTC clock.

### HTTP transport — good

`packages/nest-http` is a genuine reusable kit: `ApiBuilder` fluent bootstrap, helmet, fail-closed CORS in production, URI versioning, constant-time Swagger basic auth covering `/docs-json` and `/docs-yaml`, global Zod validation and serialization, an exception filter that logs all 5xx and never leaks internals, request-id generation with structured access logs, and process-level `unhandledRejection`/`uncaughtException` handlers. `apps/api` stays thin: 7 controllers, 25 routes, no imports of `domain`, `application`, or `postgres`.

### Authentication and authorization — good

Argon2id passwords on a separate `LocalPassword` record so `User` stays credential-free. HS256 access JWT with `sub`, optional `tid`, `jti`, `iss`, `aud`, verified on both issuer and audience. Rotating opaque refresh tokens with family revocation on reuse detection, offered over two transports (HttpOnly cookie path-scoped to `/v1/auth` for web, JSON body for native). `assertAuthBootstrap` refuses to boot production with the development secret. Header-trust fallback is gated to `development`/`test`. Permission-based RBAC with a seven-permission catalog, three seeded system roles, tenant-defined custom roles, and cache-aside effective permissions with explicit invalidation on membership and role writes.

### Frontend — working foundation

`frontend/core` is a real kernel: store factory, singleton RTK Query API with `credentials: 'include'`, Bearer `prepareHeaders`, 401 handling that performs a **single-flight** cookie refresh and one retry, error mapping onto the shared `errorOutputSchema`, session slice, `can`/`useCan`/`<Can>`, i18next factory with lazy namespaces persisted through `StoragePort`, router factory supporting browser and hash history, and four host ports with web adapters. `apps/web` is a functioning FSD SPA — login, `RequireSession` guard, `/me` hydration, tenant switching, permission-gated members list — with MSW-backed integration tests. `apps/desktop` and `apps/mobile` are honest thin hosts over `web/dist` with `contextIsolation: true` and `nodeIntegration: false`, and tests that assert they contain no product FSD.

### Testing and DX — good

Vitest across all 24 projects. Compose-backed integration tests with `PostgresTestContext`/`RedisTestContext` harnesses that create isolated test databases. Per-package `./testing` subpath exports instead of a shared test-utils dumping ground. Husky with lint-staged, commitlint enforcing `type(VC-N): subject`, branch-name validation, and a `check:node-version` guard tying `.nvmrc` to `engines`. CI runs format, lint, `sync:check`, plugin tests, and `nx affected -t typecheck,test,build` against live Postgres and Redis.

## Improvements to Existing Foundation

### 1. Domain events are recorded and discarded

**Current state.** `AggregateRoot.record()` / `pullEvents()` exist and work. All five aggregates emit events on every meaningful state change. `packages/domain/src/tenancy/tenant.spec.ts` and its siblings assert the event payloads.

**Issue.** No production code path calls `pullEvents()`. There is no `EventBus` port on `platform`, no dispatcher in `application`, no outbox table, no `infrastructure/messaging` project. The events are dead weight that gives a false impression the pattern is wired. Worse, the Cursor rules instruct contributors to follow an outbox pattern that has no implementation, so the first person to add a reactive feature will invent their own mechanism.

**Recommendation.** Close the loop in the order that keeps each step useful on its own. Add an `EventPublisher` port to `platform` and have use cases call `publisher.publish(aggregate.pullEvents())` inside the `UnitOfWork` before commit. Back it with an `outbox` table written in the same transaction, so the atomicity guarantee the docs claim is real. Then give `apps/worker` a relay that polls unpublished rows and an in-process dispatcher for same-process handlers. Keep the queue technology decision separate: a polling relay with `FOR UPDATE SKIP LOCKED` needs no BullMQ at all, and deferring BullMQ until there is a job with real retry/backoff requirements avoids committing Redis to `noeviction` duty prematurely.

**Architectural impact.** New `platform` port; a new `outbox` table and repository in `postgres/kernel`; a new `layer:infrastructure` project only if a queue is adopted; `apps/worker` becomes a real delivery app importing `composition`. No change to the dependency rule — the publisher is just another port.

**Priority.** Essential foundation. This is the single highest-leverage change, because `audit`, `notifications`, and all scheduled cleanup depend on it.

### 2. No temporal, concurrency, or lifecycle columns on any table

**Current state.** Eleven entities, none with `created_at`, `updated_at`, `deleted_at`, or a version column.

**Issue.** Three distinct problems wearing one costume. Operationally, you cannot answer "when did this membership change?" — which is the first question every support ticket asks. Architecturally, an `audit` context added later cannot backfill history that was never recorded. For correctness, the absence of a version column means the role and membership aggregates have no optimistic-concurrency defence, which compounds the delete-then-insert race already flagged in `postgres/docs/REVIEW.md` finding 4.

**Recommendation.** Add `created_at` and `updated_at` to every table now, and a `version` column to the aggregates with child collections (`roles`, `memberships`). Implement it as a shared TypeORM base entity in `postgres/kernel/persistence` alongside `TenantAwareRepository`, with the mapper convention extended to carry them. Do **not** add soft delete globally — it is a per-aggregate decision with real query-complexity cost, and none of the current aggregates need it (they use explicit `suspended` statuses, which is better modelling).

**Architectural impact.** One base entity, eleven migrations or one combined migration, a mapper convention update. Domain models need not expose timestamps unless a use case reads them.

**Priority.** Essential foundation. Six migrations exist and the tables are effectively empty; this is nearly free today and expensive at any later point.

### 3. Pagination exists in contracts but no endpoint uses it

**Current state.** `paginatedOutputSchema(itemSchema, meta)` returning `{items, page, pageSize, total}` is implemented, exported, and unit-tested. `tenantMembersOutputSchema` returns `{members: [...]}`; `tenantRolesOutputSchema` is likewise unbounded. `MembershipRepository.findByTenant` and `RoleRepository.findByTenant` have no `take`/`skip`.

**Issue.** A tenant with 10,000 members will load 10,000 rows, then — because `ListTenantMembersQuery` calls `users.findById` per member — issue 10,000 additional queries, then serialize the lot through Zod. Retrofitting pagination changes the response shape, so it is a breaking contract change once any client depends on it.

**Recommendation.** Make paginated list endpoints the convention before there are more of them: a shared `paginationInputSchema` in `contracts/common/pagination`, cursor or offset parameters threaded through query objects into repository ports, and the two existing list endpoints converted. Fix the N+1 in the same pass with a batch `findByIds` on `UserRepository`.

**Architectural impact.** Repository port signatures change; query result types gain page metadata; two endpoint contracts change. Cheap now with one frontend consumer.

**Priority.** Essential foundation.

### 4. Port-to-adapter binding is not actually inverted at runtime

**Current state.** `composition.providers.ts` (215 lines) plus three context modules contain roughly thirty `useFactory` blocks. Each lists concrete classes in `inject`. Example from `IdentityModule`: `LoginUseCase` is constructed with nine positional arguments and an `inject` array naming `TypeOrmUserRepository`, `TypeOrmLocalPasswordRepository`, `TypeOrmRefreshSessionRepository`, `TypeOrmMembershipRepository`.

**Issue.** Compile-time inversion is preserved — use cases genuinely depend on interfaces — but runtime substitution is not. There is no seam at which an adapter can be swapped; you edit every factory that transitively reaches it. The verbosity is not incidental: each new use case costs a fifteen-line provider block, and argument order is positional, so a reordering mistake is a runtime type confusion rather than a compile error. It also contradicts the documented mechanism in two architecture documents, which is how documentation loses authority. A related inconsistency: `UNIT_OF_WORK` and `MAILER` tokens live in `postgres`, meaning the adapter package owns the port's identity.

**Recommendation.** Introduce `Symbol` DI tokens colocated with each port — `USER_REPOSITORY` next to `UserRepository` in `domain/identity/ports`, and move `UNIT_OF_WORK` to `platform` next to the port it identifies. Symbols are pure JavaScript, so domain purity is preserved and the existing lint rules stay green. Then bind `{provide: USER_REPOSITORY, useClass: TypeOrmUserRepository}` once per port and let use cases be registered as plain classes with `@Inject(USER_REPOSITORY)` parameter decorators. This removes almost all thirty factories.

**Architectural impact.** Adds a token export next to every port; `application` gains `@Inject` alongside the already-tolerated `@Injectable`, which is a widening of the ADR-010 seam and deserves an explicit ADR amendment rather than a silent change. Trade-off: `@Inject` in the application layer is a real (if small) increase in framework coupling. The alternative — keeping factories but generating them — is worse. If the widening is unacceptable, the fallback is to keep factories but bind them to tokens rather than concrete classes, which preserves substitutability at the cost of the boilerplate.

**Priority.** Strongly recommended. Not urgent for correctness, but the cost grows linearly with every use case added, and `audit` plus `notifications` will roughly double the count.

### 5. Nx tag constraints are bypassable by re-export, and already are

**Current state.** `apps/api` is forbidden from importing `layer:platform`, `redis`, `security`, or `node`. `RateLimitInterceptor` in `apps/api` nonetheless imports `RateLimiterPort`, `CacheKey`, `RATE_LIMITER`, and `RateLimitExceededError` — all platform/redis symbols — from `@b2b-saas-starter-kit/composition`, which re-exports them.

**Issue.** The lint passes and the intent is defeated. This is not a hack someone snuck in; it is the natural consequence of a constraint that forbids a dependency the app genuinely needs. But it means the constraint no longer tells a reader anything reliable, and the next contributor will reasonably conclude that re-exporting through composition is the sanctioned way around any boundary.

**Recommendation.** Make it honest. Either add `layer:platform` to the `type:app` allow-list — apps legitimately need port types and error classes for edge concerns — or define a deliberate, documented app-facing surface on `composition` (an explicit `./app-surface` subpath) and state that re-export through composition is a design decision rather than an accident. The first is simpler and I would pick it; platform is interfaces and error classes only, so allowing it costs no coupling to infrastructure.

**Architectural impact.** One line in `nx-boundaries.ts` plus an ADR note. `boundaries.md` currently lists `type:app → platform` among "the forbidden edges (why they matter)", so that section needs correcting either way.

**Priority.** Strongly recommended — cheap, and boundary rules that do not mean what they say are worse than no rules.

### 6. Authorization resolution has unbounded and N+1 queries

**Current state.** `AuthorizationService.resolvePermissions` loops role ids calling `roles.findById(roleId)` one at a time. `invalidateHoldersOf(roleId, tenantId)` calls `memberships.findByTenant(tenantId)` — loading every membership in the tenant — then invalidates cache keys in a sequential loop.

**Issue.** `resolvePermissions` runs on every cache miss, which is every permission check after a 300-second TTL expiry, so the N+1 is on the hot authorization path. `invalidateHoldersOf` runs on every custom-role update and scales with tenant size; for a large tenant it is a full table scan plus one Redis round-trip per member, inside a request.

**Recommendation.** Add `findByIds(roleIds)` to `RoleRepository` and a membership lookup filtered by role id (`findByTenantAndRole`) so invalidation touches only affected members. For invalidation specifically, consider a generation counter per tenant in the cache key instead of enumerating holders — bumping one key invalidates everything derived from it and turns an O(members) operation into O(1).

**Architectural impact.** Two repository port methods, or a cache-key strategy change in `application/authorization`. Contained.

**Priority.** Strongly recommended.

### 7. Repository concurrency issues from the persistence review remain open

**Current state.** `postgres/docs/REVIEW.md` findings 3, 4, and 5 are documented as "should change soon" and are still present in the code.

**Issue.** Finding 3: `TypeOrmRoleRepository.save()` performs upsert-parent, delete-children, insert-children as three statements, and `manager` silently falls back to `dataSource.manager` (auto-commit) when no ambient transaction exists — so correctness depends on the caller remembering `uow.run`. Finding 4: the delete-then-insert child replacement is racy under READ COMMITTED. Finding 5: `scoped()` binds `:tenantId`, colliding with the same parameter name in `findByTenant(tenantId)`, so the explicit argument is silently overridden by the ambient value. Finding 5 fails closed and is not a leak, but it silently ignores an explicit argument, which will mask a bug eventually.

**Recommendation.** Assert an ambient transaction for multi-statement writes rather than falling back to auto-commit — that matches the explicit-UoW design better than implicitly wrapping. Take a row lock on the parent within the transaction for child replacement, which the new version column (improvement 2) makes cheaper to reason about. Rename the ambient parameter to something collision-proof and have `findByTenant` call `assertTenant`.

**Architectural impact.** Confined to `postgres/kernel/persistence` and two repositories.

**Priority.** Strongly recommended — these are latent correctness bugs, not style issues.

### 8. Rate limiting is auth-only, IP-keyed, globally scoped, and fails open

**Current state.** `@RateLimit` decorator applied to auth routes only. Keys are `CacheKey.global('rate-limit', bucket, clientIp)`. On any limiter error the interceptor logs a warning and allows the request.

**Issue.** Three separate gaps. No business endpoint has any limit, so an authenticated client can hammer `GET /v1/tenants/:id/members` (which, per improvement 3, is unbounded) freely. Keys are global rather than tenant-scoped, so one tenant's traffic can exhaust another's budget — the exact cross-tenant leakage that `multi-tenancy.md` requires tenant-prefixed keys to prevent. And fail-open on the login endpoint means a Redis outage silently removes brute-force protection.

**Recommendation.** Add a conservative default limit for authenticated routes keyed by `(tenantId, actorId)` using `CacheKey.tenant`, keep the stricter IP-keyed buckets on unauthenticated auth routes, and make the failure mode explicit per bucket rather than uniform — fail closed on credential endpoints, fail open on ordinary reads. This is a deliberate availability-versus-security choice and should be a documented decision, not an incidental `catch`.

**Architectural impact.** `apps/api` interceptor and bucket config only.

**Priority.** Strongly recommended.

### 9. Redis client is single, shared, and lightly configured

**Current state.** One ioredis client with `keyPrefix` and `maxRetriesPerRequest: 1`. No `retryStrategy`, no reconnect tuning, no TLS options, no health surface. `RedisPubSub` correctly duplicates for its subscriber.

**Issue.** `maxRetriesPerRequest: 1` with no backoff strategy means a brief Redis blip surfaces as errors immediately — which, given the fail-open rate limiter and cache-aside authorization, degrades security posture rather than availability. A single client also cannot serve blocking operations, so adopting BullMQ later requires a second connection anyway.

**Recommendation.** Configure an explicit `retryStrategy` with bounded exponential backoff and TLS options driven by the URL scheme; expose a readiness probe (see missing capability 2). Separate the connection used for blocking operations when and if a queue arrives.

**Architectural impact.** `redis/kernel/connection` only.

**Priority.** Useful but optional now; becomes strongly recommended the moment anything besides cache uses Redis in production.

### 10. `Result` is dead, `DomainEvent` is loosely typed, no value objects

**Current state.** `domain/shared-kernel/result.ts` implements a `Result` type with `ok`/`fail`/`isOk`/`isFail` and a passing spec. It is used nowhere — aggregates throw `DomainError` via `Guard`. `DomainEvent` is `{type, occurredAt} & Record<string, unknown>`. Email, display name, tenant name, and role name are plain strings normalized privately inside aggregates.

**Issue.** `Result` is an abstraction a reader will assume is the error convention, then discover is not — in a teaching kit that is actively misleading. `DomainEvent`'s index signature means an event payload is unvalidated at compile time; once events are dispatched to handlers (improvement 1), handlers will cast. The absent value objects are a legitimate simplification, not a defect, but the email-validation regex now lives duplicated in `User` and `Invitation`.

**Recommendation.** Delete `Result` or document explicitly why it exists unused; throwing typed `DomainError` is the right convention and should be the only one. Give each context typed event unions before dispatch exists, so handlers pattern-match on a discriminated union rather than cast. Leave primitives as-is except for extracting the shared email normalization — a full value-object layer is not warranted at this size and `backend.md` already says to promote structure only when complexity appears.

**Architectural impact.** Small, contained in `domain`.

**Priority.** Useful but optional, except the typed event unions, which should land with improvement 1.

### 11. Mailer is a plain-text SMTP call with no delivery guarantee

**Current state.** `MailerPort.send({to, subject, text})`, `SmtpMailer` over nodemailer, `LoggingMailer` fallback when `SMTP_HOST` is unset. Called inline from `InviteMemberUseCase` and `RequestPasswordResetUseCase`, inside the `UnitOfWork`.

**Issue.** Sending inside the transaction means an SMTP timeout rolls back the invitation, and an SMTP success followed by a commit failure sends an invitation for a record that does not exist. There is no retry, no template layer, and no delivery status. This is the textbook case the outbox exists to solve, and the kit already has the invitation flow that needs it.

**Recommendation.** Once improvement 1 lands, publish a `MailRequested` event to the outbox rather than sending inline. Keep `MailerPort` as-is — it is a good minimal port — and let the worker own retry.

**Architectural impact.** Depends on improvement 1. Two use cases change; the port does not.

**Priority.** Strongly recommended, sequenced after the outbox.

### 12. Documentation has drifted from implementation

**Current state.** `overview.md` declares implementation pending and states no packages or entities exist. `README.md` calls the workspace empty by design and tells the reader to generate applications. `backend.md` and `persistence.md` show a port-binding pattern the code does not use. `authorization.md` places the `AuthorizationPort` implementation in infrastructure; it is in `application`. `docs/todos/devex.md` lists Docker Compose and workspace-wide Vitest as future work; both exist.

**Issue.** These documents are declared the source of truth, and the Cursor rules point at them. Stale authority is worse than absent authority because agents and contributors act on it.

**Recommendation.** Refresh the status headers and the specific mismatches. Since architecture docs are out of scope for edits in this review, the concrete list is: `overview.md` status block, `README.md` "What is This?" and "Next Steps", the `{provide, useClass}` examples in `backend.md` and `persistence.md`, the `AuthorizationPort` placement sentence in `authorization.md`, the forbidden-edge list in `boundaries.md` (see improvement 5), and the completed items in `devex.md`.

**Architectural impact.** None.

**Priority.** Strongly recommended.

### 13. Frontend host abstraction is designed but only half-used

**Current state.** Four host ports (`StoragePort`, `RuntimeInfoPort`, `NavigationPort`, `NotificationPort`) with web adapters in `frontend-core`. `apps/web` calls `configureHostAdapters` at bootstrap.

**Issue.** `apps/desktop` and `apps/mobile` load `web/dist` and never provide platform-specific adapters, so `NotificationPort` on desktop uses the browser Notification API rather than Electron's, and token storage on mobile uses `localStorage` rather than secure storage. The `frontend-foundation-investigation.md` recommendation is implemented as a seam without the implementations that justify it. Separately, refresh tokens are held in `sessionStorage` on native transports, which is the weakest of the available options on mobile.

**Recommendation.** Either provide the two or three native adapters that make the seam real (Electron notifications, Capacitor `Preferences`/secure storage), or note explicitly in the frontend docs that hosts are currently untailored. Leaning toward the former for storage specifically, since token storage is a security property rather than a nicety.

**Architectural impact.** Host apps gain a small adapter module and an injection point; `frontend-core` unchanged.

**Priority.** Useful but optional overall; the mobile token-storage adapter is strongly recommended before any real mobile build ships.

### 14. `ui-kit` is a single button and blocks feature work

**Current state.** One native `<button>`. `design-system.md` explicitly defers the technology choice.

**Issue.** Deferring was correct at the start, but `apps/web` now has real screens, so the components are being written in `apps/web` instead — meaning the eventual design-system adoption becomes a migration rather than a greenfield choice. The FSD `shared/ui` layer and `ui-kit` will keep diverging.

**Recommendation.** Make the styling decision now, before more screens exist. The decision itself is a product call, not something this review should make; what matters architecturally is that the boundary between `ui-kit` (generic, product-agnostic) and `apps/web/src/shared/ui` (product composition) is stated and lint-enforced before the divergence grows.

**Priority.** Strongly recommended as a decision; the implementation volume is product-specific.

### 15. `apps/admin` is a placeholder while `web` is real

**Current state.** `admin` renders `<h1>admin</h1>` with a smoke test. ADR-016 justifies two apps by audience separation.

**Issue.** Not a defect — but the asymmetry means the "two apps sharing `frontend-core`" claim is untested. Anything `web` needed that quietly landed in `apps/web` instead of `frontend-core` will only be discovered when `admin` is built.

**Recommendation.** Port one meaningful cross-app flow (session bootstrap plus a permission-gated read) into `admin` as a shared-kernel smoke test. Cheap, and it validates the boundary the ADR asserts.

**Priority.** Useful but optional.

## Missing Generic Capabilities

### 1. Idempotency for mutating requests — Essential foundation

**Problem.** No idempotency anywhere in the request path. `HttpClientPort` _sends_ `Idempotency-Key` on outbound calls, so the concept is present on the client side and absent on the server side. A retried `POST /v1/tenants` after a network timeout creates a second tenant.

**Why it belongs in the foundation.** Every mobile client, every webhook sender, and every retrying HTTP client needs it, and it must be uniform across endpoints to be useful. It is also intrusive to add later because it touches the interceptor chain, the transaction boundary, and the response-caching contract simultaneously.

**Proposed capability.** An `IdempotencyPort` on `platform` with a Postgres-backed store (a table keyed by `(tenant_id, key, endpoint)` holding a request fingerprint and the serialized response), plus a `nest-http` interceptor that consumes `Idempotency-Key` on unsafe methods. Postgres rather than Redis, because the record must survive and must commit atomically with the work it guards.

**Suggested package/layer.** Port in `platform`; store in `infrastructure/postgres/kernel`; interceptor in `nest-http`; opt-in per route in `apps/api`.

**Trade-offs.** One extra table and one write per guarded mutation. Requires deciding the semantics of a concurrent in-flight duplicate (409 versus wait) — pick 409, it is simpler and honest.

### 2. Health, readiness, and liveness endpoints — Essential foundation

**Problem.** No `/health`, no `/ready`. `apps/api/docs/transport-layer-review.md` flagged this as high priority and it is still absent. Nothing verifies Postgres or Redis connectivity, and `AppService.getData()` returning `{message: 'Hello API'}` is still routed at `/v1`.

**Why it belongs in the foundation.** Every container orchestrator requires it, the checks are identical across products, and the useful version needs to reach into adapters — which is exactly the kind of wiring that belongs in the kit rather than in each product.

**Proposed capability.** A liveness endpoint that returns process health only, and a readiness endpoint that aggregates registered `HealthIndicator`s. Define the indicator interface in `nest-http` and let each adapter contribute one (`postgres` a `SELECT 1` against the pool, `redis` a `PING`), registered through `composition`. Exclude both from versioning, auth, and access logs.

**Suggested package/layer.** Contract and controller in `nest-http`; indicators in each infrastructure adapter; registration in `composition`.

**Trade-offs.** Readiness that queries dependencies can cause restart storms if wired to a liveness probe — hence the split. Minimal complexity otherwise.

### 3. Object storage / file handling — Strongly recommended

**Problem.** No file abstraction at all. No upload endpoint, no `StoragePort`, no S3 adapter.

**Why it belongs in the foundation.** Avatars, tenant logos, CSV import, and document attachments appear in essentially every B2B product, and the pieces that are easy to get wrong are exactly the generic ones: tenant-scoped key prefixes, presigned-URL issuance so bytes never transit the API, content-type and size validation, and the fact that object keys must be namespaced by tenant for isolation to hold. A product that builds this itself will get the isolation part wrong.

**Proposed capability.** A `FileStoragePort` on `platform` (`put`, `get`, `delete`, `presignPut`, `presignGet`) with tenant prefixing enforced the way `CacheKey.tenant` enforces it for Redis, an S3-compatible adapter, and a local filesystem adapter for development. Presigned URLs as the default upload path.

**Suggested package/layer.** Port in `platform`; new `packages/infrastructure/storage` tagged `layer:infrastructure`; MinIO added to compose for local development.

**Trade-offs.** A new infrastructure package and an external dependency in local development. The presigned-URL flow requires the frontend to handle two-step uploads, which is more moving parts than a direct multipart endpoint but avoids streaming large bodies through the API.

### 4. Metrics and tracing — Strongly recommended

**Problem.** Structured logging with request correlation exists and is good. There are no metrics and no traces. `RequestContextLocator` already carries `requestId`, `tenantId`, `actorId` — the hard part is done.

**Why it belongs in the foundation.** The instrumentation points are all in kit-owned code: the HTTP interceptor chain, the Postgres pool, the Redis client, the outbound HTTP client, and (once it exists) the job worker. A product cannot instrument these without reaching into kit internals, so if the kit does not do it, nobody does.

**Proposed capability.** OpenTelemetry with a `MetricsPort` on `platform` for domain-level counters, auto-instrumentation for HTTP/Postgres/Redis, and a Prometheus scrape endpoint. Critically, propagate `traceId` into the existing Pino mixin so logs and traces join. Tenant id as a span attribute — but **not** as a metric label, since unbounded label cardinality is the classic way to melt a Prometheus instance.

**Suggested package/layer.** Port in `platform`; new `packages/infrastructure/telemetry`; bootstrap hook in `nest-http`'s `ApiBuilder`.

**Trade-offs.** OTel adds meaningful dependency weight and a small per-request cost, and needs a collector in the deployment story. Sampling configuration becomes a thing you must reason about. Defensible to start with metrics only and add tracing when there is more than one service to trace between — but wire `traceId` into the log context from the start either way, because retrofitting correlation into every log call site is the expensive part.

### 5. API keys / machine-to-machine authentication — Strongly recommended

**Problem.** The only credential is a user password producing a user-bound JWT. There is no way for a CI job, a partner integration, or a customer's script to call the API.

**Why it belongs in the foundation.** The design is entirely generic — a tenant-scoped key with a permission subset, a hashed secret, a prefix for identification, last-used tracking, and revocation. It also has non-obvious security requirements (constant-time comparison, never storing the plaintext, showing it exactly once) that are worth solving once. And it slots into the existing model cleanly: an API key is a principal with permissions, and `AuthorizationPort` already speaks permissions.

**Proposed capability.** An `ApiKey` aggregate in the `identity` context, a guard in `nest-http` that resolves a key to the same authenticated-principal shape the JWT guard produces, and CRUD use cases gated on a new `api_key:manage` permission. Reuse `TokenDigest`, which already does SHA-256 hashing for refresh and reset tokens.

**Suggested package/layer.** Aggregate in `domain/identity`; use cases in `application/identity`; entity and repository in `postgres/identity`; guard in `nest-http`.

**Trade-offs.** Introduces a second principal type, so anything assuming `actorId` is a user id needs review — which is why doing it before more use cases exist is cheaper. Adds key rotation and expiry policy decisions.

### 6. Webhook delivery — Useful but optional

**Problem.** No outbound webhook capability. Once the outbox exists, this is a small increment on top of it.

**Why it belongs in the foundation.** Tenant-configurable endpoints, HMAC request signing, exponential-backoff retry with a dead-letter path, and delivery-attempt history are identical in every product that has webhooks, and the signing scheme is a security detail worth centralizing.

**Proposed capability.** A `notifications`-context webhook subscription aggregate consuming outbox events, with signed delivery through the existing `HttpClientPort` (which already has retry, timeouts, and size caps).

**Suggested package/layer.** `domain`/`application` `notifications` context; delivery worker in `apps/worker`.

**Trade-offs.** Which events are publishable becomes a public API surface with compatibility obligations. Genuinely optional — many B2B products never need it. Sequenced strictly after the outbox.

### 7. Configuration and secret-handling hardening — Useful but optional

**Problem.** `ConfigLoader` with Zod validation and a `redactSecrets` helper exists and is decent. But `assertAuthBootstrap` is the only production guard, secrets come from environment variables only, and there is no `.env` layering beyond `infra/env/.env.example`. `apps/api/src/main.ts` has a nested `process.env.HOST ?? process.env.API_HOST ?? '0.0.0.0'` fallback chain that bypasses the loader.

**Why it belongs in the foundation.** Config mistakes are a leading cause of production incidents, and fail-fast validation of the complete config surface at boot is cheap.

**Proposed capability.** Extend the boot-time assertion to the full config surface rather than auth alone; route the remaining direct `process.env` reads through the loader; document the secret-manager integration point without implementing one.

**Suggested package/layer.** `packages/shared/config`, plus removing the `process.env` reads in `apps/api`.

**Trade-offs.** Minimal. Actual secret-manager integration is deployment-specific and should stay out of the kit.

### 8. Deployment artifacts — Useful but optional (for the kit)

**Problem.** No Dockerfiles. `scripts/node/check-node-version.ts` and `.lintstagedrc.json` both reference `infra/docker/*.Dockerfile`; the directory does not exist. No CD workflow. `docker-compose.staging.yml` is referenced in comments only.

**Why it belongs in the foundation.** A multi-stage pnpm-workspace Dockerfile that prunes correctly is fiddly, and `apps/api` already has `prune`/`prune-lockfile` targets suggesting it was planned. Getting the API and worker images right is generic; where they deploy is not.

**Proposed capability.** Multi-stage Dockerfiles for `api` and `worker` plus static builds for `web`/`admin`, and a CI job that builds images without publishing. Leave the deploy target, registry, and orchestration to the product.

**Suggested package/layer.** `infra/docker/`; new CI job in `.github/workflows/`.

**Trade-offs.** Image builds slow CI. Every product will customize the base image anyway, so the value is in the workspace-pruning logic rather than the image itself.

### 9. Scheduled task infrastructure — Strongly recommended

**Problem.** `apps/worker` has no scheduler. Three tables accumulate garbage with nothing to collect it: `identity_refresh_sessions` has `expiresAt` and `revokedAt` but is never pruned, `identity_password_reset_tokens` likewise, and expired `tenancy_invitations` linger forever.

**Why it belongs in the foundation.** The kit created the rows; the kit should clean them up. And the generic hard part — ensuring exactly one instance runs a job when the API is horizontally scaled — is already solved by `LockPort`, which is currently used by nothing.

**Proposed capability.** A small scheduler in `apps/worker` where each tick acquires a Redis lock before running, plus the three cleanup jobs. This finally gives `LockPort` a real consumer and validates it.

**Suggested package/layer.** `apps/worker`; cleanup use cases in `application`; repository methods in `postgres`.

**Trade-offs.** A single-node Redis lock is not a perfect distributed lock; for idempotent cleanup jobs the failure mode (occasional double execution) is harmless, which should be stated rather than assumed.

### 10. Frontend testing depth and a shared MSW layer — Useful but optional

**Problem.** `apps/web` has good MSW-backed integration tests, but the handlers are app-local. There is no E2E harness (`docs/todos/devex.md` defers Playwright), no Storybook, and no coverage thresholds anywhere despite coverage being configured in all 24 projects.

**Why it belongs in the foundation.** MSW handlers derived from the shared Zod contracts would be generated once and reused by `web`, `admin`, and any future host — and would fail loudly when a contract changes, which is a real correctness benefit rather than just convenience.

**Proposed capability.** Contract-derived MSW handlers exported from `frontend-core/testing`. Keep Playwright deferred; the existing HTTP e2e plus MSW integration tests cover more than most kits.

**Trade-offs.** Generated fixtures need maintenance. Low risk.

## Capabilities to Keep Product-Specific

These are useful to applications built on the kit and should not be absorbed into it.

**Billing and subscriptions.** Stripe or otherwise. Pricing models, plan gating, proration, tax, and dunning are business logic disguised as infrastructure, and a wrong abstraction here is worse than none. The kit's job is to make it _possible_: tenant-scoped plan metadata and a permission model that can express entitlements. Nothing more.

**SSO, SAML, and OIDC.** Genuinely generic in the abstract, and genuinely a large surface in practice — per-tenant IdP configuration, metadata exchange, JIT provisioning, attribute mapping, and per-provider quirks. The kit should keep the authentication seam pluggable (it currently does, since `LocalPassword` is a separate record from `User`) and let the product add a provider when it has a customer demanding one.

**Onboarding flows and email templates.** Copy, branding, and step sequencing are product identity. The transport (`MailerPort`) belongs in the kit; the templates do not.

**Admin impersonation.** Frequently requested, and every implementation differs in its audit and consent requirements. Build it when the compliance requirements are known, on top of the kit's audit trail.

**Domain-specific search.** Full-text search, faceting, and ranking are shaped by the domain. Postgres `tsvector` covers most needs; a search-engine abstraction in the kit would be a leaky wrapper.

**Analytics and product telemetry.** Event taxonomy is product-specific and the vendor SDKs are opinionated. Distinct from operational observability (missing capability 4), which does belong in the kit.

**UI design language.** `ui-kit` should own primitives and the theming seam. Specific component libraries, brand tokens, and layout conventions are product decisions — which is why `design-system.md` deferring the technology was right, even though the deferral now has a cost (improvement 14).

**Data export, GDPR tooling, and residency.** Regulatory scope varies by product and jurisdiction. The kit enables it by having a clean tenant boundary and (once added) temporal columns.

## Defer / Do Not Add Now

**CQRS with separate read models.** The current command/query split at the use-case level gives most of the clarity at none of the cost. Separate read databases, projections, and eventual-consistency handling are unjustified until there is a measured read-scaling problem.

**Event sourcing.** The outbox pattern (improvement 1) provides reliable event publication without making the event log the system of record. Event sourcing changes the persistence model fundamentally and is very hard to reverse.

**GraphQL or tRPC.** ADR-021 chose REST with URI versioning and shared Zod contracts. Zod schemas already give end-to-end type safety, which is the main benefit people reach for tRPC to obtain. Adding a second protocol doubles the transport surface.

**Service extraction and an API gateway.** ADR-023 defers the gateway. Bounded contexts as folders with lint-enforced isolation are exactly the right preparation; extraction should be driven by an actual scaling or ownership need.

**Per-tenant schemas or databases.** ADR-013 chose pool isolation. `TenantAwareRepository` fails closed and the tenant column is uniform, which is the leverage that makes a later migration feasible. Doing it now multiplies migration and connection-pool complexity for no current benefit.

**Multi-region and read replicas.** Requires replication lag handling, routing, and consistency reasoning throughout the persistence layer. Nothing about the current design forecloses it.

**Feature flags.** Genuinely tempting for a B2B kit, and I would still defer it. A useful implementation needs targeting rules, rollout percentages, a management UI, and a client SDK with local evaluation. Until there is a real rollout to gate, a config value plus a permission check covers the actual need, and the tenant-scoped `CachePort` makes the eventual adapter easy.

**Testcontainers.** The compose-backed harnesses work, run in CI, and start faster. Testcontainers would add Docker-in-Docker complexity for isolation the current harness already achieves via per-run databases.

**Nx Cloud, Changesets, Storybook, Knip, dependency-cruiser.** `docs/todos/devex.md` defers these correctly. `nx affected` on a single CI runner is fast enough at 24 projects, and the kit is consumed by forking rather than by publishing versioned packages, which removes most of the case for Changesets.

**Multi-language backend or a plugin system.** No evidence of need; large permanent complexity.

## Architectural Implications

**No change to the dependency rule.** Every recommendation above flows inward through ports. The layer-first topology, the two-axis tags, and the context-as-folder model all hold. That is the strongest signal that the foundation was designed correctly.

**New infrastructure projects, if adopted:** `infrastructure/storage` (object storage), `infrastructure/telemetry` (OTel), and `infrastructure/messaging` only if a queue technology is chosen — the Postgres outbox with a polling relay needs no new project, since the table lives in `postgres` and the relay in `apps/worker`.

**New platform ports:** `EventPublisher`, `IdempotencyPort`, `FileStoragePort`, `MetricsPort`. Each is an interface with no dependencies, consistent with the existing thirteen.

**One boundary rule must change.** `type:app → layer:platform` is currently forbidden and already circumvented via `composition` re-exports (improvement 5). Either allow it or define an explicit app-facing surface. Leaving it as-is means the rule set contains a rule everyone knows how to bypass.

**DI tokens colocate with ports.** Moving `UNIT_OF_WORK` and `MAILER` from `postgres` to `platform`, and adding `Symbol` tokens next to each repository port, restores the principle that a port owns its own identity. If `@Inject` in the application layer is accepted, ADR-010 needs an explicit amendment rather than a silent widening.

**`apps/worker` becomes a real delivery app.** It will import `composition` the way `apps/api` does, host the outbox relay and the scheduler, and need the same bootstrap discipline — config validation, logger setup, graceful shutdown, health surface. Some of `nest-http`'s `ApiBuilder` logic is HTTP-specific and some (config assertion, process handlers, shutdown hooks) is not; the non-HTTP parts want extracting so both apps share them.

**A shared TypeORM base entity.** Temporal and version columns imply a base entity in `postgres/kernel/persistence` and a mapper convention that carries them. This is the one change that touches all eleven existing entities, which is precisely why it is cheaper now than later.

**Repository ports gain batch and pagination methods.** `findByIds`, page-aware `findByTenant`, and `findByTenantAndRole` are additive interface changes that fix the N+1 patterns in `AuthorizationService` and `ListTenantMembersQuery`.

**Contracts gain a pagination input convention and a health response shape.** Both are wire-only additions consistent with `contracts.ts` lint rules.

## Recommended Foundation Evolution

Ordered by value-per-unit-of-effort, weighting retrofit cost heavily. This is a sequence, not a plan.

**1. Temporal and version columns on every table.** Cheapest thing on this list today, one of the most expensive later, and a prerequisite for any credible audit trail. Do it before the tables have data worth preserving.

**2. Pagination on the two list endpoints, plus the N+1 fixes.** Breaking contract change that gets more expensive with every client. One frontend consumer exists right now.

**3. Health and readiness endpoints.** Small, self-contained, and required by any deployment target. Removes the `Hello API` placeholder at `/v1` as a side effect.

**4. Domain event dispatch with a Postgres outbox.** The keystone. Unblocks audit, notifications, reliable email, and scheduled work; converts three existing documents and two Cursor rules from aspiration into description. Land typed event unions with it. Keep the queue-technology decision out of this step.

**5. Scheduled cleanup jobs in `apps/worker`, gated by `LockPort`.** Immediately useful (three tables leak today), and it gives the untested lock port a real consumer.

**6. Idempotency on mutating endpoints.** Intrusive to add later because it spans the interceptor chain and the transaction boundary. The outbound client already speaks the protocol.

**7. DI token indirection at the composition layer.** Removes roughly thirty factories, restores runtime substitutability, and aligns code with two architecture documents. Cost grows linearly with every use case, so earlier is cheaper — but it is a refactor, so it sits behind the correctness items.

**8. Rate limiting on authenticated routes, tenant-scoped keys, explicit failure modes per bucket.** Closes a real cross-tenant leak in the current global keying.

**9. Repository concurrency fixes from `postgres/docs/REVIEW.md`.** Latent correctness bugs; easier once version columns exist.

**10. Metrics with `traceId` threaded into the Pino context.** Wire the correlation now even if tracing itself waits — retrofitting correlation into every log call site is the expensive half.

**11. Object storage port with S3 and local adapters.** The most commonly needed missing capability, and the tenant-prefixing requirement is one a product will get wrong on its own.

**12. Documentation refresh.** Correct the status headers, the port-binding examples, the `AuthorizationPort` placement, and the boundary-rule list. Cheap, and stale authority actively misleads both contributors and agents.

**13. API keys for machine-to-machine access.** Cheaper before more use cases assume `actorId` is a user id.

**14. Design-system decision and the `ui-kit` / app-shared-ui boundary.** The decision is urgent even though the implementation volume is product-specific; every new screen widens the eventual migration.

**15. Deployment artifacts.** Dockerfiles and an image-build CI job. Referenced by two scripts already; worth doing once the above are stable.
