import {z} from 'zod'

import {kitAppEnvSchema, nodeEnvSchema} from '@b2b-saas-starter-kit/config'

export const adminConfigSchema = z.object({
  appEnv: kitAppEnvSchema,
  nodeEnv: nodeEnvSchema,
  apiBaseUrl: z.url(),
})

export type AdminConfig = z.infer<typeof adminConfigSchema>
