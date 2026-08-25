# Backend Foundation — Implementation Plan

Architecture-driven, phase-by-phase plan for the backend foundation of the B2B multi-tenant SaaS starter kit. It is derived **from the existing architecture docs and Cursor rules** (the source of truth), not from the investigated reference repositories.

> Status: Phases 1–8 are implemented. Phases 9–11 below are the remaining foundation (Logger, Nest HTTP kit, then composition + versioned HTTP e2e). This document does not create packages by itself; each phase is implemented later, one at a time, in Cursor.

Related source-of-truth docs: [`architecture/workspace-topology.md`](./architecture/workspace-topology.md), [`architecture/backend.md`](./architecture/backend.md), [`architecture/bounded-contexts.md`](./architecture/bounded-contexts.md), [`architecture/persistence.md`](./architecture/persistence.md), [`architecture/multi-tenancy.md`](./architecture/multi-tenancy.md), [`architecture/authorization.md`](./architecture/authorization.md), [`architecture/api-contracts.md`](./architecture/api-contracts.md), [`architecture/shared-packages.md`](./architecture/shared-packages.md), [`architecture/boundaries.md`](./architecture/boundaries.md), [`architecture/decisions.md`](./architecture/decisions.md).

---

## 1. Scope of this plan (locked decisions)

These were confirmed for the initial foundation and constrain the whole plan:

| Decision            | Choice for the foundation                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RBAC breadth**    | **Lean-but-generic.** `identity` (User), `tenancy` (Tenant, Membership), `authorization` (Role, Permission) with a **fixed system-permission catalog** + seeded **system roles** (Owner/Admin/Member). One permission enforced end-to-end. Custom tenant-defined roles CRUD + invitations **deferred** (the seams are built so they slot in without rework). |
| **Authentication**  | **Stubbed principal.** No password/JWT/refresh/sessions yet. The API edge injects an authenticated principal (dev middleware) and establishes `TenantContext`. Real credentials/tokens are a **later plan**, localized to the `identity` context + edge, so nothing else changes when they land.                                                             |
| **Depth per slice** | **End-to-end through HTTP.** `domain → application → postgres → logger → nest-http → composition → apps/api`, with Vitest per layer **plus an HTTP e2e against a real (containerized) Postgres**. Routes are URI-versioned (`/v1/...`). Frontend excluded.                                                                                                   |
| **Logging**         | **Pino**, not Nest-injectable. `Logger` port + `LoggerLocator` on `platform`; adapter in `packages/infrastructure/logger`.                                                                                                                                                                                                                                   |
| **Redis**           | **Deferred.** Effective permissions are resolved directly from Postgres (via context repositories). `platform` Cache/Lock/PubSub ports + `packages/infrastructure/redis` + permission caching come later. All keys/queries are designed **cache- and tenant-prefix-ready** now.                                                                              |

Out of scope for this plan (see §7 Deferred): real authentication, Redis, transactional outbox + domain-event bus, `audit` and `notifications` contexts, `apps/worker` wiring, custom roles/invitations, Postgres RLS, `gateway`/realtime, request-id ALS log mixin.

---

## 2. Architecture design (reasoned from first principles)

### 2.1 Do the proposed packages hold up? — verdict

The docs already settle the topology: **layer-first Nx projects, bounded contexts as folders** ([`workspace-topology.md`](./architecture/workspace-topology.md)). Re-derived from first principles, this is the right call for a modular monolith: the invariant most worth enforcing at build time is the **layer dependency direction**, and making the Nx _project_ = _layer_ makes that a mechanical `@nx/enforce-module-boundaries` guarantee while keeping the project count low. Context isolation (the gap layer-first leaves) is covered by a **folder-level import lint**.

So the packages you listed map as follows (names/tags are fixed by [`boundaries.md`](./architecture/boundaries.md)):

| Your candidate                    | Realization in this plan                                                                  | Kind                        |
| --------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------- |
| `shared/kernel-types`             | `packages/shared/kernel-types` → `@b2b-saas-starter-kit/shared-kernel-types`              | one project (shared leaf)   |
| `backend/domain`                  | `packages/domain` → `@b2b-saas-starter-kit/domain` (contexts are folders inside `src/`)   | one project                 |
| `backend/application`             | `packages/application` → `@b2b-saas-starter-kit/application`                              | one project                 |
| `backend/platform`                | `packages/platform` → `@b2b-saas-starter-kit/platform`                                    | one project                 |
| `backend/infrastructure/postgres` | `packages/infrastructure/postgres` → `@b2b-saas-starter-kit/postgres`                     | one project (per-concern)   |
| `backend/infrastructure/logger`   | `packages/infrastructure/logger` → `@b2b-saas-starter-kit/logger`                         | one project (Pino, no Nest) |
| `backend/nest-http`               | `packages/nest-http` → `@b2b-saas-starter-kit/nest-http`                                  | one project (HTTP kit)      |
| `shared/contracts`                | `packages/shared/contracts` → `@b2b-saas-starter-kit/contracts`                           | one project (shared leaf)   |
| `backend/composition`             | `packages/composition` → `@b2b-saas-starter-kit/composition` (context modules as folders) | one project                 |

