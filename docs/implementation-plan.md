# Implementation Plan

Architecture-driven, phase-by-phase plan for the B2B multi-tenant SaaS starter kit. It is derived **from the existing architecture docs and Cursor rules** (the source of truth), not from the investigated reference repositories. The frontend runtime-host direction (one product SPA, thin Electron/Capacitor hosts) is taken from [`architecture/frontend-foundation-investigation.md`](./architecture/frontend-foundation-investigation.md); it does not replace [`architecture/frontend.md`](./architecture/frontend.md) or the ADRs.

> Status: **Backend foundation (Phases 1–11) is implemented.** **Frontend Phases 12–15 are implemented** (`ui-kit`, `frontend-core`, `apps/web` FSD shell, `/me` + members vertical slice). **Phases 16–17 remain.** This document does not create packages by itself; each phase is implemented later, one at a time, in Cursor.

Related source-of-truth docs: [`architecture/workspace-topology.md`](./architecture/workspace-topology.md), [`architecture/backend.md`](./architecture/backend.md), [`architecture/bounded-contexts.md`](./architecture/bounded-contexts.md), [`architecture/persistence.md`](./architecture/persistence.md), [`architecture/multi-tenancy.md`](./architecture/multi-tenancy.md), [`architecture/authorization.md`](./architecture/authorization.md), [`architecture/api-contracts.md`](./architecture/api-contracts.md), [`architecture/frontend.md`](./architecture/frontend.md), [`architecture/design-system.md`](./architecture/design-system.md), [`architecture/shared-packages.md`](./architecture/shared-packages.md), [`architecture/boundaries.md`](./architecture/boundaries.md), [`architecture/decisions.md`](./architecture/decisions.md). Investigation (not source of truth): [`architecture/frontend-foundation-investigation.md`](./architecture/frontend-foundation-investigation.md).

---

# Part 1 — Backend Foundation

## 1. Scope of this plan (locked decisions)

These were confirmed for the **backend** foundation (Part 1, Phases 1–11) and constrain that work. Frontend locked decisions are in §9.

| Decision            | Choice for the foundation                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RBAC breadth**    | **Lean-but-generic.** `identity` (User), `tenancy` (Tenant, Membership), `authorization` (Role, Permission) with a **fixed system-permission catalog** + seeded **system roles** (Owner/Admin/Member). One permission enforced end-to-end. Custom tenant-defined roles CRUD + invitations **deferred** (the seams are built so they slot in without rework). |
| **Authentication**  | **Stubbed principal.** No password/JWT/refresh/sessions yet. The API edge injects an authenticated principal (dev middleware) and establishes `TenantContext`. Real credentials/tokens are a **later plan**, localized to the `identity` context + edge, so nothing else changes when they land.                                                             |
| **Depth per slice** | **End-to-end through HTTP.** `domain → application → postgres → logger → nest-http → composition → apps/api`, with Vitest per layer **plus an HTTP e2e against a real (containerized) Postgres**. Routes are URI-versioned (`/v1/...`). Frontend is **Part 2 (Phases 12–17)**.                                                                               |
| **Logging**         | **Pino**, not Nest-injectable. `Logger` port + `LoggerLocator` on `platform`; adapter in `packages/infrastructure/logger`.                                                                                                                                                                                                                                   |
| **Redis**           | **Deferred.** Effective permissions are resolved directly from Postgres (via context repositories). `platform` Cache/Lock/PubSub ports + `packages/infrastructure/redis` + permission caching come later. All keys/queries are designed **cache- and tenant-prefix-ready** now.                                                                              |

Out of scope for **Part 1 (backend)**: real authentication, Redis, transactional outbox + domain-event bus, `audit` and `notifications` contexts, `apps/worker` wiring, custom roles/invitations, Postgres RLS, `gateway`/realtime. Frontend is **Part 2**, not deferred as a blob.

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

