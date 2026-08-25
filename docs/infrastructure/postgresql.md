# PostgreSQL

## Image & version

- Official `postgres`, **pinned to a specific 17.x minor** (e.g. `postgres:17.5-bookworm`).
- Never a floating `latest` tag — bumps are deliberate and reviewed.
- **17.x** is current-stable and supported by Cloud SQL for PostgreSQL, giving a clean future
  managed target with the same major.

## Persistence

- Data lives in the named volume `pgdata` (`/var/lib/postgresql/data`).
- Survives `pnpm infra:down` and container recreation.
- **Destroyed** only by `pnpm infra:reset` (`down --volumes`) — the intended local reset workflow.

## Healthcheck

`pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"`. Dependents wait via
`depends_on: { condition: service_healthy }` rather than bare `depends_on`.

## Schema & initialization

- **Schema is owned by TypeORM migrations**, applied via the runner in `@b2b-saas-starter-kit/postgres` — not by Compose and not by `migrationsRun: true` at `DataSource` init.
- `/docker-entrypoint-initdb.d` runs **only on first init of an empty volume**; reserve it for
  one-time concerns like creating extensions or roles, never for app schema.

Schema changes are authored locally (`create` / `generate`), reviewed, registered in `postgres-migrations.ts`, then applied with the runner (`migrationsRun` is never `true` at `DataSource` init):

```bash
# Uses DATABASE_URL (default compose: postgres://app:…@localhost:5432/app)
pnpm nx run postgres:migration:create --name=tenancy-add-slug   # empty scaffold
pnpm nx run postgres:migration:generate --name=tenancy-add-slug # entity vs live DB (review the SQL)
pnpm nx run postgres:migration:run
pnpm nx run postgres:migration:revert
```

`create` / `generate` write a file under `packages/infrastructure/postgres/src/kernel/migrations/`. Register the class in `postgres-migrations.ts` after review. On staging, run **only** `migration:run` as a one-shot job against the internal `DATABASE_URL` (host `postgres`); do not generate on the server.

Integration tests derive `app_test` from `DATABASE_URL` (swap the database name to `*_test`) and create that database if it is missing. They also read `infra/env/.env` and rewrite localhost URLs to `POSTGRES_PORT`. If Postgres is down, they fail with `run pnpm infra:up`. If a native Postgres occupies the port (no `app` role), they fail with a hint to change `POSTGRES_PORT`.

```bash
pnpm infra:up
pnpm nx run postgres:test
```

## Credentials & exposure

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` come from `infra/env/.env` (gitignored).
  `.env.example` holds placeholders only.
- **Local dev:** published on `127.0.0.1:5432` by the dev override.
- **Staging:** not published to the host/public network — only reachable on the Compose network by
  service name `postgres`.

## Backups (staging)

- Scheduled `pg_dump` to a mounted or off-box location (cron or a small sidecar).
- Restore is a plain `pg_restore`/`psql` against a fresh instance. Document the retention you need.

## Future GCP

Move to **Cloud SQL for PostgreSQL** (matching the pinned major). Only `DATABASE_URL` changes; no
app code changes. Managed backups/HA replace the self-hosted `pg_dump` job.
