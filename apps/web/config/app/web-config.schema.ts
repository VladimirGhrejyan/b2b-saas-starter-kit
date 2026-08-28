import {z} from 'zod'

export const webConfigSchema = z.object({
  apiBaseUrl: z.url(),
})

export type WebConfig = z.infer<typeof webConfigSchema>
