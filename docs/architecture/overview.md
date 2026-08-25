# Architecture Overview

This directory is the **source of truth** for the architecture of the B2B multi-tenant SaaS starter kit. It documents _decisions and their rationale_ — not implementation. No applications, packages, entities, or framework wiring exist yet; these documents describe how they will be built.

> Status: **Design finalized, implementation pending.** Cursor rules will be rewritten to match these documents in a later phase.

## Reading order

1. `overview.md` — this file: goals, principles, how the patterns combine.
2. [`workspace-topology.md`](./workspace-topology.md) — the physical Nx project layout and dependency graph.
3. [`bounded-contexts.md`](./bounded-contexts.md) — the logical domains and how they communicate.
4. [`backend.md`](./backend.md) — backend layers and NestJS's role.
5. [`persistence.md`](./persistence.md) — TypeORM, models vs entities, transactions, migrations.
6. [`infrastructure.md`](./infrastructure.md) — Redis, messaging, background jobs, config, logging.
7. [`multi-tenancy.md`](./multi-tenancy.md) — tenant isolation and context flow.
8. [`authorization.md`](./authorization.md) — authentication, RBAC, policies.
9. [`api-contracts.md`](./api-contracts.md) — Zod contracts shared between backend and frontend.
10. [`frontend.md`](./frontend.md) — React/Vite apps, state, permission-aware UI.
11. [`design-system.md`](./design-system.md) — the themeable `ui` library and tenant branding.
12. [`shared-packages.md`](./shared-packages.md) — what may and may not be shared.
13. [`boundaries.md`](./boundaries.md) — Nx tags, dependency constraints, enforcement.
14. [`decisions.md`](./decisions.md) — the decision log (ADRs) with rationale.

## Architectural goal

A reusable foundation for future B2B SaaS products. It should provide, as generic and replaceable building blocks:

- Authentication & identity (users, credentials, sessions)
- Tenancy (tenants/organizations, memberships)
- Authorization (roles, permissions, policies)
- Audit logging
- Notifications
- Background jobs, caching, messaging
- Typed API contracts
- A frontend application shell + a themeable design system

These are **not implemented** here. This documentation defines _how they are to be architected_ so that each can be built, replaced, or extended without eroding the boundaries.

## Chosen technologies (explicitly selected, not merely observed)

| Area                    | Chosen                           | Notes                                                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| Backend framework       | **NestJS**                       | Delivery + DI/composition only (see [`backend.md`](./backend.md))        |
| Language                | **TypeScript (strict)**          | Locked in `tsconfig.base.json`                                           |
| Database                | **PostgreSQL**                   | Single instance, pool multi-tenancy                                      |
| ORM                     | **TypeORM**                      | Persistence layer only; never in domain                                  |
| Cache / locks / pub-sub | **Redis**                        | Behind capability ports (see [`infrastructure.md`](./infrastructure.md)) |
| Jobs                    | **BullMQ + outbox**              | Reliable async work                                                      |
| Validation / contracts  | **Zod + nestjs-zod**             | Single source of truth for API shapes                                    |
| Logging                 | **Pino**                         | `Logger` port + process locator; adapter in `infrastructure/logger`      |
| HTTP kit                | **`packages/nest-http`**         | ApiBuilder, pipe/filter/interceptor, Swagger, CORS, URI `/v1`            |
| Frontend                | **React + Vite**                 | Two apps: `web`, `admin`                                                 |
| Frontend state          | **Redux Toolkit + RTK Query**    | Server state via RTK Query                                               |
| Styling / UI            | **Tailwind + shadcn/ui + Radix** | Themeable, per-tenant branding                                           |
| Testing                 | **Vitest**                       | All projects                                                             |
| Monorepo                | **Nx + pnpm**                    | Boundaries enforced via tags                                             |

Technologies observed in the investigated repositories but **not adopted by default** (e.g. WebSocket gateways as a separate app, project-specific game/poker infrastructure) are treated as optional extensions, not part of the core kit.

## The architectural principles and how they combine

This kit deliberately blends several patterns. They are complementary, not competing:

- **Domain-Driven Design (DDD)** gives us the _logical_ decomposition: **bounded contexts** (identity, tenancy, authorization, audit, notifications), aggregates, domain events, and a shared kernel. See [`bounded-contexts.md`](./bounded-contexts.md).
- **Hexagonal Architecture (ports & adapters)** gives us the _dependency rule_: the domain defines ports (interfaces); infrastructure provides adapters (implementations); dependencies always point **inward** toward the domain. See [`backend.md`](./backend.md).
- **Clean Architecture** contributes the **explicit application/use-case layer** that orchestrates domain operations and owns transaction boundaries, framework-free except for a tolerated DI seam.
- **Nx** provides _physical_ enforcement: projects, tags, and dependency constraints make the dependency rule a build-time guarantee, not a convention. See [`boundaries.md`](./boundaries.md).
- **NestJS** is confined to the outer ring — delivery (controllers), dependency injection, and module composition. It must not leak into the domain. See [`backend.md`](./backend.md).

The synthesis in one sentence:

> **Bounded contexts** (DDD) organize the code; the **dependency rule** (Hexagonal/Clean) governs how layers relate; **Nx tags + lint** enforce both physically; **NestJS** only composes and delivers.

## The single most important structural decision

**Logical layers do not each become an Nx project, and bounded contexts are not each an Nx project.** Instead:

- The workspace is **layer-first**: `domain`, `application`, `platform`, `infrastructure`, `nest-http`, `composition` are the Nx projects.
- Each **bounded context is a folder** inside those layer projects (`domain/src/identity`, `application/src/identity`, …).

Consequences (fully explored in [`workspace-topology.md`](./workspace-topology.md) and [`boundaries.md`](./boundaries.md)):

- Nx **hard-enforces the layer dependency rule** (`domain ← application ← infrastructure ← composition / nest-http ← apps`).
- Nx **cannot** enforce context isolation at the project level (contexts share a project per layer), so **context isolation is enforced by a folder-level import lint** instead.
- `affected` granularity is per-layer, not per-context — an accepted trade-off.

This choice was made deliberately, weighed against context-first alternatives (one project per context, or per context×layer). The rationale and the rejected options are recorded in [`decisions.md`](./decisions.md).

## Deployment posture

A **modular monolith**: one logical backend composed of many contexts, deployed as a small number of thin apps (`api`, `worker`). The context boundaries + dependency rules are designed so that a context _could_ later be extracted into its own service, but we explicitly avoid premature microservices. See [`bounded-contexts.md`](./bounded-contexts.md).