Phases 4 and 5 are independent (both pure domain) and may be done in either order. Phase 6 depends on 3–5. Phases 7–11 are strictly sequential. **Frontend foundation continues as Phases 12–17 in Part 2.**

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
- Tests written at the layer's prescribed level (§2.9 backend, §10.6 frontend); domain/application need **no** DB.
- Frontend apps: FSD folder lint (`app → pages → features → shared`); no `scope:backend` imports; product features stay out of Electron/Capacitor hosts.

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
| **Frontend (historical)**              | Moved to **Part 2 (Phases 12–17)**. What remains after that foundation is listed in §14.                                                                                                            |
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

---

# Part 2 — Frontend Foundation

Phases 12–17. Derived from [`architecture/frontend.md`](./architecture/frontend.md), [`architecture/design-system.md`](./architecture/design-system.md), ADR-021–022, ADR-030, and the runtime-host direction in [`architecture/frontend-foundation-investigation.md`](./architecture/frontend-foundation-investigation.md). Existing `apps/web` and `apps/admin` are Hello World Vite apps; `packages/frontend/ui-kit` and `packages/frontend/core` do not exist yet.

**Out of scope for this part:** ESLint, Prettier, commitlint, Git hooks, Nx/workspace TypeScript/test infrastructure (owned centrally). Do not clone a fat in-app `shared/libs` tree. Do not triplicate FSD across Electron/Capacitor.

---

## 9. Scope of the frontend foundation (locked decisions)

| Decision               | Choice for the foundation                                                                                                                                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Audience apps**      | **Two Vite apps** (ADR-021): `apps/web` (tenant product) and `apps/admin` (back-office). Different permissions, bundle, and deploy cadence.                                                                                                                                                         |
| **Runtime hosts**      | **One tenant-product SPA.** Electron (`apps/desktop`) and Capacitor (`apps/mobile`) are **thin hosts** that load `apps/web` dist. They are not sibling FSD products. Admin stays web-only.                                                                                                          |
| **FSD hybrid**         | Shared `frontend/ui-kit` + `frontend/core`; features as **folders in the app** (ADR-022). Promote to `frontend/feature-*` only when **admin** needs the same feature. **Runtime hosts do not count** as a second app.                                                                               |
| **UI kit**             | `frontend/ui-kit` is the presentation package (ADR-030). UI technology is **TBD**: **no** Tailwind, Radix, shadcn, tokens, or `ThemeProvider`. Foundation export is a native HTML `Button`. Presentation-only (no RTK, no `contracts` for behavior).                                                |
| **State**              | RTK Query for server state (empty `createApi` + `injectEndpoints`); RTK slices for session/UI; `/me` is server-authoritative for effective permissions; `useCan` / unstyled `<Can>` in `core`. Backend remains authoritative.                                                                       |
| **Auth on the wire**   | **Stubbed principal**, matching the API. `prepareHeaders` sends `x-user-id` / `x-tenant-id` from session. No Bearer/JWT/refresh until the real-auth plan. A local-only principal picker in `apps/web` is in scope so the slice is demoable.                                                         |
| **Config**             | App Zod schema + `ConfigLoader` at **Vite plugin / Electron main** time (YAML uses `node:fs`). Bake a virtual module into the bundle. **Never** call `ConfigLoader` from React or `frontend/core` runtime. `baseUrl` is not `import.meta.env.VITE_API_URL` alone.                                   |
| **Platform isolation** | Ports in `frontend/core` (`StoragePort`, `LoggerPort`, `LinkingPort`, optional `WindowPort`). Web adapters in `core`. Host adapters live in `apps/desktop` / `apps/mobile` and are injected at bootstrap. Product/feature code must not import `electron`, `@capacitor/*`, or `window.electronAPI`. |
| **i18n**               | Lean typed i18next: engine in `core`, locale **content** in the owning app (`common`, `tenancy`, …). Lazy locale packs. Persist language via `StoragePort`.                                                                                                                                         |
| **Meet the backend**   | Only at `contracts`, `shared-kernel-types`, `utils`, `config`. Map the **contracts error envelope** in the RTK base query. No OpenAPI codegen internally. No backend Pino / `LoggerLocator` in the frontend.                                                                                        |

