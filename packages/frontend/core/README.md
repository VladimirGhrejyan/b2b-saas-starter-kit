# `@b2b-saas-starter-kit/frontend-core`

RTK / session / ports kernel shared by `web` and `admin`. No app screens, i18n, or JWT.

**Path:** `packages/frontend/core`  
**Nx project:** `frontend-core`  
**Tags:** `scope:frontend`, `layer:frontend-core`

Architecture: [`docs/architecture/frontend.md`](../../../docs/architecture/frontend.md).

## Purpose

Store factory, empty RTK Query `api` (for `injectEndpoints`), session slice, `can()` / unstyled `<Can>`, ports, and web adapters. Hosts inject `{baseUrl, ports}` at configure time.

```
src/
  config/           # configureFrontendCore locator
  ports/            # StoragePort, LoggerPort, LinkingPort, WindowPort
  adapters/web/     # default web implementations
  session/          # session slice
  can/              # can(), useCan, <Can>
  lib/
    redux/          # createStore
    api/            # empty RTK Query api
    react/          # typed hooks used across the package
  testing/          # createTestStore (@b2b-saas-starter-kit/frontend-core/testing)
```

Public API is `@b2b-saas-starter-kit/frontend-core` only (no deep imports). Test helpers are `@b2b-saas-starter-kit/frontend-core/testing`.

## Usage

```tsx
import {api, configureFrontendCore, createStore, createWebPorts, useCan} from '@b2b-saas-starter-kit/frontend-core'
import type {MembershipOutput} from '@b2b-saas-starter-kit/contracts'

configureFrontendCore({baseUrl: '/v1', ports: createWebPorts()})
const store = createStore()

export const membersApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMembers: build.query<MembershipOutput[], void>({
      query: () => '/tenants/current/members',
      providesTags: [{type: 'Membership', id: 'LIST'}],
    }),
  }),
})

const canReadMembers = useCan('tenancy.members.read')
```

`prepareHeaders` sets `x-user-id` / `x-tenant-id` from session when present. No `Authorization: Bearer`.

## Allowed imports

- `react` / `react-dom` (peer)
- `@reduxjs/toolkit`, `react-redux`
- `@b2b-saas-starter-kit/contracts`
- `@b2b-saas-starter-kit/shared-kernel-types`
- `@b2b-saas-starter-kit/utils`

Never import `ui-kit`, `@b2b-saas-starter-kit/config` (YAML / `node:fs`), Nest, postgres, Pino, Electron, or Capacitor.

## Forbidden edges

- `frontend-core` → `ui-kit`
- `frontend-core` → `config` / `ConfigLoader`
- `frontend-core` → backend packages (`domain`, `application`, `postgres`, `nest-http`, …)

## Commands

```bash
pnpm nx run frontend-core:lint
pnpm nx run frontend-core:typecheck
pnpm nx run frontend-core:test
```

## Phase 13 Definition of Done

- [x] Package at `packages/frontend/core` with tags `scope:frontend`, `layer:frontend-core`
- [x] `configureFrontendCore` + `createStore` + empty RTK `api`
- [x] Session slice, `can()` / `useCan` / `<Can>`, web ports
- [x] Contracts error-envelope mapping; stub principal headers
- [x] `./testing` (`createTestStore`)
