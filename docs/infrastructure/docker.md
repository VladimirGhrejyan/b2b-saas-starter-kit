# Docker & Image Build Strategy

How application images are built for staging and (later) GCP. **Dev does not use app images** —
apps run on the host (see [`local-development.md`](./local-development.md)).

> Status: per-app Dockerfiles are **deferred** until `apps/*` exist. This documents the agreed
> design so the first app can add its Dockerfile without re-litigating decisions.

## Principles

- **One Dockerfile per app type** (`api`, `worker`, `web`), each **multi-stage**. No mega-image
  containing the whole monorepo at runtime.
- **Build inside Docker** (`pnpm nx build <app>`), so staging/GCP builds are hermetic and need no
  Nx toolchain on the target.
- **Build context = repo root.** The workspace lockfile, `pnpm-workspace.yaml`, and every
  `package.json` are required for a deterministic install. [`.dockerignore`](../../.dockerignore)
  keeps the context small.
- **pnpm via Corepack** (`corepack enable`) — it reads `packageManager` from `package.json`. Never
  install pnpm globally.
- **Node version** comes from `ARG NODE_VERSION`, kept in sync with `.nvmrc`/`engines` by
  `pnpm check:node-version`.

## Backend (NestJS) — multi-stage shape

```dockerfile
ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-bookworm-slim AS deps
RUN corepack enable
WORKDIR /repo
# Copy only manifests first for a cacheable install layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm nx build api --configuration=production
# Emit a pruned, self-contained production package (only api's prod deps + dist).
RUN pnpm --filter api deploy --prod /app/out

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node --from=build /app/out ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

`worker` is identical except the entrypoint. Use Debian `bookworm-slim` (not Alpine/musl) to avoid
native-module surprises with `pg`, hashing libs, etc.

## Frontend (React/Vite)

Build stage produces static assets; runtime is a minimal NGINX serving them:

```dockerfile
ARG NODE_VERSION=24.19.0
FROM node:${NODE_VERSION}-bookworm-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm nx build web --configuration=production

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY --from=build /repo/dist/apps/web /usr/share/nginx/html
```

The same NGINX image also acts as the staging reverse proxy (see [`staging.md`](./staging.md)).

## Nx integration

- Images call `pnpm nx build <app> --configuration=production`.
- CI uses `pnpm nx affected` to rebuild only changed app images; each app → an independent image.
- `pnpm --filter <app> deploy --prod` prunes to production dependencies for a minimal runtime.
- Nx remote cache (Nx Cloud) can accelerate builds later; not required now.

## Security baseline

- Non-root `node` user (or the unprivileged NGINX image).
- Pinned base image tags; no secrets baked into images (env at runtime only).
- Only necessary ports exposed; slim runtime layers.
