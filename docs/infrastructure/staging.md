# Staging (Single VPS)

Cheap, simple, reliable staging on one VPS with Docker Compose. Not Kubernetes — deliberately.

> Status: the app services + reverse proxy overlay (`docker-compose.staging.yml`) is **deferred**
> until `apps/*` exist. The base infra (`docker-compose.yml`) is ready today. This documents the
> agreed staging design.

## Topology

```
        Internet
           │  80/443
        ┌──▼───────────┐
        │    nginx     │  reverse proxy + TLS, serves web static
        └──┬────────┬──┘
     /api  │        │  /
        ┌──▼──┐  ┌──▼──┐
        │ api │  │ web │        (worker has no ingress)
        └──┬──┘  └─────┘
           │ internal network (service names)
     ┌─────▼─────┐   ┌────────┐
     │ postgres  │   │ redis  │  not exposed to the host/public
     └───────────┘   └────────┘
```

## Bring-up

```bash
cp infra/env/.env.example infra/env/.env   # set real staging values (chmod 600)
docker compose --project-directory . --env-file infra/env/.env \
  -f infra/compose/docker-compose.yml \
  -f infra/compose/docker-compose.staging.yml up -d
```

The dev override is **not** used in staging (so Postgres/Redis are never published to the host).

## Operational settings (staging overlay)

- `restart: unless-stopped` on every service.
- Healthchecks on Postgres, Redis, and each app (`/health`); app `depends_on` uses
  `condition: service_healthy`.
- Modest `deploy.resources.limits` per service to protect the box.
- JSON-file log rotation (`max-size`, `max-file`) to bound disk usage.
- Only NGINX publishes ports (80/443). Postgres/Redis stay internal.

## Reverse proxy & TLS (NGINX)

An `nginx` service terminates TLS and routes `/` → web static container, `/api` → api container.
TLS certificates via a Certbot sidecar (or pre-provisioned certs) mounted into NGINX. Keep the cert
path documented so it can be swapped for a managed certificate / load balancer on GCP.

## Backups

Scheduled `pg_dump` of Postgres to a mounted or off-box location. Redis needs no backup (ephemeral —
see [`redis.md`](./redis.md)).

## Updates

1. Pull new **pinned** images / rebuild affected app images.
2. `docker compose … up -d` (recreates only changed services).
3. Run `pnpm nx run postgres:migration:run` as a **one-shot** against the internal `DATABASE_URL` (host `postgres`), then `up -d` the app services. Do not `create` / `generate` on the server, and do not set `migrationsRun: true` on API boot.

Because tags are pinned, redeploys are reproducible; roll back by pointing to the previous tag.

## Security baseline

- No secrets in images; env via `infra/env/.env` (`chmod 600`) — later Docker secrets / GCP Secret
  Manager behind the same env contract.
- Non-root runtime users; minimal exposed ports; pinned image versions.
