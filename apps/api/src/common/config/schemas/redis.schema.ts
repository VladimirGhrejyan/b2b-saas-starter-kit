import {z} from 'zod'

export const redisSchema = z.object({
  url: z.url(),
  keyPrefix: z.string().default(''),
})