---

## 10. Frontend architecture design

### 10.1 Nx projects, tags, and dependency direction

From [`boundaries.md`](./architecture/boundaries.md) and [`workspace-topology.md`](./architecture/workspace-topology.md). Hosts are added in Phase 16 (not listed in topology today).

| Project           | Tags                                    | May depend on                                                                                                                |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `frontend/ui-kit` | `scope:frontend`, `layer:ui`            | `utils` (+ React). **Not** Tailwind / Radix / theme. **Not** `contracts`, **not** `core`.                                    |
| `frontend/core`   | `scope:frontend`, `layer:frontend-core` | `contracts`, `shared-kernel-types`, `utils`, `config` (types only — no `ConfigLoader` at runtime). **Not** `ui-kit`.         |
| `apps/web`        | `scope:frontend`, `type:app`            | `ui-kit`, `core`, `contracts`, `shared-kernel-types`, `utils`, `config`                                                      |
| `apps/admin`      | `scope:frontend`, `type:app`            | same as `web`                                                                                                                |
| `apps/desktop`    | `scope:frontend`, `type:app`            | `config` (main process); **must not** import `nest-http` / `composition` / backend layers. Must **not** contain product FSD. |
| `apps/mobile`     | `scope:frontend`, `type:app`            | Capacitor config; `webDir` = `apps/web` dist. Same forbidden edges as desktop.                                               |

**Forbidden edges:** `scope:backend ↔ scope:frontend`; `layer:ui → contracts|core`; `layer:frontend-core → ui`; `type:app → type:app`; product/feature code → Electron/Capacitor APIs.

Optional later (not this foundation): `packages/frontend/platform` for port types; `packages/frontend/vite-config` if the ConfigLoader plugin is copied into a third Vite app. Prefer copy-once-then-extract.

### 10.2 Layering (audience vs runtime)

```text
Audience     web (tenant product)     admin (ops)
Runtime      Browser    Electron      Capacitor
```

```
packages/frontend/ui-kit      presentation (native Button; UI tech TBD)
packages/frontend/core        store factory, RTK Query, session, can(), ports, i18n engine
apps/web                      product SPA (FSD: app / pages / features / shared)
apps/admin                    back-office SPA (own FSD folders)
apps/desktop                  Electron main + preload; loads the web build
apps/mobile                   Capacitor shell; webDir = apps/web dist
```

Do **not** create `apps/desktop/src/features/members`. That is the failure mode.

### 10.3 Where each concern lives

| Concern                                                     | Package / app                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| RTK store, base API, 401 handling, session, `useCan`, `/me` | `frontend/core`                                                                      |
| Native `Button` (no theme / Tailwind / Radix)               | `frontend/ui-kit`                                                                    |
| Tenant product screens                                      | `apps/web` FSD until **admin** needs them                                            |
| Admin-only screens                                          | `apps/admin` FSD                                                                     |
| Vite HTML, Capacitor config, Electron main                  | Host apps                                                                            |
| Storage, deep link, window                                  | Ports in `core`; adapters in hosts (web adapters ship with `core`)                   |
| Zod wire types                                              | `contracts` (already exist)                                                          |
| Pure helpers                                                | `@b2b-saas-starter-kit/utils`                                                        |
| YAML/env validation                                         | `ConfigLoader` in Vite plugin / Electron main                                        |
| Locale JSON                                                 | Owning app (`apps/web/src/shared/assets/locales`, …)                                 |
| Path constants + `buildPath`                                | `apps/web` (product routes). Router **factory** (browser vs hash) is a host concern. |

App `shared/` stays **thin**. Anything reused goes to `ui-kit` / `core` / `utils`. Do not recreate Backgammon’s in-app `shared/libs` framework.

### 10.4 Ports (in `core`, no Electron/Capacitor types)

