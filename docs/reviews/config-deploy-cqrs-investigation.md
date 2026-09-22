# Config, deploy, and CQRS/ES — investigation

Investigation only. Existing architecture docs remain the source of truth. This is not an ADR and does not add Dockerfiles, CD, or event-sourcing to the kit.

**Audience:** initializing a product from this starter kit on **one VPS**, with **Cloudflare**, **GitHub**, **Jira/Confluence**. First staging surface: `api` + `worker` + `web` + `admin` + Storybook; later metrics UI and a Redis UI.

Maps to foundation-review items **7** (configuration / secrets) and **8** (deployment artifacts). Several statements in that review are stale: health probes, outbox, BullMQ worker, idempotency, and OpenTelemetry now exist. Dockerfiles and image-build CI exist; CD still does not. There is no `redactSecrets` helper in `@b2b-saas-starter-kit/config` (Pino redacts `Authorization` only). The `process.env.HOST ?? process.env.API_HOST` chain cited in finding 7 is gone; `apps/api/src/main.ts` loads nested YAML via `loadApiConfig`.

---

## 1. Configuration and secret-handling — recommendation

Docker **can** mount YAML. Env-only backend config was a 12-factor habit, not a platform limit. Prefer **YAML for structure**, **environment variables only for secrets and a few host-specific scalars**.

`ConfigLoader` loads nested YAML, deep-merges overlays, then copies a small env allow-list onto paths (`postgres.url` ← `DATABASE_URL`). Apps validate one Zod tree (`appEnv`, `nodeEnv`, plus structure).

### Rule

| Put in YAML (committed or mounted, never secrets)                                                                             | Put in `process.env` (Compose / VPS / CI injects)                              |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Nested objects: `http`, `postgres.pool`, `mail` (`smtp` host/port/from or `http` url), `outbox`, `cors.origins` as a **list** | Passwords, tokens, URLs that **embed** passwords                               |
| Numbers, booleans, enums, feature flags                                                                                       | `DATABASE_URL`, `REDIS_URL` (or `POSTGRES_PASSWORD` if you split the URL)      |
| Public labels: `appEnv: staging`, API title, Swagger path                                                                     | `JWT_ACCESS_SECRET`, `MAIL_PASS` / `MAIL_API_KEY`, Swagger basic-auth password |
| Frontend `apiBaseUrl`, `env` (already YAML)                                                                                   | GitHub/SSH/registry tokens (never in the Node app file)                        |

One Zod schema per app should match the **YAML tree**. Composition receives slices of that object (`config.postgres`, `config.http`). Do not keep a second `loadJwtAccessConfigFromEnv()` that re-reads `process.env`.

### Shape (illustrative)

Committed `apps/api/config/default.yml` (safe to git):

```yaml
appEnv: development
http:
  port: 3000
  cors:
    origins:
      - http://localhost:4200
    credentials: true
postgres:
  poolMax: 10
  connectTimeoutMs: 5000
  statementTimeoutMs: 15000
log:
  level: info
  pretty: true
telemetry:
  enabled: false
```

Not in that file:

```text
JWT_ACCESS_SECRET
DATABASE_URL
REDIS_URL
MAIL_PASS
MAIL_API_KEY
```

Optional overlay, still no secrets — `apps/api/config/staging.yml` or a file mounted on the VPS:

```yaml
appEnv: staging
http:
  cors:
    origins:
      - https://app.example.com
      - https://admin.example.com
    credentials: true
log:
  pretty: false
telemetry:
  enabled: true
  otlpEndpoint: http://otel-collector:4318
```

`DATABASE_URL` on staging uses host `postgres`; locally it uses `localhost`. That is env (or a secret store that **sets** env), because it contains a password and changes per machine.

### How the process should load

1. Read YAML from a known directory (`CONFIG_DIR`, default `apps/api/config` on the host, `/app/config` in the image).
2. Merge files in order: `default.yml`, then optional `local.yml` / `CONFIG_OVERLAY`.
3. Overlay / interpolate **secrets from env**. Two acceptable implementations (pick one in `ConfigLoader`):
   - **Interpolation:** YAML may contain `password: ${SMTP_PASS}`; missing var fails boot.
   - **Explicit overlay:** after YAML, copy `process.env.DATABASE_URL` → `config.postgres.url`, etc. A small allow-list of env keys, not the entire environment.
4. `schema.parse` once. Fail fast.
5. `NODE_ENV=production` on the VPS (Nest/libraries). `appEnv: staging` in YAML is the product label (Grafana, logs). Do not use `NODE_ENV=development` on staging or the default JWT secret and open Swagger stay on.

Call `ConfigLoader.load` only at bootstrap (api/worker `main.ts`, Vite plugin, migration CLI). No import-time singleton.

### Docker / Compose

