# Docker & Image Build Strategy

How application images are built for staging and (later) GCP. **Daily dev does not use app images** —
apps run on the host (see [`local-development.md`](./local-development.md)).

Images live in [`infra/docker/`](../../infra/docker/). `pnpm check:node-version` enforces
`ARG NODE_VERSION` against [`.nvmrc`](../../.nvmrc).

## Principles

- **One image per app**, multi-stage. No mega-image containing the whole monorepo at runtime.
- **Build inside Docker** (`pnpm nx build <app>`), so staging builds need no Nx toolchain on the VPS.
- **Build context = repo root.** The workspace lockfile, `pnpm-workspace.yaml`, and every
  `package.json` are required for a deterministic install. [`.dockerignore`](../../.dockerignore)
  keeps the context small.
- **pnpm via Corepack** (`corepack enable`) — it reads `packageManager` from `package.json`.
- **Node version** comes from `ARG NODE_VERSION`, kept in sync with `.nvmrc` / `engines`.

## Backend (api / worker)

[`infra/docker/backend.Dockerfile`](../../infra/docker/backend.Dockerfile) is parameterized
(`ARG APP=api` or `worker`).

- Build: `pnpm nx build ${APP}` (webpack, `externalDependencies: none` in production). Output is
  `apps/${APP}/dist` (`main.js`, chunks, `config/default.yml`).
- Runtime: copy that `dist` to `/app` and install only `@node-rs/argon2` (the sole webpack
  external). `CMD ["node", "main.js"]`.
- Debian `bookworm-slim` (not Alpine/musl) for native prebuilds.
- Do not copy the whole monorepo `node_modules`. Do not use `pnpm deploy --prod` — webpack
  already inlines JS.

```bash
docker build -f infra/docker/backend.Dockerfile --build-arg APP=api -t kit-api .
docker build -f infra/docker/backend.Dockerfile --build-arg APP=worker -t kit-worker .
```

API health: `GET /ready` on port 3000. Worker has no HTTP server — Compose uses a process probe.

`CONFIG_DIR` / `CONFIG_OVERLAY` select extra YAML (for example `staging.yml` baked next to
`default.yml`). Secrets stay env (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`).

## Frontend (web / admin / Storybook)

Unprivileged NGINX serves the Vite/Storybook static output:

| Image     | Dockerfile             | Copy from                                   | Staging `base` |
| --------- | ---------------------- | ------------------------------------------- | -------------- |
| web       | `web.Dockerfile`       | `apps/web/dist`                             | `/`            |
| admin     | `admin.Dockerfile`     | `apps/admin/dist`                           | `/admin/`      |
| storybook | `storybook.Dockerfile` | `packages/frontend/ui-kit/storybook-static` | `/storybook/`  |

Staging builds set `CONFIG_OVERLAY=staging.yml` so `apiBaseUrl` is `/api/v1` (same origin through
the gateway). `VITE_BASE` / `STORYBOOK_BASE` keep asset URLs correct under those prefixes.

## Gateway and migrate

- [`gateway.Dockerfile`](../../infra/docker/gateway.Dockerfile) — reverse proxy only. Routes `/`
  → web, `/admin/` → admin, `/storybook/` → storybook, `/api/` → api (strips the `/api` prefix so
  Nest still sees `/v1` and `/live`).
- [`migrate.Dockerfile`](../../infra/docker/migrate.Dockerfile) — one-shot `pnpm nx run postgres:migration:run`.
  Compose profile `migrate`; `pnpm infra:migrate`. Never set `migrationsRun: true` on API boot.

## Compose

| File                               | Role                                                |
| ---------------------------------- | --------------------------------------------------- |
| `infra/compose/docker-compose.yml` | Postgres + Redis                                    |
| `docker-compose.override.yml`      | Dev: publish DB/Redis on `127.0.0.1`                |
| `docker-compose.staging.yml`       | Full app stack + gateway (no override)              |
| `docker-compose.apps.yml`          | Optional local api+worker images (`--profile apps`) |

```bash
pnpm infra:up            # postgres + redis; apps on the host
pnpm infra:apps:up       # also api + worker containers (mini-staging)
pnpm infra:staging:up    # everything in Docker; gateway on :80
pnpm infra:migrate       # one-shot migrations against staging compose
```

CI ([`.github/workflows/images.yml`](../../.github/workflows/images.yml)) builds every image and
does **not** push.

## Security baseline

- Non-root `node` user (or the unprivileged NGINX image).
- Pinned base image tags; no secrets baked into images (env at runtime only).
- Only the gateway publishes a host port in staging.