| Port                                               | Web adapter (this plan)                       | Later host adapters                                            |
| -------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `StoragePort` (`get` / `set` / `remove`)           | memory + `localStorage`                       | Electron `safeStorage`; Capacitor Preferences / Secure Storage |
| `LoggerPort` (`debug` / `info` / `warn` / `error`) | `console` in dev; `error` (and above) in prod | Electron file log; native crash later                          |
| `LinkingPort`                                      | no-op / `window` location                     | custom protocol; App Links                                     |
| `WindowPort` (optional)                            | no-ops                                        | `setTitle` / minimize                                          |

Bootstrap injection: `createProductApp({storage, logger, routerHistory, …})` so hosts pass adapters. Web uses the web adapters by default.

### 10.5 Auth, API, and `/me` (stubbed principal)

The API still trusts `x-user-id` / `x-tenant-id` (not production). The frontend foundation matches that seam:

- Session slice holds `userId`, `activeTenantId`, and (after `/me`) effective permissions.
- `fetchBaseQuery` `prepareHeaders` sets those two headers. `authorization: Bearer` is **deferred** with real auth.
- `baseUrl` comes from baked app config (Phase 14), not a raw `VITE_API_URL` read inside `core`.
- Tag types start from the existing slice: `Me`, `Tenant`, `Membership` (add `Role` / others when screens exist).
- `401` in the base query maps to a missing-principal / “set principal” path, not a JWT refresh.
- `useCan(permission)` / `<Can>` gate UX only. Permission identifiers come from `contracts` (same catalog as the API).

### 10.6 Testing strategy (frontend)

| Layer             | Test type          | Tooling / notes                                                                                                      |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `frontend/ui-kit` | Unit               | Native `Button` renders. No MSW. No theme tests.                                                                     |
| `frontend/core`   | Unit               | Store factory, `can()`, header injection, error-envelope mapping, port fakes. `./testing` exports `createTestStore`. |
| `apps/web`        | Unit / integration | `renderWithProviders` (store + router; i18n wrappers in the app). MSW handlers typed with **contracts**.             |
| `apps/web`        | Optional later     | Playwright against running `apps/api` — not required for Phase 15 DoD.                                               |

---

## 11. Key frontend decisions & trade-offs (summary)

1. **One product SPA + thin hosts** — maximize reuse; Electron/Capacitor are shells, not FSD copies. Admin remains a **second audience** app.
2. **Runtime hosts do not trigger `feature-*` extraction** — only a second _audience_ (admin) does. Document this when Phase 16 lands (ADR-022 clarification).
3. **`ui-kit` and `core` stay strictly split** — `Can` in `core` is an unstyled children gate; `Button` lives in `ui-kit`. Apps compose both.
4. **ConfigLoader at build time** — YAML cannot run in the renderer/WebView. Desktop may re-load in **main** later; Capacitor bakes at `nx build web`.
5. **Stubbed principal headers** — the vertical slice works against today’s API without inventing JWT on the client.
6. **UI technology is TBD (ADR-030)** — this foundation ships a native HTML `Button` only. No Tailwind, Radix, tokens, or `ThemeProvider`.
7. **Copy the Vite ConfigLoader plugin into `admin`** (Phase 17) rather than extracting a `frontend/vite-config` package on day one.
8. **i18n engine in `core`, copy in the app** — same pattern as Backgammon, SaaS namespaces, no game leftovers.

---

## 12. Frontend implementation order

```
12 frontend/ui-kit (native Button; UI tech TBD)
        │
13 frontend/core (store, RTK API, session, can(), ports, testing)
        │
14 apps/web FSD shell (providers, router factory, ConfigLoader plugin, i18n, error boundary)
        │
15 product vertical slice (GET /v1/me + members, useCan, MSW)
        │
        ├─▶ 16 thin desktop + mobile hosts (load web dist)
        └─▶ 17 apps/admin FSD shell (own audience; reuse ui-kit + core)
```

Phases 12 and 13 are independent (`ui-kit` ↛ `core`, `core` ↛ `ui-kit`) and may be done in either order; both must exist before 14. Phases 16 and 17 are independent of each other; both depend on 15 (a real web dist / shared libs). Do not start Phase 16 by copying features into the hosts.

