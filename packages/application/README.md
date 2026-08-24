# `@b2b-saas-starter-kit/application`

Backend application layer — `@Injectable` use cases, published ports, and in-memory test doubles. No HTTP, TypeORM, or `contracts`.

**Path:** `packages/application`  
**Nx project:** `application`  
**Tags:** `scope:backend`, `layer:application`

## Purpose

Orchestrate domain aggregates inside a `UnitOfWork`, enforce fine-grained authorization, and expose command/query types for composition (Phase 9). Bounded contexts are folders. Isolation lint forbids relative sibling-context imports; published port **interfaces** live in `src/shared/`.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md), [`docs/architecture/authorization.md`](../../docs/architecture/authorization.md), [`docs/architecture/bounded-contexts.md`](../../docs/architecture/bounded-contexts.md).

## Allowed imports

- `@b2b-saas-starter-kit/domain`
- `@b2b-saas-starter-kit/platform`
- `@b2b-saas-starter-kit/shared-kernel-types`
- `@nestjs/common` (decorator only)
- `@b2b-saas-starter-kit/utils` (when a generic helper is needed)
- `node:` builtins

Never import `contracts`, `config`, TypeORM, Redis, other `@nestjs/*` packages, or `infrastructure*` / `composition*`.

## Folder layout

```
src/<context>/
  <use-case>.use-case.ts
  <use-case>.types.ts
  <use-case>.spec.ts
  errors/*.error.ts
src/shared/
  *.port.ts
  errors/
src/testing/          # in-memory fakes; not a bounded context
```

Commands use `actorId` (matches `TenantScope`). Writes run inside `UnitOfWork.run`. IDs come from `IdGenerator` and are branded in this layer; timestamps come from `Clock.now()`.

## Use cases

| Use case / port          | Command                               | Auth                                               |
| ------------------------ | ------------------------------------- | -------------------------------------------------- |
| `CreateUserUseCase`      | `{email, displayName}`                | none (onboarding)                                  |
| `CreateTenantUseCase`    | `{name, ownerUserId}`                 | none — seeds Owner/Admin/Member + owner membership |
| `ListTenantMembersQuery` | `{tenantId, actorId}`                 | `tenancy.members.read`                             |
| `GetMyProfileQuery`      | `{actorId, tenantId}`                 | self-read                                          |
| `AuthorizationPort`      | `require` / `getEffectivePermissions` | composes `RoleRepository` + `MembershipRolesPort`  |
| `MembershipRolesPort`    | `roleIdsFor`                          | active membership only                             |

`CreateTenant` is the ≥1 Owner post-condition (seed owner in one transaction). Removal/role-change last-owner checks are deferred.

```typescript
import {CreateTenantUseCase, CreateUserUseCase} from '@b2b-saas-starter-kit/application'

const {userId} = await createUser.execute({email: 'ada@example.com', displayName: 'Ada'})
const tenant = await createTenant.execute({name: 'Acme', ownerUserId: userId})
```

## Must not go here yet

- Invitation / role-assignment / tenant-switch use cases
- Last-owner-on-remove
- Event publication / outbox
- `contracts` DTOs or Nest controllers

## Commands

```bash
pnpm nx run application:typecheck
pnpm nx run application:test
pnpm nx run application:lint
```

## Phase 6 Definition of Done

- [x] Package at `packages/application` with tags `scope:backend`, `layer:application`
- [x] `CreateUser`, `CreateTenant` (roles + owner in one `UnitOfWork`), `ListTenantMembers`, `GetMyProfile`
- [x] `AuthorizationPort` + `MembershipRolesPort` in `src/shared/`; resolver in application
- [x] In-memory fakes at `src/testing/` (exported as `@b2b-saas-starter-kit/application/testing`)
- [x] Application-purity lint (no `contracts` / infrastructure)
- [x] Unit tests with in-memory adapters only
