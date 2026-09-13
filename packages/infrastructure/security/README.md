# `@b2b-saas-starter-kit/security`

Backend crypto adapters for the platform `PasswordHasher` and `TokenDigest` ports. Composition wires this package; `apps/api` must not import it.

**Path:** `packages/infrastructure/security`  
**Nx project:** `security`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  password-hasher/
  token-digest/
  security.module.ts
  tokens.ts
```

Argon2id hashes local passwords. SHA-256 hex-digests opaque refresh and reset tokens before persistence.

## Allowed imports

- `@b2b-saas-starter-kit/platform`
- `@node-rs/argon2`, `@nestjs/common`
- `node:` builtins

Never import domain, application, contracts, TypeORM, pg, ioredis, undici, or other infrastructure packages.

## Commands

```bash
pnpm nx run security:lint
pnpm nx run security:typecheck
pnpm nx run security:test
```
