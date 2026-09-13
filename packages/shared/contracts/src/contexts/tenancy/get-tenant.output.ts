import {z} from 'zod'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const getTenantOutputSchema = z
  .object({
    id: TenantId.schema,
    name: z.string(),
  })
  .meta({
    id: 'GetTenantOutput',
    description: 'Tenant id and name',
  })

export type GetTenantOutput = z.infer<typeof getTenantOutputSchema>
