---
description: Index of Cursor rules aligned with docs/architecture
alwaysApply: false
---

# Cursor Rules Summary

Aligned with `docs/architecture/` (layer-first Nx topology, SaaS bounded contexts).  
**Do not follow older game/poker single-app patterns** (`@/domains`, `@/core`, `@/secondary`, OpenAPI codegen for FE).

## Rules

### General

| File                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `general/typescript.mdc`      | Strict TS, `import type`, no `any`                            |
| `general/path-aliases.mdc`    | Package imports for layer-first monorepo                      |
| `general/shared-packages.mdc` | Allow/forbid for contracts / kernel types / utils / config    |
| `general/utils.mdc`           | Always use `@b2b-saas-starter-kit/utils`; extend in-package   |
| `general/config.mdc`          | Always use `ConfigLoader` from `@b2b-saas-starter-kit/config` |

### Backend

| File                         | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `backend/architecture.mdc`   | Layers, composition, Nest outer ring |
| `backend/domain-layer.mdc`   | Pure domain + repository ports       |
| `backend/event-driven.mdc`   | Aggregates emit events               |
| `backend/persistence.mdc`    | Entities, mappers, UnitOfWork        |
| `backend/outbox-pattern.mdc` | Transactional outbox + worker        |
| `backend/multi-tenancy.mdc`  | Pool model, hybrid tenant context    |
| `backend/authorization.mdc`  | RBAC + policies, dual enforcement    |

### Frontend

| File                            | Purpose                          |
| ------------------------------- | -------------------------------- |
| `frontend/fsd-architecture.mdc` | web/admin + FSD hybrid           |
| `frontend/state-management.mdc` | RTK Query + contracts + `can()`  |
| `frontend/design-system.mdc`    | Tokens + runtime tenant branding |

### API / Testing / Tooling / Nx

| File                  | Purpose                 |
| --------------------- | ----------------------- |
| `api/validation.mdc`  | Shared Zod contracts    |
| `testing/testing.mdc` | Vitest, domain coverage |
| `tooling/imports.mdc` | Import group order      |
| `nx/boundaries.mdc`   | scope×layer tags        |

## Example Domain Vocabulary

Prefer these in examples and new code: `User`, `Tenant`, `Membership`, `Role`, `Permission`, `AuditEvent`, `Notification` — contexts `identity`, `tenancy`, `authorization`, `audit`, `notifications`.

## Architecture Docs

Start at `docs/architecture/overview.md`. Decision log: `docs/architecture/decisions.md`.
