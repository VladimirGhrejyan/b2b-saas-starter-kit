# API & Contracts

How request/response shapes are defined, validated, and shared between backend and frontend.

Related: [`shared-packages.md`](./shared-packages.md), [`backend.md`](./backend.md), [`frontend.md`](./frontend.md).

## Decision: a shared `contracts` package (Zod)

**This revises an earlier decision.** In the prior (Cursor-rules) phase — derived from the investigated _multi-repo_ projects — the choice was _independent_ frontend/backend types connected via OpenAPI codegen, with **no** shared contract package. In a **monorepo**, that trade-off inverts: a shared contracts package is the single biggest consistency/DX win and removes codegen drift.

**`packages/shared/contracts`** holds the Zod schemas for API requests and responses, plus their inferred TypeScript types. Both sides consume it through `@b2b-saas-starter-kit/contracts`:

- **Backend** wraps schemas with `nestjs-zod` (`createZodDto`) for validation + Swagger.
- **Frontend** imports the same schemas for RTK Query request/response types and (where useful) client-side validation.

Result: **one source of truth**, zero drift, no codegen step.

```typescript
// packages/shared/contracts/src/tenancy/invite-member.ts
import {z} from 'zod'
import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const InviteMemberInput = z.object({
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()),
})
export type InviteMemberInput = z.infer<typeof InviteMemberInput>

export const MembershipOutput = z.object({
  id: z.string().uuid(),
  userId: UserId.schema,
  tenantId: TenantId.schema,
  status: z.enum(['invited', 'active', 'suspended']),
})
export type MembershipOutput = z.infer<typeof MembershipOutput>
```

## What `contracts` contains (and what it does not)

**Contains:**

- Request DTOs (body/query/params), response DTOs.
- **Shared error envelope** (`code`, `message`, optional `details`) and **`HttpStatus`** constants used on the wire (including 403 and 409). HTTP status is a transport concern — it lives here, not in Nest and not in domain.
- Pagination envelopes (`items`, `page`, `pageSize`, `total`).
- Enums/literals that are part of the wire contract (including the permission string union).
- Inferred types from the above.

**Does not contain:**

- Domain logic, entities, or aggregates.
- Backend or frontend framework code (no Nest, no React).
- Context-internal types that are not part of any API.

`contracts` depends only on `shared-kernel-types` (for branded IDs/enums) + Zod. See the allow/forbid rules in [`shared-packages.md`](./shared-packages.md).

## DTOs vs. application commands — the mapping seam

`contracts` DTOs are a **transport** concern. The **application** layer must not depend on `contracts` (see [`workspace-topology.md`](./workspace-topology.md)). Therefore:

```
HTTP body ──(nestjs-zod validates against contracts schema)──▶ DTO
   ──(controller maps in apps/api)──▶ application Command (plain typed object)
      ──▶ use case ──▶ domain
   ◀──(controller maps result)── application Result
   ◀──(serialized against contracts response schema)── HTTP response
```

- The **controller** in `apps/api` owns DTO↔command/result mapping.
- Use cases speak in commands/results defined in the application layer, keeping them decoupled from the wire format and independently testable.

This preserves the dependency rule: `application` never imports `contracts`; only `apps/api`, `nest-http` (error envelope / `HttpStatus`), and the frontend do.

## File naming

Retained from the established convention:

- `*.input.ts` — request DTOs (body/query)
- `*.output.ts` — response DTOs
- `*.param.ts` — path parameters

Organized by context inside `packages/shared/contracts/src` (`tenancy/…`, `authorization/…`).

## Validation

- **Backend:** the `nest-http` global pipe (nestjs-zod) validates every controller input against the contract schema; invalid input ⇒ `400` with the shared error envelope from `contracts`.
- **Frontend:** forms may validate against the same schemas before submitting (optional but encouraged), guaranteeing the client and server agree.

## OpenAPI / external consumers

- Swagger/OpenAPI is generated on the backend from the `nestjs-zod` DTOs via `nest-http` (`ApiBuilder.setupSwagger`). This documents the API and serves **external** (non-monorepo) consumers.
- **Internal** frontend apps do **not** consume generated types — they import `contracts` directly (no codegen drift). OpenAPI is a byproduct for outsiders, not the internal type channel.

## Versioning & coupling

HTTP routes use **URI versioning** (`VersioningType.URI`, default `'1'`) so foundation endpoints are `/v1/users`, `/v1/tenants`, `/v1/me`, `/v1/tenants/:tenantId/members`. An optional global prefix (`API_GLOBAL_PREFIX`) may sit in front. Breaking a contract marks all dependents affected in Nx. Keep old contract schemas until external consumers migrate (`/v2`).
