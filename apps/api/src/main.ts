import {join} from 'node:path'

import {NestFactory} from '@nestjs/core'

import {AppConfigFiles} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry} from '@b2b-saas-starter-kit/telemetry'

import {ApiBuilder, registerProcessErrorHandlers} from '@b2b-saas-starter-kit/nest-http'

import {assertAuthBootstrap} from './common/auth/jwt/assert-auth-bootstrap'
import {loadApiConfig} from './common/config/load-api-config'
import {mapApiHttpConfig} from './common/config/map-api-http-config'

async function bootstrap() {
  const configDirectory = AppConfigFiles.resolveDirectory(join(__dirname, 'config'))
  const config = loadApiConfig(configDirectory)

  assertAuthBootstrap({
    nodeEnv: config.nodeEnv,
    appEnv: config.appEnv,
    jwtAccessSecret: config.jwt.accessSecret,
    corsOrigins: config.http.cors.origins,
  })

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
  registerProcessErrorHandlers()

  const {AppModule} = await import('./app/app.module.js')
  const app = await NestFactory.create(AppModule.forRoot(config))
  const httpConfig = mapApiHttpConfig(config)

  await new ApiBuilder(app, httpConfig)
    .useSecurity()
    .useCookies()
    .enableCors()
    .enableVersioning()
    .useGlobalPrefix()
    .enableShutdownHooks()
    .setupSwagger()
    .listen()

  const shutdown = () => {
    void app.close().finally(() => telemetry.shutdown())
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

void bootstrap()