---

## 13. Frontend phases

Each phase lists Goal · Scope · Packages · Tasks · Tests · Verification · Definition of Done · Deferred, same as Part 1.

### Phase 12 — `frontend/ui-kit` (presentation package)

- **Goal:** stand up the presentation package so apps import a real shared `Button` instead of inventing local ones.
- **Scope:** `packages/frontend/ui-kit` — a native HTML `<button>` wrapper only. No Tailwind, Radix, shadcn, CSS tokens, or `ThemeProvider`. No RTK. No `contracts` import.
- **Packages/projects:** create `packages/frontend/ui-kit` (tags `scope:frontend`, `layer:ui`). Use the workspace Nx React library generator (`--no-interactive`); wire as `@b2b-saas-starter-kit/ui-kit`.
- **Implementation tasks:**
  - Generate the lib; add tags; export from the package entry.
  - Implement `Button` as a native `<button type="button">` forwarding standard HTML button attributes.
  - Do **not** add a CSS framework, theme provider, or design tokens.
- **Tests:** unit — `Button` renders and forwards `disabled` / `onClick`.
- **Verification:** `nx lint/typecheck/test` on the ui-kit project; `nx graph` shows `ui-kit → utils` only (plus React).
- **Definition of Done:** package exported; apps can depend on it; no data-fetching in `ui-kit`.
- **Deferred:** UI component library, Tailwind/Radix, tokens, `ThemeProvider`, toast/forms, tenant branding.

### Phase 13 — `frontend/core` (store, API, session, ports)

- **Goal:** the shared state/data kernel used by web, admin, and (later) every product host.
- **Scope:** store factory (extra slices/middleware from the app), empty RTK Query `createApi`, session slice (`userId`, `activeTenantId`, permissions from `/me`), `useCan` + unstyled `<Can>`, frontend **ports** + **web adapters**, contracts error-envelope mapping in `baseQuery`, `./testing` (`createTestStore`).
- **Packages/projects:** create `packages/frontend/core` (tags `scope:frontend`, `layer:frontend-core`) → `@b2b-saas-starter-kit/frontend-core` (or the workspace’s established name). Must **not** import `ui-kit` or backend packages.
- **Implementation tasks:**
  - `createStore({preloadedState, extraSlices, ports})`; typed `useAppDispatch` / `useAppSelector`.
  - Empty `createApi` + `fetchBaseQuery`: `baseUrl` from **injected config**; `prepareHeaders` sets `x-user-id` / `x-tenant-id` from session (no Bearer yet).
  - Map `{code, message}` (contracts envelope) to a typed frontend error; do not invent a parallel code list for wire errors (`UNAUTHORIZED`, `INSUFFICIENT_PERMISSION`, `VALIDATION_ERROR`, …).
  - `LoggerPort` / `StoragePort` / `LinkingPort` (+ optional `WindowPort`) with web adapters. Do not `redux-persist` the session until a storage port is used deliberately (memory default).
  - `can(permissions, permission)` helper + `useCan` / `<Can>`.
  - Frontend logger: `debug`/`info`/`warn`/`error`; production still emits `error` (not a total console no-op).
- **Tests:** unit — header injection; `can()` allow/deny; envelope mapping; store factory; port fakes; locator-style ports do not throw when web adapters are passed in.
- **Verification:** `nx lint/typecheck/test` on core; graph shows `core → contracts + shared-kernel-types + utils` (and `config` types if used); a deliberate `core → ui-kit` import fails boundaries.
- **Definition of Done:** apps can `createStore` + `api.injectEndpoints`; session + `can()` work without a browser host.
- **Deferred:** JWT refresh in base query; `redux-persist`; Sentry/Crashlytics adapters; Electron/Capacitor adapters (Phase 16+).

### Phase 14 — `apps/web` FSD shell + config + i18n + router

