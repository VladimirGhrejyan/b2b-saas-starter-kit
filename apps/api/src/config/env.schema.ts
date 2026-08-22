import {z} from 'zod'

/** Env-driven bootstrap contract for the API process. */
export const ApiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  APP_TYPE: z.literal('api').default('api'),
})

export type ApiEnv = z.infer<typeof ApiEnvSchema>
