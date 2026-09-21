import {z} from 'zod'

import {kitAppEnvSchema, nodeEnvSchema} from '@b2b-saas-starter-kit/config'

export const webConfigSchema = z.object({
  appEnv: kitAppEnvSchema,
  nodeEnv: nodeEnvSchema,
  apiBaseUrl: z.url(),
})

export type WebConfig = z.infer<typeof webConfigSchema>
