import {z} from 'zod'

export const postgresConfigSchema = z.object({
  DATABASE_URL: z.url(),
  POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(10),
  POSTGRES_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  POSTGRES_STATEMENT_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(15_000),
  POSTGRES_LOCK_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(5000),
  POSTGRES_IDLE_IN_TX_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(30_000),
  POSTGRES_APPLICATION_NAME: z.string().min(1).default('b2b-saas'),
  POSTGRES_SLOW_QUERY_MS: z.coerce.number().int().nonnegative().default(500),
})

export type PostgresConfig = z.infer<typeof postgresConfigSchema>
