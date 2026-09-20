import {z} from 'zod'

import {ApiKeyId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const createApiKeyOutputSchema = z
  .object({
    id: ApiKeyId.schema,
    token: z.string(),
  })
  .meta({
    id: 'CreateApiKeyOutput',
    description: 'Created API key id and the raw token, shown once',
  })

export type CreateApiKeyOutput = z.infer<typeof createApiKeyOutputSchema>
