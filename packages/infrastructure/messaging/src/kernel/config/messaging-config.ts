import {z} from 'zod'

export const messagingConfigSchema = z.object({
  REDIS_URL: z.url(),
  BULLMQ_PREFIX: z.string().min(1).default('bsk:bull'),
})

export type MessagingConfig = z.infer<typeof messagingConfigSchema>
