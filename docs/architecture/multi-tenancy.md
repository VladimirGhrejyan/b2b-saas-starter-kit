# Multi-Tenancy

Multi-tenancy is a first-class, cross-cutting concern. This document defines how tenant identity is established, propagated, and enforced.

Related: [`persistence.md`](./persistence.md), [`authorization.md`](./authorization.md), [`infrastructure.md`](./infrastructure.md).

## The tenancy model

```
User (identity)  ──<  Membership (tenancy)  >──  Tenant (tenancy)
                             │
                             └── Role(s) (authorization, tenant-scoped)
                                     └── Permission(s)
```

- A **User** is global (one identity across the system).
- A **Tenant** is an organization/workspace.
- A **Membership** links a User to a Tenant and carries that user's tenant-scoped roles.
- A user may belong to multiple tenants; the **active tenant** is part of the request context.

## Isolation model: pool (shared schema + `tenant_id`)

**Decision:** the pool model — one database, one shared schema, every tenant-owned table carries a `tenant_id` column; isolation is by filtering.

- Cheapest and simplest to operate; easiest cross-tenant administration/analytics; standard for most B2B SaaS.
- Non-tenant-owned tables (e.g. the global `users` table in `identity`) do **not** carry `tenant_id`.
- The design is kept clean enough that a **pluggable strategy** (schema-per-tenant / database-per-tenant) could be added later behind the same repository seam, but pool is the default and only shipped strategy.

## Establishing tenant context

At the edge (`apps/api`), a NestJS middleware/guard resolves the **active tenant** from the authenticated principal:

- Primary source: a **tenant claim** in the access token (issued after the user selects/switches tenant).
- Alternative resolvers (subdomain, header) are supported as pluggable strategies but the token claim is authoritative.

The resolver validates that the user has a **membership** in that tenant before establishing context. Failure ⇒ request rejected.

## Propagating tenant context — hybrid

**Decision:** a hybrid of explicit and ambient propagation.

1. **Explicit at the application boundary.** Use-case command inputs carry `tenantId` (and `actor`/`userId`). This keeps use cases self-describing and trivially unit-testable — you cannot invoke one without stating the tenant.
2. **Ambient guardrail in infrastructure.** A request-scoped **`TenantContext`** (Node [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html)) is set by the edge via `tenantContext.run({tenantId, actorId}, …)`. The persistence layer reads it as an automatic enforcement net. Do **not** use `nestjs-cls` — it is the same ALS with a Nest wrapper, and it does not make context valid across instances.

Tenant identity travels **on the message** (headers today, access-token claim / job payload later). Each Node process reconstructs ALS for that async chain only. A Postgres transaction is one connection on one process; never share `EntityManager` or ALS stores across instances. Redis is the wrong place for `TenantContext` (request-scoped, not durable).

The two must agree: the infrastructure asserts that the tenant implied by a command matches the ambient `TenantContext`, catching mistakes where code forgets to scope a query.

```
edge middleware sets TenantContext(tenantId) ──┐
controller maps DTO → command { tenantId, … }  │  both carry the tenant
   → use case (explicit tenantId)              │
       → repository (TenantAwareRepository reads ambient TenantContext) ◀┘
```

### Workers and jobs

`apps/worker` has no HTTP request, so it **re-establishes `TenantContext` from the job payload** before executing. Every enqueued job carries its `tenantId`; the outbox preserves it. This keeps background work under the same isolation guarantees.

## Enforcing isolation in persistence

**Decision:** a tenant-aware **base repository** is the default enforcement mechanism.

- `TenantAwareRepository` automatically adds `WHERE tenant_id = :ctx` to reads and stamps `tenant_id` on writes, using the ambient `TenantContext`.
- Individual repositories cannot "forget" to scope — they inherit the behavior.
- A narrow, explicit **escape hatch** (`withoutTenantScope()` / a dedicated admin repository path) exists for legitimately cross-tenant operations (system admin, analytics, the tenant-resolution lookups themselves). Use of the escape hatch is intentionally verbose and reviewable.

### Optional hardening: Postgres Row-Level Security (RLS)

Documented as an **opt-in "secure profile"**, not the default:

- Set a session variable (`SET app.tenant_id = …`) per request/transaction.
- Define RLS policies on tenant-owned tables so the **database** enforces isolation regardless of application bugs.
- Combined with the base-repository filter, this is defense-in-depth. It costs more setup (session var per connection/tx, local-dev friction), so it is a toggle, not a requirement.

## Interaction with transactions

The `UnitOfWork` (see [`persistence.md`](./persistence.md)) and `TenantContext` compose: work inside `uow.run(...)` executes under the same tenant scope, and (in the RLS profile) the tenant session variable is set for the transaction's connection. Repositories participating in the transaction remain tenant-scoped.

## Interaction with Redis

All cache/lock/pub-sub keys are **tenant-prefixed** (`t:<tenantId>:...`) via a shared key-builder. This prevents cross-tenant leakage of cached authorization data, rate limits, locks, etc. Cache invalidation on tenant/role changes is a per-context application responsibility.

## Should `tenantId` be explicit in domain APIs?

- **Application** APIs: **yes** — `tenantId` is explicit in commands/queries.
- **Domain** APIs: aggregates that belong to a tenant hold their `tenantId` as part of identity/state, but domain _methods_ express business behavior, not tenant plumbing. The domain does not perform tenant filtering — that is an infrastructure responsibility. This keeps the domain focused on invariants while the tenant guarantee is enforced structurally below it.

## Summary of guarantees

| Concern            | Mechanism                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Who is the tenant? | Token claim → validated membership → `TenantContext`                        |
| Reaches the DB?    | `TenantAwareRepository` auto-filter + explicit command `tenantId` assertion |
| Hard backstop?     | Optional Postgres RLS (secure profile)                                      |
| Background jobs?   | `tenantId` in job payload → context re-established in worker                |
| Cache/locks?       | Tenant-prefixed Redis keys                                                  |
| Cross-tenant ops?  | Explicit, reviewable escape hatch only                                      |
