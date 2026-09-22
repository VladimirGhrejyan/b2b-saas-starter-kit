import {join} from 'node:path'

import {NestFactory} from '@nestjs/core'

import {AppConfigFiles} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry} from '@b2b-saas-starter-kit/telemetry'

import {loadWorkerConfig} from './config/load-worker-config'

async function bootstrap() {
  const configDirectory = AppConfigFiles.resolveDirectory(join(__dirname, 'config'))
  const config = loadWorkerConfig(configDirectory)

  const telemetry = await startTelemetry(
    mapTelemetryConfig({
      enabled: config.telemetry.enabled,
      otlpEndpoint: config.telemetry.otlpEndpoint,
      serviceName: config.telemetry.serviceName,
      appType: config.appType,
    }),
  )

  LoggerLocator.init(
    new PinoLogger({
      level: config.log.level,
      isPretty: config.log.pretty ?? config.nodeEnv === 'development',
    }),
  )

  const {AppModule} = await import('./app/app.module.js')
  const app = await NestFactory.createApplicationContext(AppModule.forRoot(config), {
    logger: ['error'],
    abortOnError: false,
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

void bootstrap().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
