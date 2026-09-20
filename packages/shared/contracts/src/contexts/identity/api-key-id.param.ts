import {z} from 'zod'

import {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const apiKeyIdParamSchema = z
  .object({
    tenantId: TenantId.schema,
    apiKeyId: ApiKeyId.schema,
  })
  .meta({
    id: 'ApiKeyIdParam',
    description: 'Path parameters identifying a tenant API key',
  })

export type ApiKeyIdParam = z.infer<typeof apiKeyIdParamSchema>
