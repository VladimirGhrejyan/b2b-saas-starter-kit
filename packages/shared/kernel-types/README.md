# `@b2b-saas-starter-kit/shared-kernel-types`

Shared leaf types for branded IDs, cross-cutting enums, and the Permission identifier. Usable from backend and frontend.

**Path:** `packages/shared/kernel-types`  
**Nx project:** `shared-kernel-types`  
**Tags:** `scope:shared`, `layer:shared-types`

## Purpose

Solve the ID/enum problem without coupling `domain` to `contracts` or duplicating brands on each side. Both packages depend on this leaf.

Architecture rules: [`docs/architecture/shared-packages.md`](../../../docs/architecture/shared-packages.md).

## Usage

```typescript
import {UserId, TenantId, MembershipStatus, Permission} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {UserId as UserIdType} from '@b2b-saas-starter-kit/shared-kernel-types'

const userId = UserId.parse(raw)
const membership = z.object({
  userId: UserId.schema,
  tenantId: TenantId.schema,
  status: MembershipStatus.schema,
})
```

Import only from `@b2b-saas-starter-kit/shared-kernel-types`. Do not deep-import `src/lib/...`.

## API

### Branding helpers

| Class        | Role                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `BrandedId`  | `create(name, schema)` → `{name, schema, parse}` for branded scalars |
| `StringEnum` | `create(values)` → `{values, schema, parse}` for wire/domain enums   |

### Branded IDs

`UserId`, `TenantId`, `MembershipId`, `RoleId` — UUID brands. Use `.schema` in Zod objects and `.parse` at boundaries.

### Status enums

| Enum               | Values                           |
| ------------------ | -------------------------------- |
| `UserStatus`       | `active`, `suspended`            |
| `TenantStatus`     | `active`, `suspended`            |
| `MembershipStatus` | `invited`, `active`, `suspended` |

### Permission

Namespaced string brand (`context.resource.action`, at least two dotted segments). Catalog **values** live in the authorization domain (Phase 4), not here.

## Must not go here

- Domain classes (`AggregateRoot`, `DomainEvent`, `Result`) — `domain/shared-kernel`
- Permission catalog constants / system roles — authorization context
- Nest, React, TypeORM, Redis, or any I/O
- Context-internal types that are not shared by domain and contracts

## Commands

```bash
pnpm nx run shared-kernel-types:typecheck
pnpm nx run shared-kernel-types:test
pnpm nx run shared-kernel-types:lint
```

## Phase 1 Definition of Done

- [x] Package generated at `packages/shared/kernel-types` with tags `scope:shared`, `layer:shared-types`
- [x] Branded IDs (`UserId`, `TenantId`, `MembershipId`, `RoleId`) + Zod schemas
- [x] Cross-cutting enums (`UserStatus`, `TenantStatus`, `MembershipStatus`)
- [x] `Permission` identifier brand (no catalog values)
- [x] Types exported from the package entry
- [x] Vitest: schema parse/reject + brand round-trip
- [x] Leaf: Zod only (no `utils`, no backend/frontend packages)
