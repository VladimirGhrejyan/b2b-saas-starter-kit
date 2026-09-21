# `@b2b-saas-starter-kit/telemetry`

Env-gated OpenTelemetry SDK for traces and metrics. Logs stay in `@b2b-saas-starter-kit/logger`.

**Path:** `packages/infrastructure/telemetry`  
**Nx project:** `telemetry`  
**Tags:** `scope:backend`, `layer:infrastructure`, `layer:telemetry`

Architecture: [`docs/architecture/infrastructure.md`](../../../docs/architecture/infrastructure.md), [ADR-036](../../../docs/architecture/decisions.md).

## Purpose

Start the Node SDK only when app YAML `telemetry.enabled` is true. The extra `layer:telemetry` tag lets `type:app` bootstrap this package without opening `postgres`.

Not a Nest provider. Do not add `@Injectable()` or a `MetricsPort`.

## Layout

```
src/
  index.ts                 # public barrel
  lib/
    start-telemetry.ts     # env-gated SDK facade
    config/                # Zod schema + env mapping
    sdk/                   # NodeSDK, OTLP URLs, ignored incoming paths
    span/                  # applyActiveSpanAttributes
```

## Allowed imports

- `@opentelemetry/*` SDK, API, exporters, and instrumentations
- `zod`
- `@b2b-saas-starter-kit/platform`, `@b2b-saas-starter-kit/config`
- `node:` builtins

Never import Nest, domain, application, contracts, logger, nest-http, composition, postgres, redis, or other infrastructure packages.

## Bootstrap

Call `startTelemetry` **before** `LoggerLocator.init` and `NestFactory`. Dynamic-import `AppModule` afterwards so `pg` / ioredis / undici load after instrumentations register.

```typescript
const telemetry = await startTelemetry(
  mapTelemetryConfig({
    enabled: config.telemetry.enabled,
    otlpEndpoint: config.telemetry.otlpEndpoint,
    serviceName: config.telemetry.serviceName,
    appType: config.appType,
  }),
)

LoggerLocator.init(new PinoLogger({level: config.log.level}))

const {AppModule} = await import('./app/app.module')
```

`telemetry.enabled` defaults to `false`. When `true`, `telemetry.otlpEndpoint` is required (no localhost default). `telemetry.serviceName` defaults to `appType`. There is no `OTEL_SDK_DISABLED` switch.

When disabled, `startTelemetry` returns a no-op handle (including `shutdown()`). When enabled, the SDK exports OTLP HTTP traces and metrics, auto-instruments incoming/Node HTTP, `pg`, ioredis, and undici, and ignores `/live`, `/ready`, `/health`, and `/docs`. Tenant identity is a span attribute via `applyActiveSpanAttributes` — never a metric label.

## Commands

```bash
pnpm nx run telemetry:lint
pnpm nx run telemetry:typecheck
pnpm nx run telemetry:test
```