- **Goal:** grow Hello World into the product **app shell** (providers, routing, config, i18n, errors) with adapter injection, still without product screens.
- **Scope:** `apps/web/src/{app,pages,features,shared}` FSD folders + downward import lint; Vite plugin that runs `ConfigLoader` and exposes a virtual module; typed i18n (engine from `core`, JSON in the app); router **factory** (default `createBrowserRouter`; hash is a host option); error boundary; `createProductApp({storage, logger, …})`.
- **Packages/projects:** existing `apps/web`. Add FSD path aliases **inside the app only** (`@/app`, `@/pages`, `@/features`, `@/shared`). Packages stay `@b2b-saas-starter-kit/*`.
- **Implementation tasks:**
  - FSD folders; `app/` owns providers (store → i18n ready → router → error boundary). Keep `shared/` thin.
  - App Zod config schema; Vite plugin: `ConfigLoader` (`source: 'yaml'` and/or env) → virtual module. `core` receives the baked object; React modules never import `@b2b-saas-starter-kit/config` loaders that touch `node:fs`.
  - Typed `paths` / `buildPath` / Zod `useRouteParams`. Do **not** hard-code `createBrowserRouter` inside features.
  - i18n: lazy locale import, typed keys, SaaS namespaces (`common`, `tenancy`, …). Persist locale via `StoragePort`.
  - Error boundary in `app/` using `ui-kit` `Button` or plain markup for fallback chrome; log via `LoggerPort`.
  - Write a short ADR for i18n (not in kit ADRs today) when this phase lands.
- **Tests:** unit — `renderWithProviders` (store + router + i18n); config schema parse/reject; a sample typed path builder.
- **Verification:** `nx lint/typecheck/test web`; FSD folder lint (`app → pages → features → shared`); `nx serve web` boots the shell.
- **Definition of Done:** shell renders with i18n + empty routes; config is baked; injection point exists for hosts.
- **Deferred:** product pages (Phase 15); hash router until a host needs it; extracting the Vite plugin to its own package.

### Phase 15 — Product vertical slice (`/me` + members)

- **Goal:** prove FE/BE integration on the **same** HTTP slice the API already e2e-tests: session from `GET /v1/me`, members list gated by `tenancy.members.read`.
- **Scope:** `apps/web` features/pages for **me** (profile + effective permissions) and **tenant members**; RTK `injectEndpoints` using **contracts** DTOs; local-only **dev principal picker** (sets `userId` / `tenantId` in session; hidden unless baked config `env` is `development`). Permission-aware UI via `useCan` / `<Can>` + `ui-kit` `Button`.
  - **Preconditions (Phase 14 landed):** FSD `app → pages → features → shared`; `@/` aliases; `createProductApp` + providers; baked `virtual:web-config` / `environment` (`env`, `apiBaseUrl`); `FrontendApi.instance` (empty endpoints, tags `Me` | `Tenant` | `Membership`, `prepareHeaders` already sets `x-user-id` / `x-tenant-id`); session slice (`userId`, `activeTenantId`, `effectivePermissions`); `useCan` / `<Can>`; i18n namespaces `common` / `tenancy`; typed `paths` in `@/shared/router`. Native `Button` only (ADR-030). No MSW yet.
  - **HTTP slice (already on `apps/api`):** `GET /v1/me` and `GET /v1/tenants/:tenantId/members`. `baseUrl` is already `…/v1`, so RTK paths are `/me` and `/tenants/${tenantId}/members`. `GET /me` is **not** `@TenantOptional` — both headers are required. Missing `x-user-id` → **401**. No active membership or missing `tenancy.members.read` → **403** `{code, message}` (`errorOutputSchema`). Use `PermissionName.tenancyMembersRead` from contracts (`tenancy.members.read`), **not** the stale `tenant.members.invite` example in `frontend.md`.
- **Packages/projects:** `apps/web` (folders, not a `feature-*` lib). Endpoints that belong only to this audience stay in the app until admin needs them. Add `msw` via pnpm (web or root `devDependency`); do not hand-edit the lockfile. Frontend must not import backend packages (`domain`, `application`, `composition`, `postgres`, `nest-http`).
- **Target FSD:**

