# Shared Packages

The rules that keep shared code useful and prevent the classic "shared = dumping ground" failure.

Related: [`workspace-topology.md`](./workspace-topology.md), [`api-contracts.md`](./api-contracts.md), [`boundaries.md`](./boundaries.md).

## The shared libraries (`scope:shared`)

Only these cross the frontend/backend boundary. Each is pure and framework-free.

| Package                                                | Purpose                                                                                    | Depends on                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------- |
| `shared-kernel-types` (`packages/shared/kernel-types`) | Branded IDs (`UserId`, `TenantId`, …), cross-cutting enums, primitive scalar/value types   | — (leaf)                      |
| `contracts` (`packages/shared/contracts`)              | Zod API request/response schemas, inferred types, `HttpStatus`, error/pagination envelopes | `shared-kernel-types` (+ Zod) |
| `utils` (`packages/shared/utils`)                      | Generic pure helpers: `ObjectUtils`, `ArrayUtils`, `DateUtils`, `StringUtils`, …           | — (leaf; no Zod)              |
| `config` (`packages/shared/config`)                    | `ConfigLoader` — pluggable sources (YAML today) + Zod validation                           | `utils` (+ Zod, js-yaml)      |

There is intentionally **no `constants` package** — cross-cutting enums live in `shared-kernel-types`; anything else that looks like a "constant" belongs to a context, not to shared.

## The `shared-kernel-types` leaf — solving the ID/enum problem

Both `contracts` (frontend + backend) and `domain` (backend) need branded IDs and cross-cutting enums. We must avoid two bad outcomes:

- `domain` importing `contracts` (domain must not depend on wire contracts), and
- duplicating IDs/enums on each side.

**Solution:** a tiny leaf package, `shared-kernel-types`, that both `contracts` and `domain` depend on. It contains only pure, universally-safe types:

- Branded ID types + their Zod schemas (`UserId`, `TenantId`, `MembershipId`, `RoleId`, …).
- Cross-cutting enums that appear in both wire and domain (e.g. `MembershipStatus`).
- Primitive value-type helpers (branding utilities).

It has **zero dependencies** (aside from Zod for the schemas) and **no framework code**, so it is safe for every layer. Backend domain **base classes** (`AggregateRoot`, `DomainEvent`, `Result`) do **not** live here — they are backend-only and stay in `domain/shared-kernel`.

## What MAY go into shared packages

- Pure, deterministic functions with no I/O (`utils`).
- API contract schemas + inferred types, including `HttpStatus`, the shared error envelope, and pagination (`contracts`).
- Branded IDs, cross-cutting enums, primitives (`shared-kernel-types`).
- Config loading via `ConfigLoader` (`config`); apps own schemas and value files.

## What MUST NEVER go into shared packages

- **Domain/business logic** — belongs to a context in `domain`/`application`.
- **Infrastructure** — no TypeORM, Redis, HTTP adapters in shared leaves (exception: `config` may read files / sources only inside an explicit `ConfigLoader.load` call).
- **Framework code** — no NestJS, no React/DOM.
- **Context-specific types** that aren't part of an API contract.
- **Stateful singletons** or anything with side effects at import time (including eager config load).
- **Backend-only domain primitives** (`AggregateRoot`, etc.) — those stay in `domain/shared-kernel`.

## Backend-only vs. frontend-only vs. domain-only

| Kind                     | Where                | Never shared because                |
| ------------------------ | -------------------- | ----------------------------------- |
| Backend infra            | `infrastructure/*`   | technology-specific, server-only    |
| Nest HTTP kit            | `packages/nest-http` | NestJS delivery helpers             |
| Backend domain           | `domain/*`           | business rules + backend primitives |
| Backend capability ports | `platform`           | server capabilities                 |
| Frontend UI              | `frontend/ui`        | React/DOM                           |
| Frontend state/data      | `frontend/core`      | RTK/browser concerns                |

Sharing anything from these across the FE/BE line is a boundary violation (see [`boundaries.md`](./boundaries.md)).

## Governance

- Adding to a shared package requires that the item is _genuinely_ shared and _pure_. If in doubt, keep it context-local and duplicate the tiny surface rather than sharing impure/eager code.
- `utils` is split by concern internally (`ObjectUtils`, `ArrayUtils`, …) rather than a flat grab-bag, to keep tree-shaking and discovery clean.
- Extend `utils` **in-package** (correct class + tests + public export); do not fork generic helpers into local `utils.ts` / `helpers.ts` files. Prefer importing from `@b2b-saas-starter-kit/utils`.
- The Nx dependency constraints (scope tags) mechanically prevent shared packages from importing backend/frontend-scoped code, so a shared package physically cannot pull in framework or infra code.

### `utils` leaf policy

- Zero runtime dependencies initially (no Zod, no date library).
- `DateUtils` is **UTC/ISO-only**; display formatting / IANA timezones can justify `date-fns` later.
- Zod schemas belong in `contracts`, `shared-kernel-types`, or **app-owned** config schemas — not in `utils`. Use `@b2b-saas-starter-kit/config` only for loading/validation.

### `config` leaf policy

- Public entry: `ConfigLoader.load(schema, options)` with `options` discriminated by `source` (`yaml` today).
- Apps own Zod schemas and `config/*.yml` values; do not commit secrets.
- No Nest/React inside this package. No load-at-import-time singleton.
- Future sources (env, secrets manager) extend the `LoadConfigOptions` union without changing existing call sites.