**Bounded-context-specific packages are explicitly rejected** for the foundation (documented as rejected alternatives in [`decisions.md`](./architecture/decisions.md)): they multiply project count and make `nx affected` finer at the cost of much more wiring, and a context is promoted to its own project only when it needs independent build/versioning or is being extracted toward a service — an explicit later decision, not the starting point.

**Infrastructure split:** `packages/infrastructure/` is a grouping directory (like `packages/shared/`); each concern is its own Nx project. For the foundation we create **`postgres`** (done) and **`logger`** (Phase 9). Redis/messaging stay deferred so a logger or Redis consumer never pulls TypeORM, and a worker never pulls Nest/Swagger.

### 2.2 Nx projects, tags, and dependency direction

Projects created across the whole plan (only the ones this foundation needs), with their required tags and allowed dependencies (subset of [`boundaries.md`](./architecture/boundaries.md)):

| Project               | Tags                                                     | May depend on                                                                    |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `shared-kernel-types` | `scope:shared`, `layer:shared-types`                     | — (+ Zod)                                                                        |
| `contracts`           | `scope:shared`, `layer:contracts`                        | `shared-kernel-types`                                                            |
| `domain`              | `scope:backend`, `layer:domain`                          | `shared-kernel-types`                                                            |
| `platform`            | `scope:backend`, `layer:platform`                        | `shared-kernel-types`                                                            |
| `application`         | `scope:backend`, `layer:application`                     | `domain`, `platform`, `shared-kernel-types`, `utils`                             |
| `postgres`            | `scope:backend`, `layer:infrastructure`                  | `domain`, `application`, `platform`, `shared-kernel-types`, `utils`, `config`    |
| `logger`              | `scope:backend`, `layer:infrastructure` + `layer:logger` | `platform` (Pino only)                                                           |
| `nest-http`           | `scope:backend`, `layer:nest-http`                       | `contracts`, `platform`, `shared-kernel-types`, `utils`, `config`                |
| `composition`         | `scope:backend`, `layer:composition`                     | `domain`, `application`, `postgres`, `platform`, shared                          |
| `apps/api`            | `scope:backend`, `type:app`                              | `nest-http`, `composition`, `contracts`, `config`, `utils`, `logger` (bootstrap) |

**Forbidden edges that make this design correct** (enforced, not conventional): `domain → anything but shared-types`; `application → contracts`; `application → infrastructure`; `nest-http → domain/application/postgres`; `type:app → postgres/domain/application`; `scope:backend ↔ scope:frontend`; `type:app → type:app`. The extra `layer:logger` tag lets apps bootstrap Pino without opening `postgres`. The direction always points **inward** toward the pure domain.

### 2.3 Contexts as folders (this foundation touches three)

The kit's five contexts are folders inside each layer project. This foundation implements **three**; `audit` and `notifications` are deferred.

```
domain/src/{ identity, tenancy, authorization, shared-kernel }
application/src/{ identity, tenancy, authorization, shared }
infrastructure/postgres/src/{ kernel, contexts, testing }
composition/src/{ identity, tenancy, authorization }
```

Context isolation is a **folder-level lint**: within `domain/src/<A>` you may not import `domain/src/<B>` (except `shared-kernel`). Cross-context interaction is allowed **only** by the three sanctioned mechanisms ([`bounded-contexts.md`](./architecture/bounded-contexts.md)): reference by ID, domain events, or calling another context's **application** use case/published port.

### 2.4 Aggregates, ownership, and boundaries

| Context         | Aggregate / concept      | Identity & key state                                                                                | Tenant-owned?                       |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `identity`      | **User**                 | `UserId`, `email`, `displayName`, `status`. **Global** identity, no credentials yet (auth stubbed). | No (global `users`, no `tenant_id`) |
| `tenancy`       | **Tenant**               | `TenantId`, `name`, `status`.                                                                       | Yes                                 |
| `tenancy`       | **Membership**           | `MembershipId`, `userId` (→identity), `tenantId`, `roleIds: RoleId[]` (→authorization), `status`.   | Yes                                 |
| `authorization` | **Role**                 | `RoleId`, `tenantId`, `name`, `permissions: Permission[]`, `isSystem`.                              | Yes                                 |
| `authorization` | **Permission** (catalog) | Namespaced string constants (code-owned source of truth), e.g. `tenancy.members.read`.              | n/a (code)                          |

**Key boundary decisions (with rationale):**

