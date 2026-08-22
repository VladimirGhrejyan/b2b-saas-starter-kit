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

- **Schema is owned by TypeORM migrations**, applied at app startup / a one-shot migration task —
  not by Compose.
- `/docker-entrypoint-initdb.d` runs **only on first init of an empty volume**; reserve it for
  one-time concerns like creating extensions or roles, never for app schema.

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
