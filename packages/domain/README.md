# `@b2b-saas-starter-kit/domain`

Backend-only domain layer. Shared-kernel primitives plus three context folders: `authorization`, `identity`, `tenancy`.

**Path:** `packages/domain`  
**Nx project:** `domain`  
**Tags:** `scope:backend`, `layer:domain`

## Purpose

Pure business models and repository ports — no Nest, TypeORM, or HTTP. Bounded contexts are folders. They reference each other by branded IDs only.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), [`docs/architecture/authorization.md`](../../docs/architecture/authorization.md), [`docs/architecture/bounded-contexts.md`](../../docs/architecture/bounded-contexts.md).

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- Zod (when a context needs it; catalog uses `Permission.parse`)
- `node:` builtins

Never import Nest, TypeORM, Redis, `contracts`, `application`, `platform`, `utils`, `config`, or infrastructure.

Do not relatively import another context's internals. `Membership` stores `UserId` + `RoleId[]`, not `User` or `Role`.

## Folder layout

Each bounded context uses **kind folders**. Aggregates stay at the context root; only errors and ports get their own directories:

```
src/<context>/
  <aggregate>.ts
  <aggregate>.types.ts
  <aggregate>.spec.ts
  errors/*.error.ts
  ports/*.repository.ts
```

`shared-kernel/` is unchanged. Do not add empty `events/`, `value-objects/`, or `aggregates/` folders.

Graduate **one context** to a full DDD catalog (`aggregates/`, `entities/`, `value-objects/`, `events/`, `errors/`, `ports/`, `services/`) only when complexity actually appears — a third aggregate, extracted value objects, typed event classes, or a domain service. Other contexts stay on kind folders until they hit the same bar. Isolation lint still keys off `src/<context>/`.

## Contexts

**Authorization** — tenant-scoped `Role` bundles from `PermissionCatalog`. System roles (`Owner` / `Admin` / `Member`) are definitions; `CreateTenant` seeds rows later.

**Identity** — global `User` (`email`, `displayName`, `status`). No credentials, no `tenantId`.

**Tenancy** — `Tenant` and a separate `Membership` aggregate (`userId`, `tenantId`, `roleIds`). The ≥1 Owner rule is **not** an aggregate invariant (application / `UnitOfWork`).

```typescript
import {Membership, Role, Tenant, User} from '@b2b-saas-starter-kit/domain'

const user = User.create(userId, 'ada@example.com', 'Ada', occurredAt)
const tenant = Tenant.create(tenantId, 'Acme', occurredAt)
const ownerRole = Role.createSystemRole(roleId, tenantId, 'Owner', occurredAt)
const owner = Membership.createOwner(membershipId, tenantId, userId, ownerRole.id, occurredAt)
```

## API

| Export                                | Role                                       |
| ------------------------------------- | ------------------------------------------ |
| `Entity<TId>`                         | Identity + `equals`                        |
| `AggregateRoot<TId>`                  | `record` / `pullEvents`                    |
| `DomainEvent`                         | `{type, occurredAt}` plus payload          |
| `DomainError`                         | Typed invariant failure (`code` + message) |
| `Guard`                               | `againstEmpty` / `againstNil`              |
| `Result`                              | `ok` / `fail` / `isOk` / `isFail`          |
| `PermissionCatalog`                   | Fixed `context.resource.action` constants  |
| `SystemRoles`                         | Owner / Admin / Member permission bundles  |
| `Role` / `RoleRepository`             | Tenant-scoped permission bundle + port     |
| `User` / `UserRepository`             | Global identity + port                     |
| `Tenant` / `TenantRepository`         | Organization + port                        |
| `Membership` / `MembershipRepository` | User↔tenant link + port                   |

## Must not go here yet

- ≥1 Owner (application, Phase 6)
- Credentials / sessions / invitations / custom-role CRUD
- `AuthorizationPort` (application, Phase 6)
- Nest, TypeORM, Redis, contracts, platform ports

## Commands

```bash
pnpm nx run domain:typecheck
pnpm nx run domain:test
pnpm nx run domain:lint
```

## Phase 2 Definition of Done

- [x] Package at `packages/domain` with tags `scope:backend`, `layer:domain`
- [x] `Entity`, `AggregateRoot`, `DomainEvent`, `Result`, `Guard`, `DomainError`
- [x] Depends only on `@b2b-saas-starter-kit/shared-kernel-types`
- [x] Domain-purity `no-restricted-imports` enabled
- [x] Unit tests for Result, event collection, Entity, Guard, DomainError

## Phase 4 Definition of Done

- [x] `src/authorization` catalog, system-role definitions, `Role`, `RoleRepository`
- [x] Owner = all; Admin = subset; Member lacks `tenancy.members.read`
- [x] `Role.create` / `createSystemRole` / `reconstitute`; invariants throw `DomainError` subclasses
- [x] Context-isolation lint: authorization does not import tenancy/identity

## Phase 5 Definition of Done

- [x] `src/identity` `User` + `UserRepository`; `src/tenancy` `Tenant`, `Membership` + ports
- [x] `User.create`, `Tenant.create`, `Membership.createOwner` / `create`; status transitions
- [x] Cross-context references are branded IDs only; ≥1 Owner is not a domain invariant
