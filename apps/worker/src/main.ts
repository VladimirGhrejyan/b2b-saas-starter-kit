import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {LoggerLocator, PinoLogger} from '@b2b-saas-starter-kit/logger'

import {AppModule} from './app/app.module'
import {WorkerEnvSchema} from './config/env.schema'

async function bootstrap() {
  const env = ConfigLoader.load(WorkerEnvSchema, {
    source: 'env',
    keys: ['NODE_ENV', 'LOG_LEVEL', 'LOG_PRETTY'],
  })

  LoggerLocator.init(
    new PinoLogger({
      level: env.LOG_LEVEL,
      isPretty: env.LOG_PRETTY ? env.LOG_PRETTY === 'true' : env.NODE_ENV === 'development',
    }),
  )

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })

  app.enableShutdownHooks()
  await new Promise<void>((resolve) => {
    const shutdown = () => {
      void app.close().finally(resolve)
    }

    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}

void bootstrap()
