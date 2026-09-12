import {z} from 'zod'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const selectTenantInputSchema = z
  .object({
    tenantId: TenantId.schema,
  })
  .meta({
    id: 'SelectTenantInput',
    description: 'Body for selecting the active tenant on the access token',
  })

export type SelectTenantInput = z.infer<typeof selectTenantInputSchema>
