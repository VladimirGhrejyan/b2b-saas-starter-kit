import {z} from 'zod'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const tenantIdParamSchema = z
  .object({
    tenantId: TenantId.schema,
  })
  .meta({
    id: 'TenantIdParam',
    description: 'Path parameter identifying a tenant',
  })

export type TenantIdParam = z.infer<typeof tenantIdParamSchema>
