# `@b2b-saas-starter-kit/config`

Shared configuration loader for the monorepo. Apps call `ConfigLoader`; YAML is the current source and can be extended later (env, secrets manager) without changing call-site shape.

**Path:** `packages/shared/config`  
**Nx project:** `config`  
**Tags:** `scope:shared`, `layer:config`

## Purpose

- Load structured config from a pluggable **source**
- Validate with **Zod** (fail fast)
- Stay framework-free (no Nest, no React)

Apps own Zod **schemas** and config **values** (`apps/*/config/`). This package owns **how** values are obtained.

Architecture: [`docs/architecture/shared-packages.md`](../../../docs/architecture/shared-packages.md), [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Usage

```typescript
import {resolve} from 'node:path'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'
import {z} from 'zod'

const ApiRootSchema = z.object({
  app: z.object({
    port: z.number().int(),
  }),
})

const config = ConfigLoader.load(ApiRootSchema, {
  source: 'yaml',
  directory: resolve('config'),
})
```

`LoadConfigOptions` is a **discriminated union** on `source`. Implemented: `source: 'yaml'` and `source: 'env'`.

### YAML options

| Field            | Meaning                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `source: 'yaml'` | Discriminant                                                                                   |
| `directory`      | Folder containing YAML files                                                                   |
| `files?`         | Explicit file names; default all `*.yml` / `*.yaml` (sorted; later files win on shallow merge) |

Copy `config.dist.yml` → `config.yml` per app (gitignored values). Do not commit secrets to git.

### Env options

The env source is the container/12-factor contract (`DATABASE_URL`, `REDIS_URL`, …). Values are raw strings, so use coercing schemas.

| Field           | Meaning                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `source: 'env'` | Discriminant                                                                                 |
| `prefix?`       | Only include vars starting with this prefix; the prefix is stripped from result keys         |
| `keys?`         | Restrict to these variable names (looked up with `prefix` applied); default all defined vars |
| `env?`          | Environment to read from; defaults to `process.env`                                          |

```typescript
import {ConfigLoader} from '@b2b-saas-starter-kit/config'
import {z} from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  PORT: z.coerce.number().int(),
})

const config = ConfigLoader.load(EnvSchema, {source: 'env', keys: ['DATABASE_URL', 'REDIS_URL', 'PORT']})
```

## Extending sources later

Add a new union member (e.g. `{ source: 'secrets', … }`) and a branch in `ConfigLoader`. Existing `source: 'yaml' | 'env'` call sites stay valid.

## Commands

```bash
pnpm nx run config:typecheck
pnpm nx run config:test
pnpm nx run config:lint
```
