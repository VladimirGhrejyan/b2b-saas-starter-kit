# `@b2b-saas-starter-kit/http-client`

Backend outbound HTTP adapter for the platform `HttpClientPort`. Composition wires this package; `apps/api` must not import it.

**Path:** `packages/infrastructure/http-client`  
**Nx project:** `http-client`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  kernel/                 # config, Agent manager, Nest module, tokens
  http-client.adapter.ts  # UndiciHttpClient
```

One process-wide undici `Agent` is shared. Requests pass `dispatcher` explicitly — the adapter never calls `setGlobalDispatcher`.

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `@b2b-saas-starter-kit/config`
- `undici`, `@nestjs/common`, `zod`
- `node:` builtins

Never import domain, application, contracts, TypeORM, ioredis, axios, or got.

## Commands

```bash
pnpm nx run http-client:lint
pnpm nx run http-client:typecheck
pnpm nx run http-client:test
```

Unit tests use undici `MockAgent` and do not open the network.
