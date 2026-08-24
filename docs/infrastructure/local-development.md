# Local Development

Infrastructure runs in Docker; applications run on the host. This gives the best HMR and avoids
bind-mount filesystem issues, while keeping Postgres/Redis versions identical to staging.

## Prerequisites

- Docker (Desktop or Engine) with the Compose plugin.
- Node.js from [`.nvmrc`](../../.nvmrc) (`nvm use`) and pnpm via Corepack (`corepack enable`).

## Steps

1. Create your env file (gitignored):

   ```bash
   cp infra/env/.env.example infra/env/.env
   ```

   Adjust credentials as needed. `DATABASE_URL`/`REDIS_URL` default to `localhost` because apps
   run on the host and the dev override publishes the ports there.

2. Start infrastructure:

   ```bash
   pnpm infra:up
   ```

   Compose starts `postgres` and `redis` with healthchecks. Ports are published on
   `127.0.0.1` only (`5432`, `6379`) — not exposed to your network. If a native Postgres
   already occupies `5432`, set `POSTGRES_PORT` (and `DATABASE_URL`) in `infra/env/.env`.

3. Run apps on the host (once they exist):

   ```bash
   pnpm nx serve api
   pnpm nx serve web
   ```

## Connecting

| Tool      | Command                     |
| --------- | --------------------------- |
| psql      | `psql "$DATABASE_URL"`      |
| redis-cli | `redis-cli -u "$REDIS_URL"` |

## Everyday commands

```bash
pnpm infra:logs    # tail postgres + redis logs
pnpm infra:down    # stop containers (keeps the pgdata volume)
pnpm infra:reset   # down --volumes then up -> fresh database (DESTROYS local data)
```

## Resetting the database

`pnpm infra:reset` removes the `pgdata` volume and recreates it. Use it to get a clean database;
schema is (re)created by TypeORM migrations at app startup, not by Compose. See
[`postgresql.md`](./postgresql.md).

## Node version

`.nvmrc`, `package.json` `engines.node`, and future Dockerfile `ARG NODE_VERSION` must agree.
`pnpm check:node-version` enforces this and runs in `lint-staged` when those files change.
