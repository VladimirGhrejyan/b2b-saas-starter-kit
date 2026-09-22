import {z} from 'zod'

import {kitAppEnvSchema, nodeEnvSchema} from '@b2b-saas-starter-kit/config'

const apiBaseUrlSchema = z.union([z.url(), z.string().regex(/^\/[A-Za-z0-9/._-]*$/)])

export const webConfigSchema = z.object({
  appEnv: kitAppEnvSchema,
  nodeEnv: nodeEnvSchema,
  apiBaseUrl: apiBaseUrlSchema,
})

export type WebConfig = z.infer<typeof webConfigSchema>
