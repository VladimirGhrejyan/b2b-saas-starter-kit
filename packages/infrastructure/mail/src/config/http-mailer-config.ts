import {z} from 'zod'

export const httpMailerConfigSchema = z.object({
  url: z.url(),
  from: z.string().min(1),
  apiKey: z.string().min(1).optional(),
})

export type HttpMailerConfig = z.infer<typeof httpMailerConfigSchema>
