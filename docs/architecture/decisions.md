# Decision Log (ADRs)

Every significant architectural decision made during the design phase, with the options considered, the choice, and the rationale. Entries are stable references for the rest of the docs.

Status legend: **Accepted** · **Supersedes** (replaces a prior decision).

---

## ADR-001 — Layer-first Nx topology (contexts as folders)

**Decision:** The Nx projects are the architectural layers (`domain`, `application`, `platform`, `infrastructure`, `nest-http`, `composition`); bounded contexts are folders inside them.
**Options:** (A) layer-first ✓; (B) context = one library, layers as folders; (C) context×layer projects; (D) hybrid domain-split.
**Rationale:** Prioritizes Nx-enforced _layer_ dependency rules with a low project count. Accepted trade-off: context isolation cannot be an Nx project boundary and is enforced by lint instead; `affected` is per-layer. See [`workspace-topology.md`](./workspace-topology.md).

## ADR-002 — Fine-grained bounded contexts

**Decision:** Five contexts: identity, tenancy, authorization, audit, notifications.
**Rationale:** A starter kit should teach clean boundaries; small single-responsibility contexts best demonstrate cross-context patterns. See [`bounded-contexts.md`](./bounded-contexts.md).

## ADR-003 — Infrastructure split by concern

**Decision:** `infrastructure/{postgres,logger,redis,messaging}` (grouping directory), each concern its own Nx project. `logger` is Pino only (no Nest) so workers and scripts never pull TypeORM or Swagger.
**Rationale:** Different dependency footprints and change cadences keep `affected` meaningful.

## ADR-004 — Repository ports live in the domain layer

**Decision:** Repository interfaces are defined in `domain/<context>/ports` (classic DDD).
**Options:** (A) ports in domain ✓; (B) ports in application; (C) split.
**Rationale:** Domain owns its repository contracts; interfaces are pure (reference only domain models + `shared-kernel-types`), so purity is preserved. See [`persistence.md`](./persistence.md).

## ADR-005 — Separate domain models and TypeORM entities (with mappers)

**Decision:** Pure domain models; `*.entity.ts` TypeORM classes in infrastructure; explicit mappers.
**Options:** (A) separate + mappers ✓; (B) entities-as-domain-models; (C) separate with generated mappers.
**Rationale:** Keeps the domain framework-free (locked rule); decouples schema from model. Mapping cost mitigated by a standard convention. See [`persistence.md`](./persistence.md).

## ADR-006 — Single global migration timeline

**Decision:** One ordered migration set in `infrastructure/postgres/migrations`, organized by context for readability.
**Rationale:** Simplest source of truth for one shared database; easy upgrade path to per-context ownership. See [`persistence.md`](./persistence.md).

## ADR-007 — Transactions via a Unit-of-Work port

**Decision:** `UnitOfWork` port in `platform`, implemented over TypeORM `DataSource.transaction` in `infrastructure/postgres`.
**Options:** (A) UoW port ✓; (B) ambient CLS `@Transactional`; (C) explicit `EntityManager` threading.
**Rationale:** Keeps application framework-agnostic and unit-testable (in-memory UoW); avoids leaking TypeORM types into port signatures. See [`persistence.md`](./persistence.md).

## ADR-008 — Cross-context referencing by ID, no cross-context FKs

**Decision:** Contexts reference each other only by ID value; foreign keys exist only within a context.
**Rationale:** Preserves context autonomy, enables future extraction, avoids schema-level coupling. See [`bounded-contexts.md`](./bounded-contexts.md), [`persistence.md`](./persistence.md).

## ADR-009 — Redis behind generic capability ports; policy per-context

**Decision:** `CachePort`/`LockPort`/`PubSubPort` in `platform`; adapters in `infrastructure/redis`; caching/locking policy decided in each context's application layer.
**Options:** (A) generic ports in platform; (B) per-context ports in domain; (C) hybrid ✓.
**Rationale:** Caching/locking are technical capabilities, not domain concepts; domain stays Redis-free; one shared adapter avoids duplication. See [`infrastructure.md`](./infrastructure.md).

## ADR-010 — NestJS confined to outer ring; application is Nest-aware only via `@Injectable`

**Decision:** NestJS lives in `apps` + `infrastructure` (where a Nest adapter is justified) + `packages/nest-http` + `composition`; domain is fully pure; the only Nest in application is the `@Injectable` decorator. Logger is **not** a Nest provider.
**Options:** (A) framework-free application (factory wiring); (B/C) `@Injectable`-only application ✓.
**Rationale:** For a starter kit, pure-application factory wiring adds boilerplate that obscures intent; the domain stays pure where it matters. See [`backend.md`](./backend.md).