Compose does **not** parse your app YAML as its own config. It either:

- **injects env** into the container (`env_file`, `environment:`) — required for secrets, and
- **mounts YAML** if you want a server-specific overlay without rebuilding:

```yaml
# future api service
volumes:
  - ./apps/api/config/staging.yml:/app/config/local.yml:ro
environment:
  CONFIG_DIR: /app/config
  DATABASE_URL: postgres://app:${POSTGRES_PASSWORD}@postgres:5432/app
  JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
```

Bake `default.yml` into the image (no secrets). Mount overlay on the VPS if origins/OTLP differ. Never `COPY` `infra/env/.env` into the image. Never `ENV JWT_ACCESS_SECRET=...` in the Dockerfile.

Frontend stays YAML at **Vite build** (browser has no Compose env). Staging vs production web images may differ only by baked `apiBaseUrl`. Alternatively serve `/config.json` from NGINX if you want one web image and a runtime URL — still public, still not secrets.

### Secrets operations (VPS + GitHub)

- Gitignored `infra/env/.env` on the laptop and on the VPS (`chmod 600`): Postgres password, JWT, mail secrets, `DATABASE_URL`.
- GitHub Actions secrets for deploy (GHCR, SSH), not for baking into `web` JS.
- Later: a secret manager that **exports the same env names**. Do not invent a second Nest config API for Vault/GCP.
- Pino should redact more than `Authorization` (URLs with passwords, `MAIL_PASS`, `MAIL_API_KEY`, `JWT_ACCESS_SECRET`) once those fields exist on the config object.

### Should do (kit)

1. Nested YAML + one Zod tree per app (`api`, `worker`; keep `web`/`admin` YAML as now).
2. `ConfigLoader`: YAML merge **plus** env interpolation or an explicit secret overlay (extend the existing `source` union; do not load YAML implicitly at import).
3. Drop duplicate `process.env` readers (`loadJwtAccessConfigFromEnv`, split API vs postgres env schemas).
4. Boot assert: production/staging overlay must not use the development JWT secret; CORS list non-empty when `appEnv` is not `development`.
5. Templates: `default.yml` committed; `*.dist.yml` / `.env.example` for secrets only.

### Good to do (product)

- Mount `local.yml` on the VPS instead of forking the image for CORS/OTLP.
- Rotate JWT and DB password independently of image tags.
- Cloudflare Origin cert; secrets stay on the VPS, not in Cloudflare Workers.

### Do not

- Put secrets in committed YAML or in image layers.
- Flatten structured settings into `POSTGRES_*` env just because Compose exists.
- Require a YAML file for `DATABASE_URL` when Compose already has the password — env overlay is enough.
- Merge the entire `process.env` into the config object (noisy, easy to leak).

---

## 2. Dockerfiles, local app containers, and your VPS

### What exists

| Piece                                                                | Status                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Compose Postgres 17.5 + Redis 7.2 (healthchecks, `appnet`)           | Done — `infra/compose/docker-compose.yml`                                                                                |
| Dev overlay: publish DB/Redis on `127.0.0.1` only                    | Done — `docker-compose.override.yml`                                                                                     |
| `pnpm infra:up` / `down` / `reset` / `logs`                          | Done                                                                                                                     |
| App Dockerfiles                                                      | Done — `infra/docker/` (`backend`, web, admin, storybook, gateway, migrate)                                              |
| `docker-compose.staging.yml`                                         | Done — plus optional `docker-compose.apps.yml`                                                                           |
| CD workflow                                                          | **Missing** — `.github/workflows/` is CI (`main-ci.yml`, `images.yml` build-only) + Playwright on `main` (`web-e2e.yml`) |
| Node-version guard for `infra/docker/*.Dockerfile`                   | Ready — `pnpm check:node-version`                                                                                        |
| API `prune` / `prune-lockfile` / `copy-workspace-modules` Nx targets | Generated, unused                                                                                                        |
| Health: `GET /live`, `GET /ready`, `GET /health`                     | Done (ADR-035)                                                                                                           |
| Image build design                                                   | Written in [`docs/infrastructure/docker.md`](../infrastructure/docker.md)                                                |

ADR-026 is explicit: **dev = infra in Docker, apps on the host** (best HMR). **Staging = everything in Docker on one VPS.** Option (B) — app containers with bind-mounts in daily dev — was considered and rejected as the default.

### Are Dockerfiles a good idea?

Yes, for **your product and for the kit’s staging story**. Finding 8 is still right: a pnpm-workspace multi-stage build is fiddly; doing it once is cheaper than each product inventing it. The design in `docker.md` is the right shape:

- Build context = **repo root**
- `corepack` + `ARG NODE_VERSION` synced with `.nvmrc`
- Debian `bookworm-slim` (not Alpine) because of `pg` / argon2
- One image per app: `api`, `worker`, `web`, `admin` (+ Storybook static)
- Non-root user; no secrets in layers
- Backend: `pnpm nx build <app>` then a **pruned** runtime (`pnpm deploy --prod` **or** webpack `dist/main.js` + native externals)

**Caveat:** today’s API/worker webpack **inlines most of `node_modules`** and only externalizes `@node-rs/argon2`. A runtime image still needs that native package (and any future externals). `pnpm deploy --prod` as written in `docker.md` assumes Node resolves real packages; it still works if the CMD is `node dist/main.js` and argon2 is in the pruned tree. Do not copy the whole monorepo `node_modules` into the runtime stage.

Frontend images: build static files, serve with **unprivileged NGINX**. Staging NGINX is also the reverse proxy (`/` web, `/admin` admin, `/api` → api, `/storybook` or a subdomain for Storybook). Worker has no ingress.

### Local: Postgres + Redis + api + worker in containers — possible?

**Yes, as an overlay, not as a replacement for `pnpm nx serve`.** Keep ADR-026 for day-to-day HMR; add a compose **profile** or extra file, e.g. `infra/compose/docker-compose.apps.yml`, used when you want a “mini-staging” on the laptop:

```text
pnpm infra:up                          # postgres + redis, apps on host (default)
docker compose … -f docker-compose.yml -f docker-compose.apps.yml --profile apps up
```

Requirements for that overlay:

- Images exist (`api`, `worker`).
- `DATABASE_URL` / `REDIS_URL` (env secrets) use **service names** (`postgres://app:…@postgres:5432/app`, `redis://redis:6379`), not `localhost`.
- CORS origins stay in YAML (`http://localhost:4200` if `web` still runs on the host Vite port).
- One-shot `migration:run` against the compose network before api/worker become healthy (same as staging.md: do **not** set `migrationsRun: true` on API boot).
- Bind-mounting `apps/api/src` into a production webpack image will **not** give Nest HMR. Local app containers are for “does the image boot against this Compose Postgres?” and for teammates without Node — not for replacing `nx serve`.

If you truly want HMR **inside** Docker, that is ADR-026 option (B): `Dockerfile.dev` + bind mounts + `nx serve` as CMD. Possible, slower, and a second Dockerfile per app. Not needed if you already have Node on the host.

### Staging on 1 VPS + Cloudflare + GitHub

Documented topology in [`staging.md`](../infrastructure/staging.md) still fits: NGINX 80/443 → web static + `/api` → api; worker internal; Postgres/Redis unpublished.

Suggested product wiring (outside the kit’s current files):

```text
Internet → Cloudflare (proxy, TLS) → VPS :443 NGINX
              ├── /            web
              ├── /admin       admin
              ├── /storybook   ui-kit static (build-storybook)
              └── /api         api :3000
         worker, postgres, redis, (later) otel-collector / grafana / redis-insight
              on Docker network only
```

**CI today:** GitHub Actions builds and tests; uploads Storybook as an **artifact**, does not deploy. **CD to add in the product:** build/push images (GHCR is enough), SSH or a compose pull on the VPS, `migration:run` one-shot, `compose up -d`. Pin image tags. Cloudflare can stay “orange cloud” with Full (strict) and an Origin cert on NGINX so you skip Let’s Encrypt on the box.

**Storybook:** `pnpm nx run ui-kit:build-storybook` already produces static files; CI uploads them. Staging is “rsync/copy into an NGINX location or a tiny nginx image,” not Chromatic.

### Metrics visualization and Redis UI

**Metrics / traces — kit is ready, UI is not.** ADR-036: `TELEMETRY_ENABLED=true` + OTLP HTTP. No Prometheus `/metrics`, no Compose collector. On the VPS, add (product compose overlay, not domain code):

- OpenTelemetry Collector (receives OTLP from api/worker)
- Grafana + a backend (Grafana Cloud free tier, or self-hosted Grafana + Tempo/Prometheus/Mimir)

Point YAML `telemetry.otlpEndpoint` (or the env overlay that fills it) at the collector. Keep tenant id as a **span attribute** only (already the rule). Do not put Grafana on the public internet without Cloudflare Access or basic auth.

**Redis UI — possible, optional, not Redis Stack.** [`redis.md`](../redis.md) forbids Redis Stack/modules (Memorystore portability). A **sidecar GUI** is fine:

- [Redis Insight](https://redis.io/insight/) official container, bound to `127.0.0.1` or Cloudflare Access
- or `redis-commander`

Do not enable AOF/RDB for the sake of the UI. Redis stays ephemeral; durability is Postgres + outbox.

### Implementation order (kit vs product)

1. `infra/docker/backend.Dockerfile` (api/worker) — **done**.
2. `web` / `admin` / `storybook` static Dockerfiles — **done**.
3. `docker-compose.staging.yml` — **done**.
4. Optional `docker-compose.apps.yml` — **done**.
5. CI job: build images, do not push — **done** (`images.yml`).
6. Product-only: CD workflow + VPS compose project + Cloudflare.

---

## 3. CQRS and Event Sourcing in a future product (not in the kit)

You do **not** need this in the starter kit. Question: how hard is it to add **per feature** later?

### What you already have (this is CQRS-lite, not event sourcing)

| Pattern                     | In the kit today                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command / query split       | Writes: `*.use-case.ts` inside `UnitOfWork`. Reads: `*.query.ts` (no UoW).                                                                                 |
| Hexagonal ports             | Repositories and `EventPublisher` / `EventBus` are interfaces.                                                                                             |
| Domain events on aggregates | `AggregateRoot.record` / `pullEvents`. Use cases `DomainEventCollector` → `EventPublisher`.                                                                |
| Transactional outbox        | Same Postgres transaction as the aggregate write. Worker claims `pending` → BullMQ → `EventBus` → `processed`. At-least-once; handlers must be idempotent. |
| Optimistic concurrency      | `VersionedEntity` (`version` column) on some aggregates.                                                                                                   |
| Audit columns               | `created_at` / `updated_at` on foundation entities.                                                                                                        |
| Read model                  | Queries hit the **same** TypeORM tables as writes (no separate projection store).                                                                          |

That is **state-sourced DDD + integration events**. It is the right default for identity, tenancy, and authorization.

### Event sourcing vs this model

Event sourcing means the **event log is the source of truth**; current state is a replay or a projection. The kit stores **current rows** (`users`, `tenants`, …) and uses events only for **after-commit reactions** (mail, audit, cache). Those events are not an event store: no stream per aggregate, no `expectedVersion` on append, no snapshot store, no subscriptions other than the outbox relay.

### How heavy is the lift?

**CQRS with separate read models (usually enough):** **light-to-medium**, and it fits the kit.

- Keep write use cases + aggregates + TypeORM as they are.
- Add projection tables (or Redis/read-side Postgres) updated by **idempotent** `EventBus` handlers in the worker (you already have the delivery path).
- New `*.query.ts` classes read the projection. No change to Nx layers if the projection lives in `postgres` (or a new `infrastructure` adapter) behind a query-side port.
- Do this **per context or per feature**, not globally. Members list staying on `memberships` is fine.

**Event-sourced aggregates (true ES):** **heavy**, and should stay out of the kit.

You would add: an event store (Postgres table `aggregate_id, sequence, type, payload, metadata` or a dedicated store), load-by-replay (or snapshots), `save` = append-only with version check, rebuildable projections, upcasters, and operational tools (stream inspection, rebuild jobs). TypeORM entities-as-source-of-truth **conflict** with that for the same aggregate. Mixing both in one `User` / `Tenant` aggregate is the expensive part.

**Practical product rule:** keep kit contexts **state-sourced**. For the few features that need a full audit log, time-travel, or complex derived views, introduce a **new context** (or a new aggregate) that is event-sourced behind the same ports (`Repository` becomes “append + load stream”). Composition binds a different adapter. Existing `identity` / `tenancy` / `authorization` stay as they are.

### What you should not do

- Do not replace `EventPublisher` / outbox with a library “event store” for all aggregates.
- Do not put ES in `shared` or force every use case through a bus.
- Do not use BullMQ as the event store (Redis is ephemeral by policy).
- Do not wait on EventStoreDB/Kafka unless a feature actually needs multi-service streams; Postgres outbox + worker already crosses the api/worker boundary.

### Verdict

Integrating **CQRS-style read models** on top of the current outbox is a **normal product increment**, not a foundation rewrite. Integrating **event sourcing** is a **new persistence style for selected aggregates** — planned weeks, not an afternoon — and should never be retrofitted into this kit’s current entities.

---

## Suggested path for your first product (not kit work)

1. Copy the kit; keep `pnpm infra:up` + `nx serve` for daily work.
2. Switch backend boot to nested YAML + env secrets (section 1); `NODE_ENV=production` on the VPS.
3. Add Dockerfiles + `docker-compose.staging.yml`; deploy with GitHub Actions → GHCR → VPS; Cloudflare in front.
4. Serve `web`, `admin`, Storybook from NGINX; leave worker/Postgres/Redis internal.
5. Turn on OTel → collector → Grafana when you care about graphs; add Redis Insight bound to localhost or Access.
6. When a feature needs a specialized read model, project from outbox events. Only then consider an event-sourced aggregate in a **new** context.

Jira/Confluence stay outside the runtime: ticket keys in commits (`VC-N`) already match commitlint.