```
pages/me/me-page.tsx
pages/members/members-page.tsx
features/me/             # getMe injectEndpoints + session hydration
features/members/        # listMembers injectEndpoints
features/dev-principal/  # picker; hidden unless environment.appEnv === 'development'
shared/router/paths.ts   # /me, /tenants/:tenantId/members
shared/testing/          # MSW server + contract-parsed fixtures
app/providers/router     # register routes only
```

Pages compose features. Features do not import `@/app`. `createWebRouter` only wires routes.

- **Implementation tasks:**
  - **MSW:** handlers parse fixtures with `meOutputSchema`, `tenantMembersOutputSchema`, and `errorOutputSchema`. Wire into `renderWithProviders` (or a test-only wrapper) so page tests do not hit a real API.
  - **`getMe`:** `FrontendApi.instance.injectEndpoints` in `features/me`. `GET /me`; `providesTags: ['Me']`. On success `dispatch(setSession({ userId: data.user.id, activeTenantId: data.membership.tenantId, effectivePermissions: data.effectivePermissions }))`. Do not invent a second permissions store. Fetch after the picker writes ids, or on layout mount when session ids already exist.
  - **`listMembers`:** inject in `features/members`. `GET /tenants/${tenantId}/members`; `providesTags: ['Membership']`. Members page uses `useCan(PermissionName.tenancyMembersRead)` / `<Can>` to hide or disable the list (UX only). **403 remains authoritative.**
  - **Dev principal picker:** inputs for `userId` + `tenantId` → `setSession` (permissions `[]` until `/me` succeeds). `prepareHeaders` already reads those ids. Hide when `environment.appEnv !== 'development'`. A 401 (`UNAUTHORIZED`) on `/me` or members shows the picker — not a login page. In-memory session is enough; `StoragePort` persistence is optional if it stays a few lines.
  - **Tenant switcher stub:** even with one tenant, changing `activeTenantId` must refetch `getMe` and `invalidateTags(['Me', 'Membership'])`.
  - **Chrome:** simple nav — Home, Me, Members (`<Can>` on Members). Register routes in `app/providers/router`. Native `Button` only. i18n keys in existing `common` / `tenancy` JSON; add a namespace only if those two are genuinely insufficient.
- **Tests:** MSW + `renderWithProviders`. `/me` hydrates session so `useCan(PermissionName.tenancyMembersRead)` is true for an Owner fixture and false for a Member fixture. Members list visible (Owner) vs hidden/disabled (Member). 401 → picker. 403 envelope `code` / `message` surfaced in the UI. No Playwright.
- **Verification:** `pnpm nx run-many -t lint,typecheck,test -p web`. Manual (not DoD): `pnpm infra:up`, `pnpm nx serve api`, `pnpm nx serve web`; seed via the existing HTTP e2e flow (create user → create tenant → paste ids into the picker). Owner sees members; Member principal does not. Optional Playwright is **not** DoD.
- **Definition of Done:** the kit’s first UI slice talks to `/v1` through `contracts` with permission-aware chrome; frontend still imports no backend layers; picker is absent when baked `env` is not `development`.
- **Deferred:** create-user / create-tenant forms, invitations, real login / JWT / Bearer `prepareHeaders`, tenant branding from API (waits on UI tech), copying members into `apps/admin` or a `frontend/feature-*` lib.

### Phase 16 — Thin runtime hosts (desktop + mobile)

- **Goal:** prove **one SPA** before native plugins: Electron and Capacitor load `apps/web` dist and do not grow their own features.
- **Scope:** `apps/desktop` (Electron main + preload + `BrowserWindow` loading the web build); `apps/mobile` (Capacitor config, `webDir` → web dist). Empty of product FSD. Web adapters remain the default; native `StoragePort` / `LinkingPort` adapters are **out of this phase** except a documented injection seam.
- **Packages/projects:** create `apps/desktop` and `apps/mobile` (`scope:frontend`, `type:app`). Update [`workspace-topology.md`](./architecture/workspace-topology.md) and [`boundaries.md`](./architecture/boundaries.md) to list them. Clarify ADR-022: runtime hosts do not count as a second app for `feature-*` promotion.
- **Implementation tasks:**
  - Desktop: main process only (window chrome); renderer **is** the web bundle, not a second React tree.
  - Mobile: Capacitor shell; `nx build web` is the payload.
  - Document history-mode caveat (hash / custom protocol) without implementing native plugins.
  - Graph/lint: hosts must not depend on `nest-http`, `composition`, `postgres`, `domain`.