## ADR-011 — Dedicated composition layer for DI wiring

**Decision:** Per-context NestJS modules live in a `composition/<context>` layer that assembles domain + application + infrastructure; apps import them.
**Options:** (A) compose in apps; (B) context modules in infrastructure; (C) dedicated composition layer ✓.
**Rationale:** Solves the "where does a context's Nest module live?" problem that layer-first creates; wiring written once, apps stay thin, infra stays focused. See [`backend.md`](./backend.md).

## ADR-012 — Shared Zod `contracts` package · **Supersedes** the earlier "independent types + OpenAPI codegen" decision

**Decision:** `packages/shared/contracts` holds Zod request/response schemas + inferred types, consumed as `@b2b-saas-starter-kit/contracts` by backend (`createZodDto`) and frontend directly. OpenAPI is generated for external consumers only.
**Rationale:** In a monorepo, a shared contract is the single biggest consistency/DX win and removes codegen drift; the prior decision was a multi-repo artifact. Application layer still does **not** depend on contracts (mapping in `apps/api`). See [`api-contracts.md`](./api-contracts.md).

## ADR-013 — Shared library set: contracts, shared-kernel-types, utils, config (no constants lib)

**Decision:** Exactly these shared (`scope:shared`) packages cross the FE/BE line and physically live under `packages/shared/*` (`config` was formerly referred to as `config-validation`).
**Rationale:** Broader than "contracts-only" (utils + shared config loading are genuinely shared) but governed by strict allow/forbid rules to avoid a dumping ground. See [`shared-packages.md`](./shared-packages.md).

## ADR-014 — `shared-kernel-types` leaf for IDs/enums (domain must not import contracts)

**Decision:** Branded IDs + cross-cutting enums live in `packages/shared/kernel-types` as the `@b2b-saas-starter-kit/shared-kernel-types` leaf that both `contracts` and `domain` depend on.
**Options:** (A) IDs in contracts, domain imports contracts; (B) dedicated leaf ✓; (C) duplicate + map.
**Rationale:** Avoids `domain → contracts` coupling _and_ duplication. Backend domain base classes stay in `domain/shared-kernel`. See [`shared-packages.md`](./shared-packages.md).

## ADR-015 — Pool multi-tenancy (shared schema + `tenant_id`)

**Decision:** One DB, shared schema, `tenant_id` on tenant-owned tables; pluggable strategy left as a future seam.
**Options:** (A) pool ✓; (B) schema-per-tenant; (C) database-per-tenant; (D) pluggable.
**Rationale:** Cheapest/simplest, standard for B2B SaaS; clean enough to extend later. See [`multi-tenancy.md`](./multi-tenancy.md).

## ADR-016 — Hybrid tenant-context propagation

**Decision:** Explicit `tenantId` at the application boundary + ambient `TenantContext` guardrail in infrastructure; workers re-establish context from job payloads.
**Options:** (A) explicit only; (B) ambient CLS only; (C) hybrid ✓.
**Rationale:** Explicit for clarity/testability, ambient for automatic enforcement. See [`multi-tenancy.md`](./multi-tenancy.md).

## ADR-017 — Tenant-aware base repository (default), RLS opt-in

**Decision:** A `TenantAwareRepository` auto-scopes queries by the ambient tenant; Postgres RLS documented as an opt-in secure profile; explicit escape hatch for cross-tenant ops.
**Options:** (A) base repo ✓; (B) explicit tenantId + assert; (C) RLS primary; (D) base repo + RLS.
**Rationale:** Ergonomic default that's hard to bypass accidentally; RLS available as defense-in-depth. See [`multi-tenancy.md`](./multi-tenancy.md).

## ADR-018 — RBAC + resource policy seam

**Decision:** Permission-based RBAC backbone + a policy seam for resource/attribute rules.
**Options:** (A) RBAC only; (B) RBAC + policy ✓; (C) full policy engine.
**Rationale:** Covers both coarse ("can invite members") and fine ("edit this record") without over-abstracting a starter kit. See [`authorization.md`](./authorization.md).

## ADR-019 — Authorization enforced at API (coarse) and application (fine)

**Decision:** Coarse permission guard on controllers + authoritative fine-grained checks in use cases; domain enforces invariants.
**Options:** (A) API only; (B) application only; (C) both ✓.
**Rationale:** Fast edge rejection + authoritative checks that also protect non-HTTP callers (workers). See [`authorization.md`](./authorization.md).

## ADR-020 — Frontend uses server-provided effective permissions + `can()`

