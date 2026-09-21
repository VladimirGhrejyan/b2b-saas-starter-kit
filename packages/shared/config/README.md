# `@b2b-saas-starter-kit/config`

Shared configuration loader for the monorepo. Apps call `ConfigLoader`; YAML holds structured values, and a small env overlay supplies secrets.

**Path:** `packages/shared/config`  
**Nx project:** `config`  
**Tags:** `scope:shared`, `layer:config`

## Purpose

- Load structured config from a pluggable **source**
- Overlay selected environment variables onto YAML paths
- Validate with **Zod** (fail fast)
- Stay framework-free (no Nest, no React)

Apps own Zod **schemas** and config **values** (`apps/*/config/default.yml`). This package owns **how** values are obtained.

Architecture: [`docs/architecture/shared-packages.md`](../../../docs/architecture/shared-packages.md), [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Usage

```typescript
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {AppConfigFiles, ConfigLoader} from '@b2b-saas-starter-kit/config'
import {z} from 'zod'

const schema = z.object({
  appEnv: z.enum(['development', 'staging', 'production']),
  postgres: z.object({url: z.url(), poolMax: z.number().int()}),
})

const directory = AppConfigFiles.resolveDirectory(join(fileURLToPath(new URL('.', import.meta.url)), 'config'))

const config = ConfigLoader.load(schema, {
  source: 'yaml',
  directory,
  files: AppConfigFiles.resolve(directory),
  envOverlay: {'postgres.url': 'DATABASE_URL'},
})
```

`LoadConfigOptions` is a **discriminated union** on `source`. Implemented: `source: 'yaml'` and `source: 'env'`.

### YAML options

| Field            | Meaning                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `source: 'yaml'` | Discriminant                                                                                |
| `directory`      | Folder containing YAML files                                                                |
| `files?`         | Explicit file names; default all `*.yml` / `*.yaml` (sorted; later files **deep-merge**)    |
| `envOverlay?`    | Dot-path → env key (e.g. `postgres.url` → `DATABASE_URL`). Undefined env values are skipped |
| `env?`           | Environment to read for the overlay; defaults to `process.env`                              |

App load order via `AppConfigFiles.resolve`: `default.yml`, optional gitignored `local.yml`, then `CONFIG_OVERLAY` when set. Directory via `AppConfigFiles.resolveDirectory`: `CONFIG_DIR` or the compiled `config/` folder next to the bundle.

Do not commit secrets. Put them in env (`DATABASE_URL`, `JWT_ACCESS_SECRET`, …).

### Shared env schemas

- `nodeEnvSchema` — `development \| production`. `production` stays production; any other string (including Vitest `test`) becomes `development`.
- `appEnvSchema` — `staging \| production`.
- `kitAppEnvSchema` — `appEnvSchema` plus local `development`.
- `mailProviderSchema` — discriminated `smtp` \| `http` mail transport. Optional on app schemas; omit it to keep `LoggingMailer`.
- `logSchema` / `telemetrySchema` — shared observability fragments.

### Env options

The env source remains for CLI and test harnesses that only need `DATABASE_URL`. Values are raw strings, so use coercing schemas.

## Extending sources later

Add a new union member (e.g. `{ source: 'secrets', … }`) and a branch in `ConfigLoader`. Existing `source: 'yaml' | 'env'` call sites stay valid.

## Commands

```bash
pnpm nx run config:typecheck
pnpm nx run config:test
pnpm nx run config:lint
```
