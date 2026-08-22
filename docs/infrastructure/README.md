# Infrastructure (Docker, Local & Staging)

Operational guide for running the stack's infrastructure dependencies and (later) its
containerized applications. For the architectural intent behind Redis/Postgres usage, see
[`../architecture/infrastructure.md`](../architecture/infrastructure.md) and
[ADR-026](../architecture/decisions.md).

## Principles

- **Dev = infra in Docker, apps on the host.** Compose runs only Postgres + Redis; apps run
  via `pnpm nx serve …` for fast HMR. No app containers or bind-mounts in dev.
- **Staging = everything in Docker on one VPS** (Postgres + Redis + built app images + NGINX).
- **Production (future GCP) = app images only**; Postgres/Redis become managed services. Compose
  is never a production dependency.
- **Env-driven config.** The same image runs everywhere; only `DATABASE_URL`, `REDIS_URL`, and
  friends change. See [`../architecture/infrastructure.md`](../architecture/infrastructure.md).

## Quick start (local)

```bash
cp infra/env/.env.example infra/env/.env   # then edit values (gitignored)
pnpm infra:up                              # start Postgres + Redis
pnpm nx serve api                          # run apps on the host
pnpm infra:logs                            # tail infra logs
pnpm infra:down                            # stop
pnpm infra:reset                           # wipe volumes + restart (destroys local DB data)
```

## Files

```
infra/
  compose/
    docker-compose.yml           # base infra: postgres + redis (dev + staging)
    docker-compose.override.yml  # dev: publish db/redis on 127.0.0.1
    docker-compose.staging.yml   # DEFERRED: app services + NGINX
  docker/                        # DEFERRED: per-app Dockerfiles + nginx conf
  env/
    .env.example                 # template -> copy to infra/env/.env
.dockerignore                    # keeps the (repo-root) build context minimal
scripts/node/check-node-version.ts  # .nvmrc / engines / Dockerfile ARG guard
```

## Docs

- [`docker.md`](./docker.md) — image build strategy (multi-stage, pnpm, Nx).
- [`local-development.md`](./local-development.md) — day-to-day dev workflow.
- [`staging.md`](./staging.md) — single-VPS deploy, backups, updates.
- [`postgresql.md`](./postgresql.md) — versioning, persistence, migrations, reset.
- [`redis.md`](./redis.md) — single-instance policy, ephemerality, GCP portability.