- **Membership is its own aggregate**, not a child of Tenant. Memberships have an independent lifecycle (invite → active → suspended) and are the tenancy hub linking `userId` + `roleIds`. Modeling them inside Tenant would create a large, contended aggregate.
- **Cross-aggregate invariant "a tenant always has ≥1 Owner"** spans multiple Membership aggregates, so it **cannot** be a single-aggregate invariant. It is enforced in the **application layer** (in `CreateTenant`, and later in any membership-removal/role-change use case) inside a `UnitOfWork`. Trade-off: the rule lives in a use case rather than an aggregate; this is the correct place for a multi-aggregate invariant and is explicitly noted so future contributors don't try to force it into `Tenant`.
- **Roles are tenant-scoped** (each tenant gets its own seeded `Owner`/`Admin`/`Member` rows at creation), not global templates. Rationale: it makes future **custom tenant-defined roles** uniform with system roles (same table, same `RoleRepository`), and keeps `role_id` a tenant-owned value. Trade-off: `CreateTenant` seeds three roles in the same transaction (a good `UnitOfWork` demonstration). Rejected alternative — global system roles + separate tenant custom roles — creates two role kinds and a messier authorization query.
- **Permission identifiers are code constants** owned by `authorization` domain (surfaced to the frontend via `contracts` as an enum/type). Roles store the permission strings they bundle. This matches [`authorization.md`](./architecture/authorization.md): checks are always against **permissions**, never role names.
- **No cross-context foreign keys.** `Membership.userId`, `Membership.roleIds`, `Role.tenantId` are plain branded IDs. FKs exist only within a context. Integrity across contexts is application logic.

### 2.5 Ports & adapters catalog (the seams)

| Port (interface)       | Defined in                              | Adapter / impl (this plan)                                                              | Purpose                                                                                 |
| ---------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `UserRepository`       | `domain/identity/ports`                 | `infrastructure/postgres/identity`                                                      | Load/save User.                                                                         |
| `TenantRepository`     | `domain/tenancy/ports`                  | `infrastructure/postgres/tenancy`                                                       | Load/save Tenant (tenant-aware).                                                        |
| `MembershipRepository` | `domain/tenancy/ports`                  | `infrastructure/postgres/tenancy`                                                       | Load/save Membership; list by tenant (tenant-aware).                                    |
| `RoleRepository`       | `domain/authorization/ports`            | `infrastructure/postgres/authorization`                                                 | Load/save/seed Roles (tenant-aware).                                                    |
| `UnitOfWork`           | `platform`                              | `infrastructure/postgres` (over `DataSource.transaction`)                               | Transaction boundary; ambient `TxContext`.                                              |
| `TenantContext`        | `platform`                              | `infrastructure/postgres` (Node AsyncLocalStorage)                                      | Ambient active-tenant + actor accessor.                                                 |
| `Clock`                | `platform`                              | `infrastructure/postgres` (system clock)                                                | Deterministic timestamps (`occurredAt`, `createdAt`).                                   |
| `IdGenerator`          | `platform`                              | `infrastructure/postgres` (UUID v7)                                                     | Deterministic-in-tests ID creation; ids passed into domain factories.                   |
| `Logger`               | `platform` (locator)                    | `infrastructure/logger` (Pino)                                                          | Structured logs via `LoggerLocator.get()`; **not** Nest-injectable.                     |
| `AuthorizationPort`    | `application/authorization` (published) | `application/authorization` service, backed by `RoleRepository` + `MembershipRolesPort` | `require(actor, permission, {tenantId})` / `getEffectivePermissions(userId, tenantId)`. |
| `MembershipRolesPort`  | `application/tenancy` (published)       | `application/tenancy` service (reads `MembershipRepository`)                            | Sanctioned cross-context sync read: "which roleIds does (user,tenant) have?"            |

**Why `AuthorizationPort` composes repositories instead of a SQL join:** effective permissions = union of the permissions of the roles attached to a user's membership. That data spans **tenancy** (`membership → roleIds`) and **authorization** (`role → permissions`). A raw cross-context SQL join would violate context isolation. Instead, the authorization resolver depends on its own `RoleRepository` **and** a **published `MembershipRolesPort`** from tenancy (a sanctioned cross-context application call). Slightly more work per resolution; correct boundaries; trivially cache-able later behind the same port (Redis phase). This is a deliberate teaching example of cross-context communication done right.

### 2.6 Multi-tenancy mechanics (foundation)

Per [`multi-tenancy.md`](./architecture/multi-tenancy.md), **pool model** (shared schema + `tenant_id`), hybrid propagation:

1. **Explicit at the application boundary** — every command/query input carries `tenantId` (and `actor`), so use cases are self-describing and unit-testable.
2. **Ambient guardrail** — the edge sets a request-scoped `TenantContext`; `TenantAwareRepository` auto-adds `WHERE tenant_id = :ctx` on reads and stamps it on writes. The infra **asserts** the command's `tenantId` matches the ambient context (catches un-scoped queries).

- Global tables (`users`) carry **no** `tenant_id`.
- A narrow, verbose **escape hatch** (`withoutTenantScope()`) exists for the tenant-resolution lookups and admin paths (e.g. loading a Membership to validate access before context is established).
- Redis tenant-prefixing and Postgres RLS are **deferred** but the key-builder/query seams are left prefix-ready.

