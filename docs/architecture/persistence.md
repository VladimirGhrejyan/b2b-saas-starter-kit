# Persistence

PostgreSQL + TypeORM, structured so the domain never depends on the ORM. This is the most detail-heavy area of the kit.

Related: [`backend.md`](./backend.md) (layers), [`multi-tenancy.md`](./multi-tenancy.md) (tenant scoping), [`decisions.md`](./decisions.md) (rejected options).

## Where everything lives

| Artifact                             | Location                             | Layer          |
| ------------------------------------ | ------------------------------------ | -------------- |
| Repository **ports** (interfaces)    | `domain/<context>/ports`             | domain         |
| Domain models (aggregates/VOs)       | `domain/<context>`                   | domain         |
| TypeORM **entities** (`*.entity.ts`) | `infrastructure/postgres/<context>`  | infrastructure |
| **Mappers** (entity ↔ domain)       | `infrastructure/postgres/<context>`  | infrastructure |
| Repository **implementations**       | `infrastructure/postgres/<context>`  | infrastructure |
| `DataSource` / TypeORM config        | `infrastructure/postgres`            | infrastructure |
| **Migrations** (single global set)   | `infrastructure/postgres/migrations` | infrastructure |
| Tenant-aware **base repository**     | `infrastructure/postgres`            | infrastructure |
| `UnitOfWork` **port**                | `platform`                           | platform       |
| `UnitOfWork` **implementation**      | `infrastructure/postgres`            | infrastructure |

**Dependency direction:** `infrastructure/postgres` → `domain` (implements its ports) + `application` + `platform`. The domain never sees TypeORM.

## Domain models vs. persistence entities — separate

**Decision:** domain models and TypeORM entities are **separate types**, connected by explicit **mappers**.

- Domain model: a pure class/type expressing behavior and invariants (no decorators).
- Persistence entity: a `@Entity`-decorated TypeORM class describing table shape.
- Repository implementation maps `entity → domain` on read and `domain → entity` on write.

```typescript
// domain/tenancy/tenant.ts  (pure)
export class Tenant {
  private constructor(
    readonly id: TenantId,
    private name: TenantName,
    private status: TenantStatus,
  ) {}
  rename(name: TenantName) {
    /* invariants… */
  }
  // emits domain events, no persistence knowledge
}

// domain/tenancy/ports/tenant.repository.ts  (interface, in domain)
export interface TenantRepository {
  findById(id: TenantId): Promise<Tenant | null>
  save(tenant: Tenant): Promise<void>
}

// infrastructure/postgres/tenancy/tenant.entity.ts  (TypeORM)
@Entity('tenants')
export class TenantEntity {
  @PrimaryColumn('uuid') id!: string
  @Column() name!: string
  @Column() status!: string
  @Column('uuid') tenantId!: string // see multi-tenancy note below
}

// infrastructure/postgres/tenancy/tenant.mapper.ts
export const TenantMapper = {
  toDomain(e: TenantEntity): Tenant {
    /* … */
  },
  toEntity(t: Tenant): TenantEntity {
    /* … */
  },
}

// infrastructure/postgres/tenancy/typeorm-tenant.repository.ts
@Injectable()
export class TypeOrmTenantRepository extends TenantAwareRepository implements TenantRepository {
  async findById(id: TenantId) {
    /* query + TenantMapper.toDomain */
  }
  async save(tenant: Tenant) {
    /* TenantMapper.toEntity + upsert */
  }
}
```

**Why separate (not entities-as-domain-models):** using decorated TypeORM classes as domain objects would put ORM concerns inside the domain, violating the pure-domain rule and coupling the schema to the model. The mapping cost is real but bounded; a standard mapper convention (and later, an optional Cursor skill) keeps it consistent. Rejected alternative recorded in [`decisions.md`](./decisions.md).

## Database ownership

- **Schema ownership:** each context owns the tables for its aggregates. Physically they live in one shared `public` schema, but a table conceptually "belongs to" exactly one context.
- **No cross-context foreign keys.** A context references another only by **ID value** (e.g. `Membership.userId`). FKs exist only _within_ a context. This preserves context autonomy and keeps future extraction possible. Integrity across contexts is maintained by application logic + events.
- **Entities are persistence models**, never exported outside `infrastructure/postgres`.

## Migrations — single global timeline

**Decision:** one ordered migration set in `infrastructure/postgres/migrations`, run against the single database via one `DataSource`.

- Simplest source of truth and ordering for a shared kit.
- Organize files by context (filename prefix or subfolder) for readability; this is the easy upgrade path to per-context migration ownership if ever needed.
- Migrations are code-reviewed like any change; never auto-run destructive changes in production without review.

## Transactions — Unit-of-Work port

**Decision:** transactions are expressed through a `UnitOfWork` (a.k.a. `TransactionManager`) **port** in `platform`, implemented in `infrastructure/postgres` over `DataSource.transaction`.

```typescript
// platform/unit-of-work.port.ts
export interface UnitOfWork {
  run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T>
}

// application/tenancy/create-tenant.use-case.ts
@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tenants: TenantRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(cmd: CreateTenantCommand) {
    return this.uow.run(async () => {
      const tenant = Tenant.create(cmd)
      await this.tenants.save(tenant)
      const owner = Membership.createOwner(tenant.id, cmd.ownerUserId)
      await this.memberships.save(owner)
      // domain events + outbox entries written in the same transaction
    })
  }
}
```

- The application layer stays framework-agnostic (no TypeORM types in signatures).
- Repositories join the ambient transaction via the `TxContext` (provided through the tenant/tx-aware base repository), not by receiving an `EntityManager` in their public port signatures.
- In-memory `UnitOfWork` + in-memory repositories make use cases fully unit-testable.

Rejected alternatives — ambient CLS `@Transactional`, and explicit `EntityManager` threading — are in [`decisions.md`](./decisions.md).

## Tenant-aware base repository

All tenant-owned repositories extend a shared **`TenantAwareRepository`** that automatically constrains reads/writes to the current tenant using the ambient `TenantContext`. This is the primary isolation mechanism; details, the cross-tenant escape hatch, and the optional Postgres RLS backstop are in [`multi-tenancy.md`](./multi-tenancy.md).

## Coupling analysis: does a shared persistence layer create bad coupling?

`infrastructure/postgres` is a single project shared by all contexts. Risk: it could become a place where contexts entangle. Mitigations:

- Entities/mappers/repos are organized **per-context folder** and subject to the same context-isolation lint.
- Contexts reference each other only by ID — no cross-context joins, so there is no _schema-level_ coupling.
- Only **implementations** live here; the **contracts** (ports) live in `domain`, so swapping the persistence technology for one context does not affect others.

The shared project is an acceptable, well-fenced convenience — not shared _domain_ logic. If a context is extracted later, its entities/mappers/repos move with it.
