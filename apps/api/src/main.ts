import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'

import {ApiBuilder, registerProcessErrorHandlers} from '@b2b-saas-starter-kit/nest-http'

import {AppModule} from './app/app.module'
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
    ],
  })

  LoggerLocator.init(
    new PinoLogger({
      level: env.LOG_LEVEL,
      isPretty: env.LOG_PRETTY ? env.LOG_PRETTY === 'true' : env.NODE_ENV === 'development',
    }),
  )
  registerProcessErrorHandlers()

  const app = await NestFactory.create(AppModule)
  const httpConfig = mapApiHttpConfig(env)

  await new ApiBuilder(app, httpConfig)
    .useSecurity()
    .enableCors()
    .enableVersioning()
    .useGlobalPrefix()
    .enableShutdownHooks()
    .setupSwagger()
    .listen()
}

void bootstrap()
