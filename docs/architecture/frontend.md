# Frontend Architecture

React + Vite, two applications sharing libraries, Redux Toolkit + RTK Query for state. UI component/CSS technology is **TBD**.

Related: [`design-system.md`](./design-system.md), [`api-contracts.md`](./api-contracts.md), [`authorization.md`](./authorization.md). Investigation of runtime hosts (Electron / Capacitor): [`frontend-foundation-investigation.md`](./frontend-foundation-investigation.md).

## Applications

**Decision:** two apps sharing libraries.

- **`apps/web`** — tenant-facing product app.
- **`apps/admin`** — internal back-office (support/ops), different audience, permissions, and deploy cadence.

Both are thin shells composing shared libraries. Splitting them keeps audiences, bundles, and permission surfaces separate, and demonstrates the shared-lib boundaries a starter kit should teach.

## Library vs. folder — FSD hybrid

**Decision:** Feature-Sliced Design applied pragmatically.

- **Shared libraries** (Nx projects), reused by both apps:
  - `frontend/ui-kit` — presentation package (native `Button` for now; UI tech TBD — see [`design-system.md`](./design-system.md)).
  - `frontend/core` — RTK store setup, RTK Query base API, auth/tenant/permission state, the `can()` helper, API client wiring, shared hooks.
  - `contracts`, `shared-kernel-types`, `utils`, `config` — shared with the backend.
- **Features live as FSD folders inside each app** (`apps/web/src/{app,pages,features,shared}`), and are **promoted to a `frontend/feature-*` library only when a second app needs them.** This avoids premature libraries while keeping the door open.

```
apps/web/src/
  app/        # entry, providers (Redux, Router), app shell
  pages/      # route-level composition
  features/   # feature slices (ui + model + api usage) — folders, not libs (yet)
  shared/     # app-local helpers (thin; truly-shared code goes to frontend/* libs)
```

FSD layer rule inside an app: `app → pages → features → shared` (imports point downward). Enforced by the same folder-level import lint used on the backend (see [`boundaries.md`](./boundaries.md)).

## State: server vs. client

**Decision (carried + clarified):**

- **Server state** → **RTK Query** (in `frontend/core`). One base API with `fetchBaseQuery`, per-context endpoint injections, tag-based cache invalidation. Request/response types come from `contracts`.
- **Client/UI state** → **Redux Toolkit slices** (ephemeral UI, wizards, local toggles) — kept minimal.
- **Session state** (current user, active tenant, effective permissions) → sourced from a `/me` RTK Query endpoint (server-authoritative), with a thin slice holding the _selected_ tenant.

```typescript
// frontend/core/api.ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, {getState}) => {
      const token = selectAccessToken(getState())
      const tenantId = selectActiveTenantId(getState())
      if (token) headers.set('authorization', `Bearer ${token}`)
      if (tenantId) headers.set('x-tenant-id', tenantId)
      return headers
    },
  }),
  tagTypes: ['Me', 'Tenant', 'Membership', 'Role', 'Notification', 'AuditEvent'],
  endpoints: () => ({}),
})
```

## Authentication state

- Access token stored per the chosen strategy (e.g. in-memory + refresh cookie); token attached by `prepareHeaders`.
- `401` handling (refresh/redirect to login) is centralized in the base query in `frontend/core`.
- Login/tenant-selection flow lives as a feature; the resulting token carries the tenant claim (see [`multi-tenancy.md`](./multi-tenancy.md)).

## Tenant context on the frontend

- The **active tenant** is part of session state; switching tenants re-fetches `/me` (new effective permissions) and invalidates tenant-scoped RTK Query caches.
- The active tenant is sent to the API (token claim and/or `x-tenant-id` header) so the backend establishes the matching `TenantContext`.

## Permission-aware UI

- `/me` returns the user's **effective permissions** for the active tenant (see [`authorization.md`](./authorization.md)).
- `frontend/core` exposes `useCan(permission)` and a `<Can permission="…">` component to gate rendering / disable actions.
- These are **UX-only**; the backend is authoritative. Never rely on hiding a control for security.

```tsx
import {Button} from '@b2b-saas-starter-kit/ui-kit'

const canInvite = useCan('tenant.members.invite')
return (
  <Button disabled={!canInvite} onClick={invite}>
    Invite member
  </Button>
)
```

## App shell

Both apps share a shell pattern (from `frontend/core` + `frontend/ui-kit`): providers (Redux, Router), authenticated layout (tenant switcher, nav, user menu), and route guards that check authentication + coarse permissions before rendering a route.

## Boundaries recap

- Frontend never imports backend layers; they meet only at `contracts`, `shared-kernel-types`, `utils`, `config`.
- `ui-kit` contains **no** data-fetching or business logic (presentation only).
- `core` contains **no** presentational components (state/data only).
- Features compose `ui-kit` + `core` + `contracts`.
