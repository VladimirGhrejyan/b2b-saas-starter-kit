import type {Type} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'
import {mapTelemetryConfig, startTelemetry} from '@b2b-saas-starter-kit/telemetry'

import {ApiBuilder, registerProcessErrorHandlers} from '@b2b-saas-starter-kit/nest-http'

import {assertAuthBootstrap} from './common/auth/jwt/assert-auth-bootstrap'
import {ApiEnvSchema} from './common/config/env.schema'
import {mapApiHttpConfig} from './common/config/map-api-http-config'

async function bootstrap() {
  const env = ConfigLoader.load(ApiEnvSchema, {
    source: 'env',
    keys: [
      'PORT',
      'APP_TYPE',
      'NODE_ENV',
      'API_TITLE',
      'API_HOST',
      'API_VERSION',
      'API_GLOBAL_PREFIX',
      'API_PLAIN_HTTP',
      'CORS_ORIGINS',
      'CORS_CREDENTIALS',
      'SWAGGER_ENABLED',
      'SWAGGER_PATH',
      'SWAGGER_BASIC_AUTH_USER',
      'SWAGGER_BASIC_AUTH_PASSWORD',
      'LOG_LEVEL',
      'LOG_PRETTY',
      'TELEMETRY_ENABLED',
      'OTEL_EXPORTER_OTLP_ENDPOINT',
      'OTEL_SERVICE_NAME',
      'JWT_ACCESS_SECRET',
      'JWT_ACCESS_TTL_SECONDS',
      'JWT_ISSUER',
      'JWT_AUDIENCE',
    ],
  })

  assertAuthBootstrap(env.NODE_ENV, env.JWT_ACCESS_SECRET)

  const telemetry = await startTelemetry(mapTelemetryConfig(env))

  LoggerLocator.init(
    new PinoLogger({
      level: env.LOG_LEVEL,
      isPretty: env.LOG_PRETTY ? env.LOG_PRETTY === 'true' : env.NODE_ENV === 'development',
    }),
  )
  registerProcessErrorHandlers()

  const {AppModule} = (await import('./app/app.module.js')) as {AppModule: Type}
  const app = await NestFactory.create(AppModule)
  const httpConfig = mapApiHttpConfig(env)

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