### 2.7 Persistence, migrations, seeding

- **Separate domain models and TypeORM entities**, connected by explicit **mappers** ([`persistence.md`](./architecture/persistence.md)). Entities never leave `packages/infrastructure/postgres`.
- **Single global migration timeline** in `packages/infrastructure/postgres`, files prefixed by context for readability. One `DataSource`.
- **Seeding:** permission catalog is code. **System roles are seeded per tenant at runtime** inside `CreateTenant` (not via migration), so custom roles later use the identical path. A separate idempotent dev **seeder** (fixed dev user) supports local e2e without real auth.
- **Transactions** via `UnitOfWork` port; repositories join the ambient `TxContext` (no `EntityManager` on port signatures).

### 2.8 Config, IDs, clock, logger, errors, stubbed-auth seam

- **Config:** apps own Zod schemas + values; `apps/api` loads DB + HTTP (CORS, version, prefix, OpenAPI) via `ConfigLoader` (`source: 'env'`) — no eager import-time load.
- **IDs/time:** `IdGenerator` (UUID v7) + `Clock` are `platform` ports injected in the **application** layer; ids/timestamps are passed **into** domain factory methods, keeping aggregates pure and tests deterministic. (The domain rule permits `randomUUID`, but injecting keeps use-case tests deterministic and is preferred.)
- **Logger:** `LoggerLocator` on `platform`; Pino adapter at process bootstrap. Application may `LoggerLocator.get().context(UseCase.name)`. Never `@Inject()` Logger. Tests install a memory logger in `beforeEach`.
- **Errors:** domain throws typed `DomainError` subclasses (per `domain-layer.mdc`); `nest-http` maps duck-typed `{code, message}` to HTTP using the shared error envelope and `HttpStatus` from `contracts` (include 403/409). Do not import domain error classes into the kit.
- **Stubbed-auth seam:** a `DevPrincipal` guard in `apps/api` reads `x-user-id` / `x-tenant-id`, **validates membership** (`withoutTenantScope`) before `TenantContext.run`. `@Public()` comes from `nest-http`. When real auth lands, only this guard + `identity` credential/session code change; `ApiBuilder`, controllers, and use cases stay identical.

### 2.9 Testing strategy

| Layer         | Test type                 | Tooling / notes                                                                                                                                                  |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`      | Pure unit                 | Vitest, no Nest/DB. Target ~90% on domain.                                                                                                                       |
| `application` | Unit with in-memory fakes | In-memory repositories + in-memory `UnitOfWork` + fake `TenantContext`/`Clock`/`IdGenerator`. After Phase 9: `LoggerLocator.init(memoryLogger)` in `beforeEach`. |
| `postgres`    | Integration               | Against a **containerized Postgres** (reuse `infra/compose`), migrations applied to a dedicated test DB. Assert tenant isolation.                                |
| `apps/api`    | HTTP e2e                  | `supertest` against a booted Nest app + real Postgres. Full slice: create user → create tenant → `/v1/me` → `/v1/tenants/:id/members` (allow/deny).              |

Recommended: reuse the existing `infra/compose` Postgres with a separate `*_test` database + `beforeAll` migration run (lower dependency footprint than adding Testcontainers). Testcontainers remains an easy future swap behind the same test setup.

---

## 3. Key architectural decisions & trade-offs (summary)

1. **Layer-first Nx, contexts as folders** — build-time layer enforcement; context isolation via lint. (Settled by docs; re-affirmed.)
2. **One project per infra concern**, `postgres` (done) + `logger` (Phase 9); Redis/messaging deferred without pulling TypeORM or Nest.
3. **Membership as its own aggregate**; the "≥1 Owner" rule is an **application-level multi-aggregate invariant** inside a `UnitOfWork`. Recommended over stuffing it into `Tenant`.
4. **Tenant-scoped roles**, seeded per tenant at creation — uniform with future custom roles. Recommended over global system roles.
5. **`AuthorizationPort` resolves by composing repositories** (own `RoleRepository` + published `MembershipRolesPort`), **never a cross-context join** — preserves boundaries, cache-ready.
6. **Injected `IdGenerator`/`Clock`** over in-domain `randomUUID`/`new Date()` — deterministic tests. **`Logger` is a process locator**, not injected.
7. **Stubbed principal** with a real `TenantContext` seam — real auth is a drop-in later, isolated to `identity` + edge.
8. **Reuse compose Postgres for integration/e2e** over Testcontainers initially — fewer deps, same seam.
9. **`nest-http` kit + URI `/v1` + CORS/helmet** — HTTP bootstrap is not copied into `apps/api`; composition is not the HTTP kit.

---

## 4. Implementation order (dependency-driven)

Ordering follows **actual architectural dependencies**, not a rote "types → domain → app → infra → composition." Pure, widely-depended-on foundations come first; the application layer is validated **entirely with in-memory adapters before any database exists** (fast feedback, de-risks use-case design); Postgres, then Logger + HTTP kit, then composition + versioned HTTP e2e.

```
1 Enforcement + kernel-types ──┬─▶ 2 domain shared-kernel ──┬─▶ 4 authorization domain ─┐
                               └─▶ 3 platform ports ─────────┘   5 identity+tenancy domain ─┤
                                                                                            ▼
                                                                6 application (in-memory) ──▶ 7 infra-postgres core
                                                                                            ▼
                                                                8 infra-postgres per context ──▶ 9 Logger port + Pino
                                                                                            ▼
                                                                10 contracts envelopes + nest-http ──▶ 11 composition + apps/api + HTTP e2e
