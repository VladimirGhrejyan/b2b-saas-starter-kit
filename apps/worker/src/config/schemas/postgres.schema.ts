import {z} from 'zod'

export const postgresSchema = z.object({
  url: z.url(),
  poolMax: z.number().int().positive().default(10),
  connectTimeoutMs: z.number().int().positive().default(5000),
  statementTimeoutMs: z.number().int().nonnegative().default(15_000),
  lockTimeoutMs: z.number().int().nonnegative().default(5000),
  idleInTxTimeoutMs: z.number().int().nonnegative().default(30_000),
  applicationName: z.string().min(1).default('b2b-saas-worker'),
  slowQueryMs: z.number().int().nonnegative().default(500),
})
