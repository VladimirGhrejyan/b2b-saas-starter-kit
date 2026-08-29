import {z} from 'zod'

export const redisConfigSchema = z.object({
  REDIS_URL: z.url(),
  REDIS_KEY_PREFIX: z.string().default(''),
})

export type RedisConfig = z.infer<typeof redisConfigSchema>