**Decision:** Backend returns effective permissions for the active tenant; frontend gates UX via `useCan`/`<Can>`; backend remains authoritative.
**Options:** (A) effective permissions ✓; (B) FE derives from roles; (C) shared isomorphic policies.
**Rationale:** Single source of truth, no drift; FE checks are UX only. See [`authorization.md`](./authorization.md).

## ADR-021 — Two frontend apps (`web`, `admin`) sharing libs

**Decision:** Separate tenant-facing and back-office apps over shared `ui-kit`/`core` libs.
**Options:** (A) two apps ✓; (B) web now, admin later; (C) single app.
**Rationale:** Realistic SaaS shape; clean audience/permission/deploy separation. See [`frontend.md`](./frontend.md).

## ADR-022 — FSD hybrid on the frontend

**Decision:** Shared `ui-kit` + `core` libs; features as FSD folders inside apps, promoted to libs only when shared by both apps.
**Options:** (A) folders + minimal libs; (B) feature libraries; (C) hybrid ✓.
**Rationale:** Avoids premature libraries while keeping shared boundaries clean. See [`frontend.md`](./frontend.md).

## ADR-023 — Single themeable `ui` design system with runtime tenant branding · **Superseded** by ADR-030

**Decision (historical):** One `frontend/ui` lib (shadcn + Radix + Tailwind preset + CSS-variable tokens); per-tenant branding applied at runtime; brand-color + light/dark minimum.
**Rationale (historical):** Supports B2B white-labeling without rebuilds; accessibility preserved via Radix; consistency across web/admin.
**Superseded because:** UI technology is not locked; the presentation package is `ui-kit` with a native `Button` only. See ADR-030.

## ADR-024 — Two-axis Nx tags + folder-level context-isolation lint

**Decision:** `scope:*` × `layer:*` tags with `@nx/enforce-module-boundaries`; context isolation via a folder-level import lint.
**Options:** (A) tags + lint ✓; (B) tags only; (C) context tag axis (incompatible with layer-first).
**Rationale:** Nx hard-enforces layers + scope; lint covers the context axis layer-first can't. See [`boundaries.md`](./boundaries.md).

## ADR-025 — Applications: api, worker, web, admin (gateway deferred)

**Decision:** Four thin apps; a realtime WebSocket `gateway` is deferred (realtime can ride on `api` + Redis pub/sub initially).
**Rationale:** Covers the core SaaS shape without over-provisioning. See [`workspace-topology.md`](./workspace-topology.md).

## ADR-026 — Containerized infra baseline (Compose for Postgres+Redis; apps on host in dev)

