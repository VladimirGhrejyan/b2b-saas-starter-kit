# B2B SaaS Starter Kit

Nx monorepo foundation for a multi-tenant B2B SaaS product. Fork it, rename it, and build your domain on top of identity, tenancy, and authorization that already exist.

## Stack

| Area         | Choice                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Runtime      | Node.js 24 LTS (`.nvmrc`), pnpm 12 (Corepack), Nx 23                            |
| API / worker | NestJS, TypeORM, PostgreSQL, Redis, BullMQ + outbox, Zod, Pino                  |
| Frontend     | React 19, Vite, Redux Toolkit + RTK Query                                       |
| UI           | `@b2b-saas-starter-kit/ui-kit` — native HTML only. No Tailwind, Radix, or theme |
| Tests        | Vitest; Playwright smokes in `apps/web-e2e`                                     |
| Infra        | Docker Compose (local Postgres/Redis; optional full staging stack)              |

## What is in the kit

**Apps:** `api`, `worker`, `web`, `admin`, plus thin `desktop` (Electron) and `mobile` (Capacitor) hosts of the web dist.

**Shipped contexts:** identity (email/password, JWT + cookie refresh), tenancy, RBAC (system + custom roles), invitations, API keys.

**Config:** YAML for structure (`apps/*/config/default.yml`), env for secrets (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`).

**Ops:** `pnpm infra:up` for daily Postgres/Redis; `pnpm infra:staging:up` for images + gateway on `:80`. CI builds images and does not push. There is no CD, TLS, or Cloudflare in the kit.

**Deferred:** `audit` and `notifications` contexts; a CSS/design-system stack; production deploy pipeline.

## Start

```bash
nvm use
corepack enable
corepack prepare pnpm@12.4.1 --activate
pnpm install
```

Rename kit branding to your product:

```bash
pnpm init:product --scope=@acme --name="Acme Cloud" --prefix=ACME --yes --install
```

Use `--dry-run` first. Then copy env and review the diff:

```bash
cp infra/env/.env.example infra/env/.env
pnpm nx sync
```

## Run

```bash
pnpm infra:up          # Postgres + Redis on 127.0.0.1
pnpm nx serve api
pnpm nx serve web      # http://localhost:4200
pnpm nx serve admin    # optional
```

Day-to-day: apps on the host, infra in Docker. Details: [`docs/infrastructure/local-development.md`](docs/infrastructure/local-development.md).

```bash
pnpm infra:staging:up  # full Docker stack, gateway on :80 (needs JWT_ACCESS_SECRET)
```

## Documentation

- [`docs/architecture/overview.md`](docs/architecture/overview.md) — decisions and layout
- [`docs/infrastructure/README.md`](docs/infrastructure/README.md) — Docker, local, staging
- [`docs/nx/guide.md`](docs/nx/guide.md) — Nx in this workspace
