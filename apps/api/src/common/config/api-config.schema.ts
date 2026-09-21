import {z} from 'zod'

import {
  kitAppEnvSchema,
  logSchema,
  mailProviderSchema,
  nodeEnvSchema,
  telemetrySchema,
} from '@b2b-saas-starter-kit/config'

import {appTypeSchema} from './schemas/app-type.schema'
import {httpSchema} from './schemas/http.schema'
import {httpClientSchema} from './schemas/http-client.schema'
import {jwtSchema} from './schemas/jwt.schema'
import {postgresSchema} from './schemas/postgres.schema'
import {redisSchema} from './schemas/redis.schema'

export const apiConfigSchema = z.object({
  appEnv: kitAppEnvSchema,
  nodeEnv: nodeEnvSchema,
  appType: appTypeSchema,
  http: httpSchema,
  postgres: postgresSchema,
  redis: redisSchema,
  httpClient: httpClientSchema,
  jwt: jwtSchema,
  log: logSchema,
  telemetry: telemetrySchema,
  mail: mailProviderSchema.optional(),
})

export type ApiConfig = z.infer<typeof apiConfigSchema>