**Decision:** Docker Compose provides only PostgreSQL and Redis for local dev and single-VPS staging; apps run on the host in dev and (later) ship as per-app multi-stage images built inside Docker (`pnpm nx build` + `pnpm deploy --prod`). Postgres is pinned to 17.x with a named volume; Redis is 7.2 standalone, **fully ephemeral** (no RDB/AOF, no volume) with `maxmemory-policy noeviction`. Containers are **env-driven** (`DATABASE_URL`/`REDIS_URL`, via a new `source: 'env'` in `@b2b-saas-starter-kit/config`), **NGINX** is the staging reverse proxy and frontend static server, and a Node-version guard keeps `.nvmrc` / `engines` / Dockerfile `ARG NODE_VERSION` in sync.
**Options:** (A) infra-only Compose + apps on host ✓; (B) full app containers (with `Dockerfile.dev` + bind mounts) in dev; (C) Kubernetes/Terraform now.
**Rationale:** Cheapest, simplest workflow with the best HMR, a production-like staging, and a clean portability path to GCP managed services (Cloud SQL, Memorystore) with **no Compose dependency in production**. Redis durability is delegated to Postgres + the outbox, so it can stay ephemeral. See [`../infrastructure/README.md`](../infrastructure/README.md) and [`infrastructure.md`](./infrastructure.md). (Numbered ADR-026; the plan's provisional "ADR-015" collided with the existing pool-multi-tenancy ADR.)

## ADR-027 — Logger is a platform port + process locator; vendor is Pino

**Decision:** `Logger` lives in `platform` (`context`, level methods, pino-style overloads). Process locator `LoggerLocator.init` / `LoggerLocator.get` (throws if uninitialized). Adapter is Pino in `packages/infrastructure/logger`. Not Nest-injectable (`nestjs-pino` rejected). No silent no-op default. No driver switch until a second adapter exists. Production default level `info`; pretty-print only in development. `Error` first argument serializes as `{err}`. Redact authorization headers.
**Options:** (A) Nest-injectable logger; (B) `export const logger` from infrastructure imported by application; (C) platform locator + infra adapter ✓.
**Rationale:** Application must not import Pino or Nest; constructors must not take `Logger`. Tests swap a memory logger via `LoggerLocator.init`. See [`infrastructure.md`](./infrastructure.md), [`backend.md`](./backend.md).

## ADR-028 — Dedicated `nest-http` delivery kit (not composition)

**Decision:** HTTP bootstrap helpers (`ApiBuilder`, global pipe/filter/interceptor, Swagger, `@Public()`, process error handlers) live in `packages/nest-http` (`@b2b-saas-starter-kit/nest-http`, `layer:nest-http`). Composition remains port→adapter Nest modules only. `HttpStatus` and the error envelope live in `contracts`. The kit does not import domain, application, or postgres. JWT / `RequirePermission` stay in `apps/api`.
**Options:** (A) stuff pipes/filters/Swagger into `apps/api`; (B) mix HTTP kit into `composition`; (C) one Nest+Pino `common` package; (D) dedicated `nest-http` + separate logger adapter ✓.
**Rationale:** Apps stay thin and consistent; workers must not pull Nest/Swagger; application must not import Nest beyond `@Injectable`. See [`backend.md`](./backend.md), [`workspace-topology.md`](./workspace-topology.md).

## ADR-029 — URI versioning, CORS, and HTTP bootstrap defaults

**Decision:** `VersioningType.URI` default `'1'` (`/v1/...`). CORS from typed env config; **fail closed in production** if origins unset (no silent `origin: '*'`). `helmet()` (document staging HTTP/Swagger exception). `enableShutdownHooks()`. Optional `API_GLOBAL_PREFIX`. Swagger at `/docs`. Structured 400s; hide internals on 500. Applied via `ApiBuilder` in `apps/api` `main.ts`.
**Rationale:** Public API hygiene from the first HTTP slice so later consumers do not inherit unversioned routes. See [`api-contracts.md`](./api-contracts.md).

## ADR-030 — `ui-kit` package; UI technology TBD · **Supersedes** ADR-023

**Decision:** Presentation library is `packages/frontend/ui-kit` (`@b2b-saas-starter-kit/ui-kit`, tags `scope:frontend`, `layer:ui`). Component and CSS technology is **not chosen**. The foundation exports a native HTML `Button` so the package is real and importable. **No** Tailwind, Radix, shadcn, design tokens, or `ThemeProvider` until a later ADR.
**Options:** (A) lock shadcn + Radix + Tailwind now (ADR-023); (B) package boundary + native placeholder, tech TBD ✓.
**Rationale:** Keep a shared presentation seam (`web` and `admin` import one package) without committing the kit to a CSS/component stack. Per-tenant white-labeling remains a product goal, not a current implementation. See [`design-system.md`](./design-system.md).

## ADR-031 — i18next engine in `frontend-core`; locale copy in the owning app

**Decision:** Internationalization uses **i18next** + `react-i18next`. The **engine** (`createI18n`) lives in `packages/frontend/core` (`lib/i18n`): instance factory, default locale `en`, namespace list, lazy `loadNamespace` callbacks supplied by the app, and locale persistence through `StoragePort` (not raw `localStorage`). **Locale JSON** lives in the owning app (`apps/web/src/shared/assets/locales/...`; admin will own its own packs). Typed keys are **app-side** `i18next` module augmentation from those JSON files; the engine stays content-free. Namespaces are SaaS-oriented (`common`, `tenancy`, …), not a copy of Backgammon `lobby` / `game` packs.
**Options:** (A) engine + copy in each app; (B) engine in core, copy in the app ✓; (C) a shared `locales` package.
**Rationale:** Same split as the RTK/router kernels: one runtime, many hosts. Apps control wording and lazy packs; hosts inject `StoragePort`. A shared locales package would couple audiences that should diverge (product vs admin).

---

## Deferred decisions

- **Pluggable tenant isolation** (schema/DB-per-tenant) — seam designed, not built.
- **Realtime `gateway` app** — introduce when notifications/live features demand it.
- **Request/tenant ALS log mixin** — done: `RequestContextLocator` on `platform` + Pino mixin + HTTP access logs in `nest-http`.
- **Mapper boilerplate reduction** — standard convention now; possible codegen/Cursor skill later.
- **Extension contexts** (billing, files, webhooks, feature-flags) — follow existing rules when added.
- **Auth token strategy specifics** (storage, refresh rotation) — pattern set; concrete choice at implementation.
- **UI component / CSS stack** (Tailwind, Radix, shadcn, tokens, `ThemeProvider`) — package boundary is `ui-kit`; technology is TBD (ADR-030).
- **CI/CD pipeline** — out of scope for this phase.
