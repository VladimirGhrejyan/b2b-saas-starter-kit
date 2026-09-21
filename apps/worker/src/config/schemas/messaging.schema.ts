import {z} from 'zod'

export const messagingSchema = z.object({
  prefix: z.string().min(1).default('bsk:bull'),
})
