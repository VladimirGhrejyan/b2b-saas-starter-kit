# Staging (Single VPS)

Cheap, simple, reliable staging on one VPS with Docker Compose. Not Kubernetes — deliberately.

## Topology

```
        Internet (or localhost)
           │  80
        ┌──▼───────────┐
        │   gateway    │  NGINX reverse proxy (TLS is a product concern)
        └──┬───────────┘
           ├── /            web
           ├── /admin       admin
           ├── /storybook   ui-kit Storybook
           └── /api         api :3000  (/api/v1, /api/live)
        worker, postgres, redis — Docker network only
```

## Bring-up

```bash
cp infra/env/.env.example infra/env/.env   # set real staging values (chmod 600)
# JWT_ACCESS_SECRET must be set and must not be the development default.
pnpm infra:migrate                         # one-shot against host `postgres`
pnpm infra:staging:up
```

The dev override is **not** used (`pnpm infra:staging:up` is base + staging only), so
Postgres/Redis are never published to the host.

Laptop check after `up`:

- `http://localhost/` — web
- `http://localhost/admin/` — admin
- `http://localhost/storybook/` — Storybook
- `http://localhost/api/live` — API liveness

Daily development stays `pnpm infra:up` + `pnpm nx serve`. Staging images are not for HMR.

## Operational settings

- `restart: unless-stopped` on every service.
- Healthchecks on Postgres, Redis, and api (`GET /ready`); worker is process-only.
- App `depends_on` uses `condition: service_healthy` where a probe exists.
- Modest `deploy.resources.limits` and JSON-file log rotation.
- Only the gateway publishes a host port (`80:8080`).

## Reverse proxy & TLS

The kit gateway is HTTP. TLS (Certbot sidecar, Cloudflare Origin cert, or a load balancer) is
product work. Keep the cert path documented so it can be swapped for a managed certificate on GCP.

## Backups

Scheduled `pg_dump` of Postgres to a mounted or off-box location. Redis needs no backup (ephemeral —
see [`redis.md`](./redis.md)).

## Updates

1. Rebuild or pull **pinned** images (`IMAGE_TAG`).
2. `pnpm infra:migrate` (or `docker compose … --profile migrate run --rm migrate`).
3. `pnpm infra:staging:up` (recreates only changed services).
4. Do not `create` / `generate` migrations on the server, and do not set `migrationsRun: true` on API boot.

Because tags are pinned, redeploys are reproducible; roll back by pointing to the previous tag.

## Security baseline

- No secrets in images; env via `infra/env/.env` (`chmod 600`) — later Docker secrets / GCP Secret
  Manager behind the same env contract.
- Non-root runtime users; minimal exposed ports; pinned image versions.
