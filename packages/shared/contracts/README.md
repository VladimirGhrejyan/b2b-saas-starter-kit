# `@b2b-saas-starter-kit/contracts`

Shared Zod wire schemas: HTTP methods and status constants, error envelope, pagination envelope. Frontend and backend import the same types. **No Nest. No React.**

**Path:** `packages/shared/contracts`  
**Nx project:** `contracts`  
**Tags:** `scope:shared`, `layer:contracts`

Architecture: [`docs/architecture/api-contracts.md`](../../../docs/architecture/api-contracts.md), [`docs/architecture/shared-packages.md`](../../../docs/architecture/shared-packages.md).

## Purpose

One source of truth for API shapes. Cross-cutting envelopes live in `src/common/` (`http/`, `pagination/`). Endpoint DTOs live in `src/contexts/` (`identity/`, `tenancy/`, `authorization/`, …).

Import only from `@b2b-saas-starter-kit/contracts`. Do not deep-import `src/common/…` or `src/contexts/…`.

## Allowed imports

- `@b2b-saas-starter-kit/shared-kernel-types`
- `zod`

Never import Nest, React, TypeORM, `domain`, `application`, `platform`, or infrastructure.

## Commands

```bash
pnpm nx run contracts:lint
pnpm nx run contracts:typecheck
pnpm nx run contracts:test
```

## Phase 10 Definition of Done

- [x] Package at `packages/shared/contracts` with tags `scope:shared`, `layer:contracts`
- [x] `HttpMethod` (GET/POST/PUT/PATCH/DELETE) and `HttpStatus` including 403 and 409
- [x] Error envelope `{code, message, details?}`
- [x] Pagination envelope factory
- [x] No endpoint DTOs yet
