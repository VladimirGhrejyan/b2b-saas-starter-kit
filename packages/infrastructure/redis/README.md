# `@b2b-saas-starter-kit/redis`

ioredis adapters for the platform `CachePort`, `LockPort`, and `PubSubPort`. Composition wires this package; `apps/api` must not import it.

**Path:** `packages/infrastructure/redis`  
**Nx project:** `redis`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

Capability folders share one client in `kernel/`. Capabilities must not import each other.

```
src/
  kernel/     # config, client manager, Nest module, tokens, test context
  cache/      # RedisCache adapter
  lock/       # RedisLock adapter
  pubsub/     # RedisPubSub adapter (publisher + duplicate subscriber)
```

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `@b2b-saas-starter-kit/config`
- `ioredis`, `@nestjs/common`, `zod`
- `node:` builtins

Never import domain, application, contracts, TypeORM, or other infrastructure packages.

## Cache TTL

`CachePort.set` requires `ttlSeconds`. Compose Redis uses `maxmemory-policy noeviction`; expiry is correctness.

## Permission cache

`AuthorizationService` cache-aside uses a tenant-prefixed key. Future role/membership writes must `del` the same key (not implemented yet).

## Commands

```bash
pnpm infra:up
pnpm nx run redis:lint
pnpm nx run redis:typecheck
pnpm nx run redis:test
```

Integration tests use Redis logical DB `1` and `FLUSHDB` that database only. If Redis is down they fail with `run pnpm infra:up`.
