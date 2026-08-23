# `@b2b-saas-starter-kit/domain`

Backend-only domain layer. Phase 2 ships `shared-kernel` primitives only. Bounded-context aggregates arrive in later phases.

**Path:** `packages/domain`  
**Nx project:** `domain`  
**Tags:** `scope:backend`, `layer:domain`

## Purpose

Give every aggregate the same identity, event, error, and result building blocks — without Nest, TypeORM, or HTTP.

Architecture: [`docs/architecture/backend.md`](../../docs/architecture/backend.md).

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- Zod (when a context needs it; not used in this phase)
- `node:` builtins

Never import Nest, TypeORM, Redis, `contracts`, `application`, `platform`, `utils`, `config`, or infrastructure.

## Usage (later aggregates)

```typescript
import {AggregateRoot, DomainError, Guard} from '@b2b-saas-starter-kit/domain'
import type {DomainEvent} from '@b2b-saas-starter-kit/domain'
import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

class InvalidTenantNameError extends DomainError {
  constructor() {
    super('TENANT_INVALID_NAME', 'name must not be blank')
  }
}

export class Tenant extends AggregateRoot<TenantId> {
  rename(name: string, occurredAt: Date): DomainEvent[] {
    Guard.againstEmpty(name, new InvalidTenantNameError())
    this.record({type: 'TenantRenamed', occurredAt, tenantId: this.id, name})

    return this.pullEvents()
  }
}
```

Use cases persist the aggregate, then `pullEvents()` and dispatch. The aggregate never talks to a bus.

`Result.ok` / `Result.fail` is for composable success/failure. Invariants still **throw** `DomainError`.

## API

| Export               | Role                                       |
| -------------------- | ------------------------------------------ |
| `Entity<TId>`        | Identity + `equals`                        |
| `AggregateRoot<TId>` | `record` / `pullEvents`                    |
| `DomainEvent`        | `{type, occurredAt}` plus payload          |
| `DomainError`        | Typed invariant failure (`code` + message) |
| `Guard`              | `againstEmpty` / `againstNil`              |
| `Result`             | `ok` / `fail` / `isOk` / `isFail`          |

## Must not go here yet

- Context folders (`identity`, `tenancy`, `authorization`) and repository ports
- Nest, TypeORM, Redis, contracts, platform ports
- Permission catalog values

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
