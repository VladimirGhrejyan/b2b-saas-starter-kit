import {z} from 'zod'

/** Env-driven bootstrap contract for the worker process. */
export const WorkerEnvSchema = z.object({
  APP_TYPE: z.literal('worker').default('worker'),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.string().optional(),
  TELEMETRY_ENABLED: z.enum(['true', 'false']).default('false'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().min(1).optional(),
  OTEL_SERVICE_NAME: z.string().min(1).optional(),
})

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>
