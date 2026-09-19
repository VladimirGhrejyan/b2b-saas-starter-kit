import type {Type} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry} from '@b2b-saas-starter-kit/telemetry'

import {WorkerEnvSchema} from './config/env.schema'

async function bootstrap() {
  const env = ConfigLoader.load(WorkerEnvSchema, {
    source: 'env',
    keys: [
      'APP_TYPE',
      'NODE_ENV',
      'LOG_LEVEL',
      'LOG_PRETTY',
      'TELEMETRY_ENABLED',
      'OTEL_EXPORTER_OTLP_ENDPOINT',
      'OTEL_SERVICE_NAME',
    ],
  })

  const telemetry = await startTelemetry(mapTelemetryConfig(env))

  LoggerLocator.init(
    new PinoLogger({
      level: env.LOG_LEVEL,
      isPretty: env.LOG_PRETTY ? env.LOG_PRETTY === 'true' : env.NODE_ENV === 'development',
    }),
  )

  const {AppModule} = (await import('./app/app.module.js')) as {AppModule: Type}
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })

  app.enableShutdownHooks()
  await new Promise<void>((resolve) => {
    const shutdown = () => {
      void app
        .close()
        .finally(() => telemetry.shutdown())
        .finally(resolve)
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}

void bootstrap()
