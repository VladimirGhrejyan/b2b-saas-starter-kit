import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {AppModule} from './app/app.module'
import {ApiEnvSchema} from './config/env.schema'

async function bootstrap() {
  const env = ConfigLoader.load(ApiEnvSchema, {source: 'env', keys: ['PORT', 'APP_TYPE']})
  const app = await NestFactory.create(AppModule)

  await app.listen(env.PORT)
  Logger.log(`Hello World (${env.APP_TYPE}) listening on http://localhost:${env.PORT}`)
}

void bootstrap()
