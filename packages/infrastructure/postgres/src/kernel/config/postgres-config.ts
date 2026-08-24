import {z} from 'zod'

export const postgresConfigSchema = z.object({
  DATABASE_URL: z.url(),
})

export type PostgresConfig = z.infer<typeof postgresConfigSchema>
