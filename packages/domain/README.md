# `@b2b-saas-starter-kit/domain`

Backend-only domain layer. Phase 2 shipped `shared-kernel` primitives. Phase 4 adds the `authorization` context (permission catalog, system roles, `Role`).

**Path:** `packages/domain`  
**Nx project:** `domain`  
**Tags:** `scope:backend`, `layer:domain`

## Purpose

Give every aggregate the same identity, event, error, and result building blocks — without Nest, TypeORM, or HTTP — and own the authorization model as a folder inside this package.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), [`docs/architecture/authorization.md`](../../docs/architecture/authorization.md).

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- Zod (when a context needs it; catalog uses `Permission.parse`)
- `node:` builtins

Never import Nest, TypeORM, Redis, `contracts`, `application`, `platform`, `utils`, `config`, or infrastructure.

Authorization must not import `tenancy` or `identity` internals. Cross-context references use branded IDs only.

## Authorization

`Role` is tenant-scoped. System roles (`Owner` / `Admin` / `Member`) are **definitions** here; `CreateTenant` seeds one row of each per tenant later.

```typescript
import {PermissionCatalog, Role, SystemRoles} from '@b2b-saas-starter-kit/domain'
import {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

const owner = Role.createSystemRole(id, tenantId, 'Owner', occurredAt)
const custom = Role.create(id, tenantId, 'Reviewer', [PermissionCatalog.tenancyTenantRead], occurredAt)

owner.hasPermission(PermissionCatalog.tenancyMembersRead) // true
SystemRoles.permissionsFor('Member') // [tenancy.tenant.read]
```

Checks are always against **permissions**, never role names. `AuthorizationPort` (application) unions permissions across a membership's roles.

## API

| Export                  | Role                                             |
| ----------------------- | ------------------------------------------------ |
| `Entity<TId>`           | Identity + `equals`                              |
| `AggregateRoot<TId>`    | `record` / `pullEvents`                          |
| `DomainEvent`           | `{type, occurredAt}` plus payload                |
| `DomainError`           | Typed invariant failure (`code` + message)       |
| `Guard`                 | `againstEmpty` / `againstNil`                    |
| `Result`                | `ok` / `fail` / `isOk` / `isFail`                |
| `PermissionCatalog`     | Fixed `context.resource.action` constants        |
| `SystemRoles`           | Owner / Admin / Member permission bundles        |
| `Role`                  | Tenant-scoped permission bundle                  |
| `RoleRepository`        | Port: `findById` / `findByTenant` / `save(Many)` |
| `RoleReconstituteProps` | Adapter input for `Role.reconstitute`            |

## Must not go here yet

- `identity` / `tenancy` aggregates and their repository ports
- Custom-role CRUD use cases, invitations, ABAC policy seam
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
