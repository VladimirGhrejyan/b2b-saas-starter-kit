import {z} from 'zod'

export const adminConfigSchema = z.object({
  env: z.enum(['development', 'staging', 'production']),
  apiBaseUrl: z.url(),
})

export type AdminConfig = z.infer<typeof adminConfigSchema>
