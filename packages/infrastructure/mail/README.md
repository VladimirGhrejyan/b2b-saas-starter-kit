# `@b2b-saas-starter-kit/mail`

SMTP adapter for the platform `MailerPort`. Composition wires this package when `SMTP_HOST` is set; `apps/api` must not import it.

**Path:** `packages/infrastructure/mail`  
**Nx project:** `mail`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  config/
  smtp-mailer.ts
```

`SmtpMailer` sends `{ to, subject, text }` through nodemailer. Forgot-password and invitation use cases are unchanged.

## Allowed imports

- `@b2b-saas-starter-kit/platform`, `@b2b-saas-starter-kit/config`, `@b2b-saas-starter-kit/utils`
- `nodemailer`, `@nestjs/common`
- `node:` builtins

Never import domain, application, contracts, TypeORM, pg, ioredis, undici, or other infrastructure packages.

## Commands

```bash
pnpm nx run mail:lint
pnpm nx run mail:typecheck
pnpm nx run mail:test
```
