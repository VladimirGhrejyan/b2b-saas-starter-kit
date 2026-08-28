import {z} from 'zod'

export const webConfigSchema = z.object({
  env: z.enum(['development', 'staging', 'production']),
  apiBaseUrl: z.url(),
})

export type WebConfig = z.infer<typeof webConfigSchema>
