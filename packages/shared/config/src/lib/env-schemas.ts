import {z} from 'zod'

/** Node / Nest / Vite process environment. */
export const nodeEnvSchema = z
  .string()
  .optional()
  .transform((value): NodeEnv => (value === 'production' ? 'production' : 'development'))

export type NodeEnv = 'development' | 'production'

/** Product deploy environment. Apps extend this union (e.g. `development`, `preview`). */
export const appEnvSchema = z.enum(['staging', 'production'])

export type AppEnv = z.infer<typeof appEnvSchema>

/** Kit `appEnv`: product values plus local `development`. */
export const kitAppEnvSchema = z.union([appEnvSchema, z.literal('development')])

export type KitAppEnv = z.infer<typeof kitAppEnvSchema>
