# `@b2b-saas-starter-kit/node`

Backend process adapters for the platform `Clock` and `IdGenerator` ports. Composition wires this package; `apps/api` must not import it.

**Path:** `packages/infrastructure/node`  
**Nx project:** `node`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  clock/
  id-generator/
  node-infrastructure.module.ts
  tokens.ts
```

`SystemClock` returns UTC instants. `UuidV7IdGenerator` returns raw UUID v7 strings; application brands them.

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `uuid`, `@nestjs/common`
- `node:` builtins

Never import @node-rs/argon2, domain, application, contracts, TypeORM, pg, ioredis, undici, or other infrastructure packages.

## Commands

```bash
pnpm nx run node:lint
pnpm nx run node:typecheck
pnpm nx run node:test
```
