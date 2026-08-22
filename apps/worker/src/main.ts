import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {AppModule} from './app/app.module'
import {WorkerEnvSchema} from './config/env.schema'

async function bootstrap() {
  ConfigLoader.load(WorkerEnvSchema, {source: 'env', keys: ['APP_TYPE']})
  const app = await NestFactory.createApplicationContext(AppModule)

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
