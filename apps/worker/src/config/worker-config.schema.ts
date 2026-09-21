import {z} from 'zod'

import {
  kitAppEnvSchema,
  logSchema,
  mailProviderSchema,
  nodeEnvSchema,
  telemetrySchema,
} from '@b2b-saas-starter-kit/config'

import {appTypeSchema} from './schemas/app-type.schema'
import {maintenanceSchema} from './schemas/maintenance.schema'
import {messagingSchema} from './schemas/messaging.schema'
import {outboxSchema} from './schemas/outbox.schema'
import {postgresSchema} from './schemas/postgres.schema'
import {redisSchema} from './schemas/redis.schema'

export const workerConfigSchema = z.object({
  appEnv: kitAppEnvSchema,
  nodeEnv: nodeEnvSchema,
  appType: appTypeSchema,
  postgres: postgresSchema,
  redis: redisSchema,
  messaging: messagingSchema,
  outbox: outboxSchema,
  maintenance: maintenanceSchema,
  log: logSchema,
  telemetry: telemetrySchema,
  mail: mailProviderSchema.optional(),
})

export type WorkerConfig = z.infer<typeof workerConfigSchema>