```

Phases 4 and 5 are independent (both pure domain) and may be done in either order. Phase 6 depends on 3–5. Phases 7–11 are strictly sequential.

---

## 5. Phases

Each phase is small, independently implementable, and lists Goal · Scope · Packages · Tasks · Tests · Verification · Definition of Done · Deferred.

### Phase 1 — Boundary enforcement + shared kernel types

- **Goal:** stand up the governance that makes every later boundary a build-time guarantee, plus the leaf types everything depends on.
- **Scope:** `@nx/enforce-module-boundaries` dep-constraints (full ruleset from `boundaries.md`), context-isolation folder lint, import-order/type-import lint; the `shared-kernel-types` project.
- **Packages/projects:** create `packages/shared/kernel-types` (tags `scope:shared`, `layer:shared-types`); ESLint config for boundaries.
- **Implementation tasks:**
  - Generate `shared-kernel-types` lib; add tags.
  - Add the `depConstraints` block (scope + layer rules) and the folder-level context-isolation rule and `simple-import-sort` + `consistent-type-imports`.
  - Implement branded IDs + Zod schemas: `UserId`, `TenantId`, `MembershipId`, `RoleId`; branding utility.
  - Cross-cutting enums: `UserStatus`, `TenantStatus`, `MembershipStatus`.
  - `Permission` identifier type (namespaced string brand).
- **Tests:** schema parse/reject + brand round-trip (Vitest).
- **Verification:** `nx lint shared-kernel-types`, `nx test shared-kernel-types`; a deliberate boundary violation fails lint; `nx graph` shows the leaf with no backend deps.
- **Definition of Done:** types + schemas exported from the package entry; boundary + isolation lints active and green; DoD checklist committed to package README.
- **Deferred:** permission catalog **values** (owned by authorization, Phase 4); contract enums (Phase 10–11).

### Phase 2 — Domain shared-kernel primitives

- **Goal:** backend-only domain building blocks used by all aggregates.
- **Scope:** `domain` project with `src/shared-kernel` only (no contexts yet).
- **Packages/projects:** create `packages/domain` (tags `scope:backend`, `layer:domain`).
- **Implementation tasks:** `AggregateRoot`, `Entity`, `DomainEvent`, `Result`/guard helpers, `DomainError` base; domain-purity lint (`no-restricted-imports` blocking Nest/TypeORM/Redis/contracts).
- **Tests:** unit tests for `Result`, event collection on `AggregateRoot`.
- **Verification:** `nx lint/test domain`; graph shows `domain → shared-kernel-types` only.
- **Definition of Done:** primitives exported; purity lint proven (a forbidden import fails).
- **Deferred:** context aggregates (Phases 4–5).

### Phase 3 — Platform capability ports

- **Goal:** define the technology-agnostic capability ports the application will depend on.
- **Scope:** `platform` project: `UnitOfWork`, `TenantContext`, `Clock`, `IdGenerator` interfaces (+ `TxContext` type). **No** Cache/Lock/PubSub (Redis deferred).
- **Packages/projects:** create `packages/platform` (tags `scope:backend`, `layer:platform`).
- **Implementation tasks:** author the four ports; document expected semantics; export from entry.
- **Tests:** none runtime (interfaces); optional type-level tests.
- **Verification:** `nx lint platform`; graph shows `platform → shared-kernel-types` only.
- **Definition of Done:** ports exported and referenced in later phases; no impl leakage.
- **Deferred:** `CachePort`/`LockPort`/`PubSubPort` (Redis phase). `Logger` port + locator is Phase 9 (platform package already exists).

### Phase 4 — Authorization domain (roles + permission catalog)

- **Goal:** the pure authorization model.
- **Scope:** `domain/src/authorization`: `Permission` catalog constants (small fixed set, e.g. `tenancy.members.read`, `tenancy.tenant.read`, `authorization.roles.read`, `identity.users.read`), `Role` aggregate (bundles permissions; `isSystem`), system-role **definitions** (Owner=all, Admin=subset, Member=minimal), `RoleRepository` port.
- **Packages/projects:** `domain` (authorization folder).
- **Implementation tasks:** implement `Permission` catalog + type-safe guards; `Role.create`/`Role.createSystemRole`; `RoleRepository` port (`findById`, `findByTenant`, `save`, `saveMany`).
- **Tests:** unit — role→permission bundling, catalog integrity, system-role definitions.
- **Verification:** `nx lint/test domain`; context-isolation lint (authorization must not import tenancy/identity internals).
- **Definition of Done:** authorization aggregates + port + catalog complete and pure.
- **Deferred:** custom-role creation use case; policy seam (ABAC-lite) beyond RBAC.

### Phase 5 — Identity + Tenancy domain

- **Goal:** the write-side aggregates that the first HTTP slice needs.
- **Scope:** `domain/src/identity` (`User` + `UserRepository`) and `domain/src/tenancy` (`Tenant`, `Membership` + `TenantRepository`, `MembershipRepository`), including the domain events (`UserCreated`, `TenantCreated`, `MembershipCreated`) and invariants that belong to a single aggregate.
- **Packages/projects:** `domain` (identity, tenancy folders).
- **Implementation tasks:** `User.create`; `Tenant.create`; `Membership.createOwner`/`Membership.create` referencing `userId` + `roleIds`; status transitions; ports.
- **Tests:** unit — creation, status transitions, invariant guards; assert **no** cross-context imports.
- **Verification:** `nx lint/test domain`; context-isolation lint green.
- **Definition of Done:** all three contexts' aggregates + ports exist, pure, ~90% covered.
- **Deferred:** the "≥1 Owner" **multi-aggregate** rule (enforced in application, Phase 6); credentials/sessions (real-auth plan).

### Phase 6 — Application use cases (in-memory, fully unit-tested)

- **Goal:** validate the entire use-case layer and the port design **before** any database.
- **Scope:** `application` project + these use cases/ports:
  - `identity`: `CreateUserUseCase`.
  - `tenancy`: `CreateTenantUseCase` (tenant + seed 3 system roles + owner membership, one `UnitOfWork`; enforces ≥1 Owner), `ListTenantMembersQuery`; published `MembershipRolesPort`.
  - `authorization`: published `AuthorizationPort` + resolver (`getEffectivePermissions`, `require`) composing `RoleRepository` + `MembershipRolesPort`.
  - `identity`/cross: `GetMyProfileQuery` (principal + memberships + effective permissions for the active tenant).
- **Packages/projects:** create `packages/application` (tags `scope:backend`, `layer:application`).
- **Implementation tasks:** commands/results as plain typed objects (no `contracts`); inject ports only; fine-grained authorization via `AuthorizationPort.require` inside guarded use cases; in-memory fakes (repos, `UnitOfWork`, `TenantContext`, `Clock`, `IdGenerator`) as test doubles.
- **Tests:** unit — `CreateTenant` seeds roles + owner atomically and rejects losing the last owner; `AuthorizationPort` unions permissions correctly and denies cross-tenant; `ListTenantMembers` requires `tenancy.members.read`; `GetMyProfile` returns the right effective set. All with in-memory adapters, no DB.
- **Verification:** `nx lint/test application`; boundary check proves `application` cannot import `contracts` or `infrastructure`.
- **Definition of Done:** every foundation use case passes with in-memory adapters; port surfaces frozen for the infra phase.
- **Deferred:** invitation/role-assignment/tenant-switch use cases; event publication (outbox phase).

### Phase 7 — infrastructure/postgres core

- **Goal:** the persistence backbone, proven against real Postgres, with **no** context tables yet.
- **Scope:** `DataSource` + TypeORM config (via `ConfigLoader` env schema), `TenantContext` impl (Node AsyncLocalStorage), `TenantAwareRepository` base, `UnitOfWork` impl (`DataSource.transaction`), `Clock`/`IdGenerator` impls, migration tooling + runner, test-DB harness.
- **Packages/projects:** create `packages/infrastructure/postgres` (Nx name `postgres`, tags `scope:backend`, `layer:infrastructure`).
- **Implementation tasks:** wire `DataSource`; implement the four platform-port adapters; base repo that reads ambient `TenantContext` and asserts command/context tenant agreement + provides `withoutTenantScope()`; migration config; connect to `infra/compose` Postgres (dedicated `*_test` DB).
- **Tests:** integration — connectivity; `UnitOfWork.run` commits/rolls back; base repo auto-filters and the escape hatch works (using a throwaway table or the first real table from Phase 8 if interleaved).
- **Verification:** `nx test postgres` against a running compose Postgres; migration up/down clean.
- **Definition of Done:** core adapters green against real Postgres; `docs/infrastructure` referenced for how to run it.
- **Deferred:** context entities/repos (Phase 8); RLS "secure profile".

### Phase 8 — infrastructure/postgres per-context adapters + migrations

- **Goal:** real repositories for all three contexts, tenant-isolated, integration-tested.
- **Scope:** entities + mappers + repo impls + migrations for `identity` (`users`), `authorization` (`roles`, `role_permissions`), `tenancy` (`tenants`, `memberships`, `membership_roles`); `AuthorizationPort` + `MembershipRolesPort` impls (composing repos, no cross-context join).
- **Packages/projects:** `packages/infrastructure/postgres` (`src/contexts/{identity,authorization,tenancy}` + `src/kernel/migrations`).
- **Implementation tasks:** `*.entity.ts` (persistence-only), `*.mapper.ts`, `TypeOrm*Repository` extending the tenant-aware base where tenant-owned (`users` is global); context-prefixed migrations; within-context FKs only; branded IDs across contexts.
- **Tests:** integration per repo against real Postgres — round-trip mapping; **tenant isolation** (tenant A cannot read tenant B); `AuthorizationPort` returns correct effective permissions end-to-end through the repos.
- **Verification:** `nx test postgres`; migrations apply cleanly on an empty DB; no cross-context join in any query (review + isolation lint on the folder).
- **Definition of Done:** all foundation tables + repos + authorization resolution work against real Postgres with isolation proven.
- **Deferred:** Redis-cached effective permissions; outbox tables.

### Phase 9 — Logger port + Pino adapter

- **Goal:** structured logging without Nest DI, usable from application, infra, and process entry.
- **Scope:** add `Logger` + `LoggerLocator` to the existing `platform` package; create `packages/infrastructure/logger` (Pino). No Nest, no `nestjs-pino`, no driver registry.
- **Packages/projects:** `platform` (extend); create `logger` (tags `scope:backend`, `layer:infrastructure`, **and** `layer:logger` so `type:app` can bootstrap it without importing `postgres`).
- **Implementation tasks:**
  - Port: `context(name)`, `trace`/`debug`/`info`/`warn`/`error`/`fatal`, overloads `msg` | `(data, msg)`.
  - Locator throws if uninitialized (no silent no-op).
  - `PinoLogger`: one class + `pino.child({context})`; typed levels; production default `info`; `pino-pretty` only when `isPretty`; `Error` → `{err}`; redact `req.headers.authorization`.
  - In-memory logger for tests (`application/testing` or logger package).
- **Tests:** unit — context child fields; error serialization; locator throw; memory logger round-trip. Application tests `LoggerLocator.init` in `beforeEach` / `reset` in `afterEach`.
- **Verification:** `nx lint/typecheck/test platform logger`; graph shows `logger → platform` only; a deliberate application import of `pino` fails purity lint.
- **Definition of Done:** `LoggerLocator.get()` works after bootstrap; application never imports `@b2b-saas-starter-kit/logger`.
- **Deferred:** ALS mixin for `tenantId`/`actorId`/request id; OpenTelemetry; worker bootstrap (Phase 11+).

### Phase 10 — Contracts envelopes + Nest HTTP kit

- **Goal:** shared wire types and a reusable HTTP bootstrap so `apps/api` does not invent pipes, filters, Swagger, CORS, or versioning.
- **Scope:**
  - `contracts`: `HttpStatus` (include 403/409), error envelope, pagination envelope. **Not** yet the four endpoint DTOs.
  - `nest-http`: `ApiBuilder`, `createHttpProviders()` (pipe/filter/interceptor), OpenAPI helper, `@Public()`, process `unhandledRejection`/`uncaughtException` handlers. Kit uses `LoggerLocator.get()` and contracts — **not** domain/application/postgres.
- **Packages/projects:** create `packages/shared/contracts` (`layer:contracts`); create `packages/nest-http` (`layer:nest-http`). Add `layer:contracts` and `layer:nest-http` depConstraints (already specified in [`boundaries.md`](./architecture/boundaries.md)).
- **Implementation tasks:**
  - `ApiBuilder`: helmet (document staging HTTP/Swagger caveat), CORS from typed config (**fail closed in production** if origins unset), URI versioning default `'1'`, optional `API_GLOBAL_PREFIX`, `enableShutdownHooks()`, Swagger at `/docs` (basic-auth optional).
  - Exception filter: Zod 400s + `HttpException` + `{code, message}` → contracts envelope.
  - nestjs-zod compatibility with workspace Zod 4 — verify; fallback a thin parse pipe if needed.
- **Tests:** unit — CORS fail-closed; error envelope shape; versioning default. Optional Nest testing module for pipe/filter.
- **Verification:** `nx lint/typecheck/test contracts nest-http`; `nest-http` must not depend on `domain`/`application`/`postgres`.
- **Definition of Done:** kit + envelopes exported; Swagger helper documented; no app wiring yet.
- **Deferred:** endpoint DTOs, composition, `RequirePermission`, JWT guards (Phase 11 / real auth).

### Phase 11 — Composition + apps/api + endpoint contracts + HTTP e2e

- **Goal:** the full vertical exposed over **versioned** HTTP with a stubbed principal, validated end-to-end against real Postgres, bootstrapped through `ApiBuilder`.
- **Scope:**
  - `contracts`: Zod input/output DTOs + permission union for `POST /v1/users`, `POST /v1/tenants`, `GET /v1/me`, `GET /v1/tenants/:tenantId/members`.
  - `composition`: per-context Nest modules binding ports→adapters (`useFactory` + postgres tokens) and registering use cases + `AuthorizationPort`. Re-export use-case classes and `TENANT_CONTEXT` so `apps/api` does not import `application`/`postgres`.
  - `apps/api`: `LoggerLocator.init` + `ApiBuilder` + `createHttpProviders()`; `DevPrincipal` + ALS interceptor; `@RequirePermission` (app-specific, not in the kit); controllers; idempotent dev seeder (`dev@localhost`). `POST /v1/tenants` wraps `CreateTenant` in `withoutTenantScope`.
- **Packages/projects:** create `packages/composition`; wire existing `apps/api`.
- **Implementation tasks:** thin controllers (validate → map → use case → map result); guard `tenancy.members.read` on members; `GET /v1/me` returns effective permissions; CORS/helmet/versioning from env.
- **Tests:** HTTP e2e (`supertest`) against booted Nest + real Postgres: create user → set principal → create tenant (Owner, roles seeded) → `GET /v1/me` shows Owner permissions → `GET /v1/tenants/:id/members` **allowed** for Owner and **denied (403)** for a Member principal (seed membership via composition helper; invitations deferred); contract-validation 400s.
- **Verification:** `nx test api` green with compose Postgres up (`CI=true`); Swagger at `/docs`; `nx graph` shows `api → nest-http + composition + contracts + logger`, not `postgres`/`domain`.
- **Definition of Done:** four versioned endpoints work through real Postgres with coarse guard **and** application-layer authorization; frontend untouched.
- **Deferred:** real login/JWT/refresh; tenant-switch; invitations; worker wiring.

---

## 6. Cross-cutting Definition of Done (applies to every phase)

- New project created via an Nx generator with correct `scope:*` + `layer:*` tags.
- `nx lint` (incl. module-boundaries + context-isolation + import-order) and `nx test`/`nx typecheck` green for affected projects.
- No forbidden dependency edge introduced (verified via `nx graph`/affected).
- Public surface exported from the package entry; internal types not leaked across layers.
- Tests written at the layer's prescribed level (§2.9); domain/application need **no** DB.

---

## 7. Deferred work (explicitly out of the foundation)

| Area                                   | Why deferred / how it slots in later                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real authentication**                | Credentials/sessions/tokens (JWT access+refresh, tenant claim, verification, password reset) live in `identity` + edge; the `DevPrincipal` seam is replaced without touching controllers/use cases. |
| **Redis**                              | `platform` Cache/Lock/PubSub ports + `packages/infrastructure/redis`; cache effective permissions (tenant-prefixed key) behind the existing `AuthorizationPort`.                                    |
| **Transactional outbox + event bus**   | Publish domain events (`UserCreated`, `MembershipCreated`, …) durably; enables `audit`/`notifications`.                                                                                             |
| **`audit` + `notifications` contexts** | Downstream event subscribers; add as folders across layers, no changes to existing contexts.                                                                                                        |
| **`apps/worker` wiring**               | Re-establish `TenantContext` from job payloads; consume outbox.                                                                                                                                     |
| **Custom roles + invitations**         | Custom-role CRUD and membership invitation/role-assignment use cases reuse the tenant-scoped `RoleRepository` + `MembershipRepository`.                                                             |
| **Postgres RLS "secure profile"**      | Opt-in defense-in-depth; session `app.tenant_id` + policies alongside the base-repo filter.                                                                                                         |
| **Policy seam (ABAC-lite)**            | Resource/ownership checks behind `AuthorizationPort` (e.g. CASL adapter) without controller/use-case changes.                                                                                       |
| **Frontend**                           | `contracts` already shared; `frontend/core` consumes `/v1/me` effective permissions + `can()` in a later plan.                                                                                      |
| **Request/tenant log mixin**           | Bind `tenantId` / `actorId` / request id onto Pino via ALS after the locator exists (ADR-027 deferred increment).                                                                                   |

---

## 8. Assumptions & recommendations to confirm during implementation

These were decided with rationale (not blocking) and can be revisited when the relevant phase starts:

- **Roles are tenant-scoped**, seeded per tenant at creation (§2.4). If a global-templates model is later preferred, only Phase 4/8 change.
- **`IdGenerator`/`Clock` injected** rather than in-domain (§2.8).
- **Integration/e2e reuse the compose Postgres** with a `*_test` DB rather than Testcontainers (§2.9).
- **Worked permission enforced end-to-end** is `tenancy.members.read` on `GET /v1/tenants/:tenantId/members`; the catalog ships a small fixed set with Owner/Admin/Member bundles.
- **`AuthorizationPort` and `MembershipRolesPort` are application-layer published ports** (§2.5); if a future need makes authorization heavier, they can move behind a dedicated port project without changing callers.
- **`Logger` is not injectable**; `IdGenerator`/`Clock` remain injected (§2.8).
