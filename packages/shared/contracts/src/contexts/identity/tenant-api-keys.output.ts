import {z} from 'zod'

import {apiKeyOutputSchema} from './api-key.output'

export const tenantApiKeysOutputSchema = z
  .object({
    apiKeys: z.array(apiKeyOutputSchema),
  })
  .meta({
    id: 'TenantApiKeysOutput',
    description: 'API keys for a tenant',
  })

export type TenantApiKeysOutput = z.infer<typeof tenantApiKeysOutputSchema>
