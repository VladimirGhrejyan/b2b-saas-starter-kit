# `@b2b-saas-starter-kit/mail`

Mail adapters for the platform `MailerPort`. Composition wires this package from YAML `mail.transport`; `apps/api` must not import it.

**Path:** `packages/infrastructure/mail`  
**Nx project:** `mail`  
**Tags:** `scope:backend`, `layer:infrastructure`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md).

## Layout

```
src/
  config/
  smtp-mailer.ts
  http-mailer.ts
```

- `SmtpMailer` sends `{ to, subject, text }` through nodemailer.
- `HttpMailer` POSTs `{ from, to, subject, text }` to an emailing-service URL (Bearer `apiKey` when set).

Forgot-password and invitation use cases are unchanged. Omit `mail` in YAML to keep `LoggingMailer`.

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