- **Tests:** smoke — project targets exist; desktop/mobile configs point at web dist (unit or script assertion). Full native e2e deferred.
- **Verification:** `nx graph` shows hosts → web artifact / `config`, not backend layers; a deliberate `apps/desktop` feature folder for members is rejected in review.
- **Definition of Done:** both hosts exist as empty shells; product code still lives only in `apps/web` + `ui-kit` + `core`.
- **Deferred:** `safeStorage` / Secure Storage adapters, deep links, push, splash, updater, Electron file logger, hash router switch.

### Phase 17 — `apps/admin` FSD shell

- **Goal:** the **second audience** app exists as a real shell on `ui-kit` + `core`, without copying product features.
- **Scope:** grow `apps/admin` to FSD (`app` / `pages` / `features` / `shared`); reuse ConfigLoader Vite plugin (copy from web, do not extract a package yet); own locale packs; placeholder home (not the members feature).
- **Packages/projects:** existing `apps/admin`. Same tags as `web`.
- **Implementation tasks:** providers + router factory + baked config; do **not** extract `apps/web` features into `frontend/feature-*` until a screen is actually shared.
- **Tests:** shell render test; boundaries green.
- **Verification:** `nx lint/typecheck/test admin`; graph `admin → ui-kit + core + contracts`, not `web`.
- **Definition of Done:** admin boots as a separate audience app sharing libs; members UI remains web-only.
- **Deferred:** admin-only ops screens, impersonation, support tools.

---

## 14. Deferred after the frontend foundation

| Area                                             | Why deferred / how it slots in later                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Real authentication UI**                       | Login, refresh cookie, Bearer `prepareHeaders`, 401 refresh — lands with the identity/JWT plan; replace the dev principal picker only. |
| **UI component / CSS stack**                     | ADR-030: tech TBD. Add Tailwind/Radix/tokens/`ThemeProvider` only after a new ADR. Forms/toasts wait on that choice.                   |
| **Native adapters**                              | Electron `safeStorage` / file log; Capacitor Secure Storage, push, back button — implement behind existing ports.                      |
| **`frontend/feature-*` libs**                    | Only when **admin** needs a web feature. Hosts never justify this.                                                                     |
| **`packages/frontend/platform` / `vite-config`** | Extract if port types or the Vite plugin are shared widely; not on day one.                                                            |
| **Playwright e2e / Sentry**                      | Optional after the MSW slice is green.                                                                                                 |
| **Tenant branding from API**                     | Product goal; needs UI tech + `ThemeProvider` (not in this foundation).                                                                |
| **Embed SDK / extra FSD layers**                 | Out of scope (`widgets/`, `entities/`, Phaser, iframe SDK).                                                                            |

---

## 15. Frontend assumptions & recommendations

- **ADR-030 is source of truth for `ui-kit`:** native `Button` only; UI technology (Tailwind, Radix, theme) is TBD. Do not reintroduce ADR-023 in implementation.
- **`import.meta.env.VITE_API_URL` in `frontend.md` is insufficient for packaged clients.** This plan uses ConfigLoader-at-build; update `frontend.md` when Phase 14 lands.
- **i18n is a new ADR** at Phase 14 (i18next, lazy packs, typed keys, content in the app).
- **Integration against compose `apps/api`** is the intended manual path for Phase 15; MSW is the automated path. Testcontainers/Playwright remain optional.
- **Dev principal picker is local-only** and must not appear when the API is in production (the API already refuses DevPrincipal there).
